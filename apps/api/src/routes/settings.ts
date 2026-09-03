import { verifyMetaCredentials } from "@whatsbot/whatsapp-adapter";
import type { FastifyInstance } from "fastify";
import type { InMemorySettingsRepository, WhatsAppSettingsPatch } from "../repositories/settingsRepository.js";

export interface SettingsRouteDeps {
  settingsRepository: InMemorySettingsRepository;
}

function toPublicShape(deps: SettingsRouteDeps) {
  const settings = deps.settingsRepository.get();
  return {
    metaPhoneNumberId: settings.metaPhoneNumberId ?? "",
    metaVerifyToken: settings.metaVerifyToken,
    hasAccessToken: Boolean(settings.metaAccessToken),
    connected: deps.settingsRepository.isConnected(),
    activeFlowId: settings.activeFlowId,
  };
}

export function registerSettingsRoutes(app: FastifyInstance, deps: SettingsRouteDeps): void {
  app.get("/settings", async () => toPublicShape(deps));

  app.post("/settings", async (request) => {
    const body = request.body as WhatsAppSettingsPatch;
    deps.settingsRepository.update(body);
    return toPublicShape(deps);
  });

  app.post("/settings/test-connection", async (request, reply) => {
    const settings = deps.settingsRepository.get();
    if (!settings.metaAccessToken || !settings.metaPhoneNumberId) {
      return reply.status(400).send({ ok: false, error: "Configure o token e o Phone Number ID primeiro." });
    }
    const result = await verifyMetaCredentials({
      accessToken: settings.metaAccessToken,
      phoneNumberId: settings.metaPhoneNumberId,
    });
    return result;
  });
}
