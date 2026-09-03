import { step } from "@whatsbot/flow-engine";
import type { WhatsAppAdapter } from "@whatsbot/whatsapp-adapter";
import type { AiResponder } from "./aiResponder.js";
import type { ConversationRecord, InMemoryConversationRepository } from "../repositories/conversationRepository.js";
import type { FlowRepository } from "../repositories/flowRepository.js";
import type { InMemorySettingsRepository } from "../repositories/settingsRepository.js";

export interface ConversationSessionDeps {
  flowRepository: FlowRepository;
  conversationRepository: InMemoryConversationRepository;
  adapter: WhatsAppAdapter;
  aiResponder: AiResponder;
  /** Read live so activating a different flow (see POST /flows/:id/activate) applies immediately. */
  settingsRepository: InMemorySettingsRepository;
  /** Whose flows the bot runs — see domain/defaultUser.ts. */
  ownerUserId: string;
}

export interface IncomingTextInput {
  from: string;
  text: string;
  contactName?: string;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/** Wires one inbound WhatsApp message through the flow engine and executes whatever it decides. */
export class ConversationSession {
  constructor(private readonly deps: ConversationSessionDeps) {}

  async handleIncomingMessage(input: IncomingTextInput): Promise<ConversationRecord> {
    const { flowRepository, conversationRepository, aiResponder, settingsRepository, ownerUserId } = this.deps;

    const activeFlowId = settingsRepository.get().activeFlowId;
    const record = conversationRepository.getOrCreate(input.from, activeFlowId, input.contactName);
    const flow = await flowRepository.get(ownerUserId, record.flowId);
    if (!flow) {
      throw new Error(`Unknown flow "${record.flowId}"`);
    }

    record.history.push({ direction: "in", text: input.text, at: new Date().toISOString() });

    // A conversation with nothing pending (never started, or a previous flow ran off the end
    // without an explicit end/handoff) restarts from the flow's entry point.
    const isAwaitingNothing = record.engineState.currentNodeId === null && !record.engineState.awaitingVariable;
    const result = step(flow, record.engineState, isAwaitingNothing ? null : input.text);
    record.engineState = result.state;

    for (const action of result.actions) {
      switch (action.type) {
        case "sendMessage": {
          await this.sendAndRecord(record, input.from, action.text);
          break;
        }
        case "setStage": {
          record.stage = action.stage;
          break;
        }
        case "handoff": {
          record.needsHuman = true;
          break;
        }
        case "requestAiReply": {
          let reply: string;
          try {
            reply = await aiResponder.reply({ systemPrompt: action.systemPrompt, userMessage: action.userMessage });
          } catch (error) {
            record.history.push({
              direction: "out",
              text: "(a IA não conseguiu gerar uma resposta)",
              at: new Date().toISOString(),
              status: "failed",
              error: errorMessage(error),
            });
            break;
          }
          await this.sendAndRecord(record, input.from, reply);
          break;
        }
      }
    }

    conversationRepository.save(record);
    return record;
  }

  /**
   * A rejected send (e.g. WhatsApp's 24h session-window rule) must never crash the webhook
   * request or leave the conversation's engine state out of sync with what the customer
   * actually received — it's recorded as a failed history entry instead.
   */
  private async sendAndRecord(record: ConversationRecord, to: string, text: string): Promise<void> {
    try {
      await this.deps.adapter.sendText({ to, text });
      record.history.push({ direction: "out", text, at: new Date().toISOString(), status: "sent" });
    } catch (error) {
      record.history.push({
        direction: "out",
        text,
        at: new Date().toISOString(),
        status: "failed",
        error: errorMessage(error),
      });
    }
  }
}
