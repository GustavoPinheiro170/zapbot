export interface WhatsAppSettings {
  metaAccessToken?: string;
  metaPhoneNumberId?: string;
  metaVerifyToken: string;
  /** Which flow a brand-new conversation starts on. Always set — see domain/defaultFlow.ts. */
  activeFlowId: string;
}

export type WhatsAppSettingsPatch = Partial<WhatsAppSettings>;

/** In-memory by design for this MVP skeleton — see the note on InMemoryFlowRepository. */
export class InMemorySettingsRepository {
  private settings: WhatsAppSettings;

  constructor(initial: WhatsAppSettings) {
    this.settings = initial;
  }

  get(): WhatsAppSettings {
    return this.settings;
  }

  /** Blank/omitted fields keep whatever was there before — a partially-filled form never wipes a saved credential. */
  update(patch: WhatsAppSettingsPatch): WhatsAppSettings {
    this.settings = {
      ...this.settings,
      ...(patch.metaAccessToken ? { metaAccessToken: patch.metaAccessToken } : {}),
      ...(patch.metaPhoneNumberId ? { metaPhoneNumberId: patch.metaPhoneNumberId } : {}),
      ...(patch.metaVerifyToken ? { metaVerifyToken: patch.metaVerifyToken } : {}),
      ...(patch.activeFlowId ? { activeFlowId: patch.activeFlowId } : {}),
    };
    return this.settings;
  }

  isConnected(): boolean {
    return Boolean(this.settings.metaAccessToken && this.settings.metaPhoneNumberId);
  }
}
