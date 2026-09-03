import { MockAdapter } from "@whatsbot/whatsapp-adapter";
import { describe, expect, it } from "vitest";
import { EchoAiResponder } from "../src/domain/aiResponder.js";
import { welcomeFlow } from "../src/domain/defaultFlow.js";
import { DEFAULT_USER_ID } from "../src/domain/defaultUser.js";
import { InMemoryConversationRepository } from "../src/repositories/conversationRepository.js";
import { InMemoryFlowRepository } from "../src/repositories/flowRepository.js";
import { InMemorySettingsRepository } from "../src/repositories/settingsRepository.js";
import { buildServer } from "../src/server.js";

describe("GET /conversations", () => {
  it("lists conversations created through the webhook, for the CRM Kanban view", async () => {
    const app = buildServer({
      adapter: new MockAdapter(),
      aiResponder: new EchoAiResponder(),
      flowRepository: new InMemoryFlowRepository(DEFAULT_USER_ID, [welcomeFlow]),
      conversationRepository: new InMemoryConversationRepository(),
      settingsRepository: new InMemorySettingsRepository({
        metaVerifyToken: "test-verify-token",
        activeFlowId: welcomeFlow.id,
      }),
    });

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
                contacts: [{ profile: { name: "Maria" }, wa_id: "5511999998888" }],
                messages: [
                  { from: "5511999998888", id: "wamid.1", timestamp: "1", type: "text", text: { body: "Oi" } },
                ],
              },
            },
          ],
        },
      ],
    };
    await app.inject({ method: "POST", url: "/webhook/whatsapp", payload });

    const response = await app.inject({ method: "GET", url: "/conversations" });

    expect(response.statusCode).toBe(200);
    const conversations = response.json();
    expect(conversations).toHaveLength(1);
    expect(conversations[0]).toMatchObject({ phone: "5511999998888", contactName: "Maria" });
  });

  it("starts with an empty list", async () => {
    const app = buildServer({
      adapter: new MockAdapter(),
      aiResponder: new EchoAiResponder(),
      flowRepository: new InMemoryFlowRepository(DEFAULT_USER_ID, [welcomeFlow]),
      conversationRepository: new InMemoryConversationRepository(),
      settingsRepository: new InMemorySettingsRepository({
        metaVerifyToken: "test-verify-token",
        activeFlowId: welcomeFlow.id,
      }),
    });

    const response = await app.inject({ method: "GET", url: "/conversations" });

    expect(response.json()).toEqual([]);
  });
});
