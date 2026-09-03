import type { IncomingMessage } from "./types.js";

interface RawTextMessage {
  from: string;
  id: string;
  timestamp: string;
  type: string;
  text?: { body: string };
}

interface RawContact {
  profile?: { name?: string };
  wa_id: string;
}

interface RawChangeValue {
  messages?: RawTextMessage[];
  contacts?: RawContact[];
}

interface RawEntry {
  changes?: { field?: string; value?: RawChangeValue }[];
}

interface RawWebhookPayload {
  object?: string;
  entry?: RawEntry[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/**
 * Extracts inbound text messages from a raw Meta WhatsApp Cloud API webhook body.
 * Delivery/read status callbacks and non-text messages (image, audio, ...) are silently
 * skipped rather than treated as errors, since Meta sends both through the same endpoint.
 */
export function parseIncomingWebhook(payload: unknown): IncomingMessage[] {
  if (!isRecord(payload) || payload.object !== "whatsapp_business_account") {
    return [];
  }

  const raw = payload as RawWebhookPayload;
  const messages: IncomingMessage[] = [];

  for (const entry of raw.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const value = change.value;
      if (!value?.messages) continue;

      const contactsByWaId = new Map((value.contacts ?? []).map((contact) => [contact.wa_id, contact]));

      for (const message of value.messages) {
        if (message.type !== "text" || !message.text) continue;

        const contact = contactsByWaId.get(message.from);
        messages.push({
          from: message.from,
          contactName: contact?.profile?.name,
          text: message.text.body,
          messageId: message.id,
          timestamp: message.timestamp,
        });
      }
    }
  }

  return messages;
}
