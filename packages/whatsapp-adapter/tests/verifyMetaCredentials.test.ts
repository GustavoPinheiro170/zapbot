import { describe, expect, it, vi } from "vitest";
import { verifyMetaCredentials } from "../src/verifyMetaCredentials.js";

function fakeFetch(response: { ok: boolean; status: number; body: unknown }) {
  return vi.fn().mockResolvedValue({
    ok: response.ok,
    status: response.status,
    json: async () => response.body,
  });
}

describe("verifyMetaCredentials", () => {
  it("returns ok with the display phone number when the credentials are valid", async () => {
    const fetchImpl = fakeFetch({
      ok: true,
      status: 200,
      body: { display_phone_number: "+55 11 99999-8888", verified_name: "ZapFlow" },
    });

    const result = await verifyMetaCredentials({
      accessToken: "GOOD_TOKEN",
      phoneNumberId: "123456789",
      fetchImpl,
    });

    expect(result).toEqual({ ok: true, displayPhoneNumber: "+55 11 99999-8888" });
    const [url, init] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      "https://graph.facebook.com/v20.0/123456789?fields=display_phone_number,verified_name",
    );
    expect(init.headers).toMatchObject({ Authorization: "Bearer GOOD_TOKEN" });
  });

  it("returns ok:false with the Graph API's error message when the token is invalid", async () => {
    const fetchImpl = fakeFetch({
      ok: false,
      status: 401,
      body: { error: { message: "Invalid OAuth access token" } },
    });

    const result = await verifyMetaCredentials({
      accessToken: "BAD_TOKEN",
      phoneNumberId: "123456789",
      fetchImpl,
    });

    expect(result).toEqual({ ok: false, error: "Invalid OAuth access token" });
  });

  it("falls back to a generic message when the Graph API gives no error detail", async () => {
    const fetchImpl = fakeFetch({ ok: false, status: 500, body: {} });

    const result = await verifyMetaCredentials({
      accessToken: "TOKEN",
      phoneNumberId: "123456789",
      fetchImpl,
    });

    expect(result).toEqual({ ok: false, error: "Falha na verificação (500)" });
  });
});
