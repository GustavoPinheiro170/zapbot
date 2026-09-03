import { MockAdapter } from "@whatsbot/whatsapp-adapter";
import { describe, expect, it, vi } from "vitest";
import { DynamicAdapter } from "../src/domain/dynamicAdapter.js";
import { InMemorySettingsRepository } from "../src/repositories/settingsRepository.js";

describe("DynamicAdapter", () => {
  it("falls back to the given adapter when no WhatsApp credentials are configured yet", async () => {
    const fallback = new MockAdapter();
    const settings = new InMemorySettingsRepository({ metaVerifyToken: "x", activeFlowId: "welcome" });
    const adapter = new DynamicAdapter(settings, fallback);

    await adapter.sendText({ to: "5511999998888", text: "Oi" });

    expect(fallback.sentMessages).toEqual([{ to: "5511999998888", text: "Oi" }]);
  });

  it("sends through the real Meta Cloud API once credentials are configured", async () => {
    const fallback = new MockAdapter();
    const settings = new InMemorySettingsRepository({
      metaVerifyToken: "x",
      activeFlowId: "welcome",
      metaAccessToken: "TOKEN",
      metaPhoneNumberId: "123",
    });
    const adapter = new DynamicAdapter(settings, fallback);
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ messages: [{ id: "wamid.1" }] }),
    });
    adapter.fetchImpl = fetchImpl;

    const result = await adapter.sendText({ to: "5511999998888", text: "Oi" });

    expect(result).toEqual({ id: "wamid.1" });
    expect(fallback.sentMessages).toEqual([]);
    expect(fetchImpl).toHaveBeenCalledWith(
      "https://graph.facebook.com/v20.0/123/messages",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("picks up newly saved credentials without being reconstructed", async () => {
    const fallback = new MockAdapter();
    const settings = new InMemorySettingsRepository({ metaVerifyToken: "x", activeFlowId: "welcome" });
    const adapter = new DynamicAdapter(settings, fallback);
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ messages: [{ id: "wamid.1" }] }),
    });
    adapter.fetchImpl = fetchImpl;

    await adapter.sendText({ to: "5511999998888", text: "Antes de conectar" });
    expect(fallback.sentMessages).toHaveLength(1);

    settings.update({ metaAccessToken: "TOKEN", metaPhoneNumberId: "123" });
    await adapter.sendText({ to: "5511999998888", text: "Depois de conectar" });

    expect(fallback.sentMessages).toHaveLength(1);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
});
