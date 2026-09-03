export interface OutgoingTextMessage {
  /** Customer phone number in international format, digits only (e.g. "5511999998888"). */
  to: string;
  text: string;
}

export interface SendResult {
  id: string;
}

export interface IncomingMessage {
  from: string;
  contactName?: string;
  text: string;
  messageId: string;
  timestamp: string;
}

/** Anything that can deliver a WhatsApp message — implemented by the real Meta adapter and the in-memory mock. */
export interface WhatsAppAdapter {
  sendText(message: OutgoingTextMessage): Promise<SendResult>;
}
