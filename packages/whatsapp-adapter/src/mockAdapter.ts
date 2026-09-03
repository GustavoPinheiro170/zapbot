import type { OutgoingTextMessage, SendResult, WhatsAppAdapter } from "./types.js";

/** In-memory adapter for local development and tests — no network calls, no WhatsApp credentials needed. */
export class MockAdapter implements WhatsAppAdapter {
  readonly sentMessages: OutgoingTextMessage[] = [];
  private counter = 0;

  async sendText(message: OutgoingTextMessage): Promise<SendResult> {
    this.sentMessages.push(message);
    this.counter += 1;
    return { id: `mock-${this.counter}` };
  }
}
