import { createInitialState, type EngineState } from "@whatsbot/flow-engine";

export interface HistoryEntry {
  direction: "in" | "out";
  text: string;
  at: string;
  /** Only meaningful for "out": whether the WhatsApp API actually accepted the send. */
  status?: "sent" | "failed";
  error?: string;
}

export interface ConversationRecord {
  phone: string;
  contactName?: string;
  flowId: string;
  engineState: EngineState;
  /** CRM Kanban stage — null until the flow calls a setStage node. */
  stage: string | null;
  needsHuman: boolean;
  history: HistoryEntry[];
}

/** In-memory by design for this MVP skeleton — see the note on InMemoryFlowRepository. */
export class InMemoryConversationRepository {
  private readonly conversations = new Map<string, ConversationRecord>();

  getOrCreate(phone: string, defaultFlowId: string, contactName?: string): ConversationRecord {
    const existing = this.conversations.get(phone);
    if (existing) {
      if (contactName && !existing.contactName) {
        existing.contactName = contactName;
      }
      return existing;
    }

    const record: ConversationRecord = {
      phone,
      contactName,
      flowId: defaultFlowId,
      engineState: createInitialState(),
      stage: null,
      needsHuman: false,
      history: [],
    };
    this.conversations.set(phone, record);
    return record;
  }

  save(record: ConversationRecord): void {
    this.conversations.set(record.phone, record);
  }

  get(phone: string): ConversationRecord | undefined {
    return this.conversations.get(phone);
  }

  list(): ConversationRecord[] {
    return [...this.conversations.values()];
  }
}
