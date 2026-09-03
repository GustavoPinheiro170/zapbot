import type { Flow } from "@whatsbot/flow-engine";
import type { OutgoingTextMessage, SendResult, WhatsAppAdapter } from "@whatsbot/whatsapp-adapter";
import { describe, expect, it } from "vitest";
import { EchoAiResponder } from "../src/domain/aiResponder.js";
import { ConversationSession } from "../src/domain/conversationSession.js";
import { InMemoryConversationRepository } from "../src/repositories/conversationRepository.js";
import { InMemoryFlowRepository } from "../src/repositories/flowRepository.js";
import { InMemorySettingsRepository } from "../src/repositories/settingsRepository.js";

const USER_ID = "owner";

/** Simulates WhatsApp rejecting the send — e.g. the 24h session-window rule (error 131047). */
class FailingAdapter implements WhatsAppAdapter {
  async sendText(_message: OutgoingTextMessage): Promise<SendResult> {
    throw new Error("WhatsApp API request failed (400): Re-engagement message");
  }
}

function buildFlow(): Flow {
  return {
    id: "f1",
    name: "Fluxo",
    entryNodeId: "greet",
    nodes: [
      { id: "greet", type: "message", text: "Olá!", next: "stage" },
      { id: "stage", type: "setStage", stage: "novo-lead" },
    ],
  };
}

function buildSession(adapter: WhatsAppAdapter) {
  return new ConversationSession({
    flowRepository: new InMemoryFlowRepository(USER_ID, [buildFlow()]),
    conversationRepository: new InMemoryConversationRepository(),
    adapter,
    aiResponder: new EchoAiResponder(),
    settingsRepository: new InMemorySettingsRepository({ metaVerifyToken: "x", activeFlowId: "f1" }),
    ownerUserId: USER_ID,
  });
}

describe("ConversationSession", () => {
  it("does not throw when the adapter fails to send, and records the failure in history", async () => {
    const session = buildSession(new FailingAdapter());

    const record = await session.handleIncomingMessage({ from: "5511999998888", text: "Oi" });

    const outbound = record.history.find((entry) => entry.direction === "out");
    expect(outbound).toMatchObject({ status: "failed" });
    expect(outbound?.error).toContain("Re-engagement message");
  });

  it("still applies actions that don't depend on delivery, like moving the CRM stage", async () => {
    const session = buildSession(new FailingAdapter());

    const record = await session.handleIncomingMessage({ from: "5511999998888", text: "Oi" });

    expect(record.stage).toBe("novo-lead");
  });

  it("marks a successful send as sent in history", async () => {
    const sentMessages: OutgoingTextMessage[] = [];
    const adapter: WhatsAppAdapter = {
      async sendText(message) {
        sentMessages.push(message);
        return { id: "wamid.ok" };
      },
    };
    const session = buildSession(adapter);

    const record = await session.handleIncomingMessage({ from: "5511999998888", text: "Oi" });

    const outbound = record.history.find((entry) => entry.direction === "out");
    expect(outbound).toMatchObject({ status: "sent", text: "Olá!" });
    expect(sentMessages).toHaveLength(1);
  });
});
