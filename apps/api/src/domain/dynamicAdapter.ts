import { MetaCloudAdapter, type OutgoingTextMessage, type SendResult, type WhatsAppAdapter } from "@whatsbot/whatsapp-adapter";
import type { InMemorySettingsRepository } from "../repositories/settingsRepository.js";

/**
 * Sends through the real Meta Cloud API the moment credentials are saved in settings —
 * no server restart needed. Falls back to whatever adapter it was built with (the
 * in-memory MockAdapter, in practice) until then. A fresh MetaCloudAdapter is built per
 * send from whatever is currently in settings, so a credential update takes effect on the
 * very next message.
 */
export class DynamicAdapter implements WhatsAppAdapter {
  constructor(
    private readonly settings: InMemorySettingsRepository,
    private readonly fallback: WhatsAppAdapter,
    public fetchImpl?: typeof fetch,
  ) {}

  async sendText(message: OutgoingTextMessage): Promise<SendResult> {
    const current = this.settings.get();
    if (current.metaAccessToken && current.metaPhoneNumberId) {
      const adapter = new MetaCloudAdapter({
        accessToken: current.metaAccessToken,
        phoneNumberId: current.metaPhoneNumberId,
        fetchImpl: this.fetchImpl,
      });
      return adapter.sendText(message);
    }
    return this.fallback.sendText(message);
  }
}
