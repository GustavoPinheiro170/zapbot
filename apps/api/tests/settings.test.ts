import { MockAdapter } from "@whatsbot/whatsapp-adapter";
import { describe, expect, it, vi } from "vitest";
import { EchoAiResponder } from "../src/domain/aiResponder.js";
import { welcomeFlow } from "../src/domain/defaultFlow.js";
import { DEFAULT_USER_ID } from "../src/domain/defaultUser.js";
import { InMemoryConversationRepository } from "../src/repositories/conversationRepository.js";
import { InMemoryFlowRepository } from "../src/repositories/flowRepository.js";
import { InMemorySettingsRepository } from "../src/repositories/settingsRepository.js";
import { buildServer } from "../src/server.js";

function buildTestServer(initialSettings = { metaVerifyToken: "test-verify-token", activeFlowId: welcomeFlow.id }) {
  const settingsRepository = new InMemorySettingsRepository(initialSettings);
  const app = buildServer({
    adapter: new MockAdapter(),
    aiResponder: new EchoAiResponder(),
    flowRepository: new InMemoryFlowRepository(DEFAULT_USER_ID, [welcomeFlow]),
    conversationRepository: new InMemoryConversationRepository(),
    settingsRepository,
  });
  return { app, settingsRepository };
}

describe("GET /settings", () => {
  it("reports not connected and never echoes back a token that was never set", async () => {
    const { app } = buildTestServer();

    const response = await app.inject({ method: "GET", url: "/settings" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      metaPhoneNumberId: "",
      metaVerifyToken: "test-verify-token",
      hasAccessToken: false,
      connected: false,
      activeFlowId: welcomeFlow.id,
    });
  });
});

describe("POST /settings", () => {
  it("saves the credentials and reports connected without exposing the raw token", async () => {
    const { app } = buildTestServer();

    const response = await app.inject({
      method: "POST",
      url: "/settings",
      payload: { metaAccessToken: "SECRET_TOKEN", metaPhoneNumberId: "123456789" },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body).toMatchObject({ metaPhoneNumberId: "123456789", hasAccessToken: true, connected: true });
    expect(JSON.stringify(body)).not.toContain("SECRET_TOKEN");
  });

  it("keeps the previously saved token when the field is left blank", async () => {
    const { app } = buildTestServer();
    await app.inject({
      method: "POST",
      url: "/settings",
      payload: { metaAccessToken: "SECRET_TOKEN", metaPhoneNumberId: "123456789" },
    });

    const response = await app.inject({
      method: "POST",
      url: "/settings",
      payload: { metaPhoneNumberId: "999999999" },
    });

    expect(response.json()).toMatchObject({ metaPhoneNumberId: "999999999", hasAccessToken: true, connected: true });
  });

  it("updates the verify token used by the webhook handshake immediately", async () => {
    const { app } = buildTestServer();
    await app.inject({ method: "POST", url: "/settings", payload: { metaVerifyToken: "new-token" } });

    const response = await app.inject({
      method: "GET",
      url: "/webhook/whatsapp?hub.mode=subscribe&hub.verify_token=new-token&hub.challenge=42",
    });

    expect(response.statusCode).toBe(200);
    expect(response.body).toBe("42");
  });
});

describe("POST /settings/test-connection", () => {
  it("returns a 400 when credentials are not configured yet", async () => {
    const { app } = buildTestServer();

    const response = await app.inject({ method: "POST", url: "/settings/test-connection" });

    expect(response.statusCode).toBe(400);
  });

  it("confirms the connection using the real Graph API contract, through an injected fetch", async () => {
    const { app, settingsRepository } = buildTestServer();
    settingsRepository.update({ metaAccessToken: "TOKEN", metaPhoneNumberId: "123456789" });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ display_phone_number: "+55 11 99999-8888" }),
      }),
    );

    const response = await app.inject({ method: "POST", url: "/settings/test-connection" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ ok: true, displayPhoneNumber: "+55 11 99999-8888" });
    vi.unstubAllGlobals();
  });
});
