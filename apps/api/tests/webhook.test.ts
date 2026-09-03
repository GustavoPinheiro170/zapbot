import { MockAdapter } from "@whatsbot/whatsapp-adapter";
import { describe, expect, it } from "vitest";
import { EchoAiResponder } from "../src/domain/aiResponder.js";
import { welcomeFlow } from "../src/domain/defaultFlow.js";
import { DEFAULT_USER_ID } from "../src/domain/defaultUser.js";
import { InMemoryConversationRepository } from "../src/repositories/conversationRepository.js";
import { InMemoryFlowRepository } from "../src/repositories/flowRepository.js";
import { InMemorySettingsRepository } from "../src/repositories/settingsRepository.js";
import { buildServer } from "../src/server.js";

function buildTestServer() {
  const adapter = new MockAdapter();
  const flowRepository = new InMemoryFlowRepository(DEFAULT_USER_ID, [welcomeFlow]);
  const conversationRepository = new InMemoryConversationRepository();
  const settingsRepository = new InMemorySettingsRepository({
    metaVerifyToken: "test-verify-token",
    activeFlowId: welcomeFlow.id,
  });
  const app = buildServer({
    adapter,
    aiResponder: new EchoAiResponder(),
    flowRepository,
    conversationRepository,
    settingsRepository,
  });
  return { app, adapter, flowRepository, conversationRepository };
}

function incomingTextPayload(from: string, text: string, contactName = "Maria") {
  return {
    object: "whatsapp_business_account",
    entry: [
      {
        id: "WABA",
        changes: [
          {
            field: "messages",
            value: {
              messaging_product: "whatsapp",
              metadata: { display_phone_number: "1", phone_number_id: "1" },
              contacts: [{ profile: { name: contactName }, wa_id: from }],
              messages: [
                { from, id: `wamid.${Math.random()}`, timestamp: "1", type: "text", text: { body: text } },
              ],
            },
          },
        ],
      },
    ],
  };
}

describe("GET /webhook/whatsapp (Meta verification handshake)", () => {
  it("echoes the challenge back when the verify token matches", async () => {
    const { app } = buildTestServer();

    const response = await app.inject({
      method: "GET",
      url: "/webhook/whatsapp?hub.mode=subscribe&hub.verify_token=test-verify-token&hub.challenge=12345",
    });

    expect(response.statusCode).toBe(200);
    expect(response.body).toBe("12345");
  });

  it("rejects with 403 when the verify token does not match", async () => {
    const { app } = buildTestServer();

    const response = await app.inject({
      method: "GET",
      url: "/webhook/whatsapp?hub.mode=subscribe&hub.verify_token=wrong&hub.challenge=12345",
    });

    expect(response.statusCode).toBe(403);
  });
});

describe("POST /webhook/whatsapp (incoming messages)", () => {
  it("starts the default flow for a first-time contact and replies through the adapter", async () => {
    const { app, adapter, conversationRepository } = buildTestServer();

    const response = await app.inject({
      method: "POST",
      url: "/webhook/whatsapp",
      payload: incomingTextPayload("5511999998888", "Oi"),
    });

    expect(response.statusCode).toBe(200);
    expect(adapter.sentMessages).toHaveLength(1);
    expect(adapter.sentMessages[0]?.to).toBe("5511999998888");

    const conversation = conversationRepository.get("5511999998888");
    expect(conversation?.contactName).toBe("Maria");
    expect(conversation?.engineState.awaitingVariable).toBe("name");
  });

  it("carries the conversation forward across turns, reaching the AI hand-off branch", async () => {
    const { app, adapter } = buildTestServer();
    const from = "5511999998888";

    await app.inject({ method: "POST", url: "/webhook/whatsapp", payload: incomingTextPayload(from, "Oi") });
    await app.inject({ method: "POST", url: "/webhook/whatsapp", payload: incomingTextPayload(from, "Maria") });
    await app.inject({ method: "POST", url: "/webhook/whatsapp", payload: incomingTextPayload(from, "vendas") });

    expect(adapter.sentMessages.length).toBeGreaterThanOrEqual(3);
    expect(
      adapter.sentMessages.some(
        (message) => message.text.includes("vendas") || message.text.toLowerCase().includes("especialista"),
      ),
    ).toBe(true);
  });

  it("keeps processing the rest of the batch and still returns 200 even if one message in it fails", async () => {
    const { app, adapter, conversationRepository } = buildTestServer();
    // Pre-seed a conversation pointing at a flow that doesn't exist, so this contact's turn throws.
    conversationRepository.getOrCreate("5511900000000", "does-not-exist");

    const payload = {
      object: "whatsapp_business_account",
      entry: [
        {
          id: "WABA",
          changes: [
            {
              field: "messages",
              value: {
                messaging_product: "whatsapp",
                metadata: { display_phone_number: "1", phone_number_id: "1" },
                contacts: [
                  { profile: { name: "Bug" }, wa_id: "5511900000000" },
                  { profile: { name: "Maria" }, wa_id: "5511999998888" },
                ],
                messages: [
                  { from: "5511900000000", id: "wamid.1", timestamp: "1", type: "text", text: { body: "Oi" } },
                  { from: "5511999998888", id: "wamid.2", timestamp: "1", type: "text", text: { body: "Oi" } },
                ],
              },
            },
          ],
        },
      ],
    };

    const response = await app.inject({ method: "POST", url: "/webhook/whatsapp", payload });

    expect(response.statusCode).toBe(200);
    expect(adapter.sentMessages.some((message) => message.to === "5511999998888")).toBe(true);
  });
});
