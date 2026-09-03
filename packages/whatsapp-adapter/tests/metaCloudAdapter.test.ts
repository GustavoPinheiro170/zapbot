import { describe, expect, it, vi } from "vitest";
import { MetaCloudAdapter } from "../src/metaCloudAdapter.js";

function fakeFetch(response: { ok: boolean; status: number; body: unknown }) {
  return vi.fn().mockResolvedValue({
    ok: response.ok,
    status: response.status,
    json: async () => response.body,
    text: async () => JSON.stringify(response.body),
  });
}

describe("MetaCloudAdapter", () => {
  it("posts to the correct Graph API URL with the correct headers and payload", async () => {
    const fetchImpl = fakeFetch({ ok: true, status: 200, body: { messages: [{ id: "wamid.SENT1" }] } });
    const adapter = new MetaCloudAdapter({
      phoneNumberId: "123456789",
      accessToken: "TEST_TOKEN",
      fetchImpl,
    });

    const result = await adapter.sendText({ to: "5511999998888", text: "Olá! Como posso ajudar?" });

    expect(result).toEqual({ id: "wamid.SENT1" });
    expect(fetchImpl).toHaveBeenCalledTimes(1);

    const [url, init] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://graph.facebook.com/v20.0/123456789/messages");
    expect(init.method).toBe("POST");
    expect(init.headers).toMatchObject({
      Authorization: "Bearer TEST_TOKEN",
      "Content-Type": "application/json",
    });
    expect(JSON.parse(init.body as string)).toEqual({
      messaging_product: "whatsapp",
      to: "5511999998888",
      type: "text",
      text: { body: "Olá! Como posso ajudar?" },
    });
  });

  it("throws a descriptive error when the Graph API responds with a non-ok status", async () => {
    const fetchImpl = fakeFetch({
      ok: false,
      status: 401,
      body: { error: { message: "Invalid OAuth access token" } },
    });
    const adapter = new MetaCloudAdapter({
      phoneNumberId: "123456789",
      accessToken: "BAD_TOKEN",
      fetchImpl,
    });

    await expect(adapter.sendText({ to: "5511999998888", text: "Oi" })).rejects.toThrow(
      /WhatsApp API request failed \(401\)/,
    );
  });
});
