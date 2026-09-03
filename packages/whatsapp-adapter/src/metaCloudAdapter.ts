import type { OutgoingTextMessage, SendResult, WhatsAppAdapter } from "./types.js";

type FetchLike = typeof fetch;

export interface MetaCloudAdapterConfig {
  phoneNumberId: string;
  accessToken: string;
  /** Defaults to the current stable Graph API version. */
  apiVersion?: string;
  /** Injectable for tests; defaults to the global `fetch`. */
  fetchImpl?: FetchLike;
}

interface MetaSendResponse {
  messages?: { id: string }[];
  error?: { message?: string };
}

/** Real integration with WhatsApp's official Cloud API (https://developers.facebook.com/docs/whatsapp/cloud-api). */
export class MetaCloudAdapter implements WhatsAppAdapter {
  private readonly phoneNumberId: string;
  private readonly accessToken: string;
  private readonly apiVersion: string;
  private readonly fetchImpl: FetchLike;

  constructor(config: MetaCloudAdapterConfig) {
    this.phoneNumberId = config.phoneNumberId;
    this.accessToken = config.accessToken;
    this.apiVersion = config.apiVersion ?? "v20.0";
    this.fetchImpl = config.fetchImpl ?? fetch;
  }

  async sendText(message: OutgoingTextMessage): Promise<SendResult> {
    const url = `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/messages`;

    const response = await this.fetchImpl(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: message.to,
        type: "text",
        text: { body: message.text },
      }),
    });

    const body = (await response.json()) as MetaSendResponse;

    if (!response.ok) {
      const reason = body.error?.message ?? "unknown error";
      throw new Error(`WhatsApp API request failed (${response.status}): ${reason}`);
    }

    const id = body.messages?.[0]?.id;
    if (!id) {
      throw new Error("WhatsApp API responded without a message id");
    }

    return { id };
  }
}
