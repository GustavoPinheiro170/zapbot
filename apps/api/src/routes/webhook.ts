import { parseIncomingWebhook } from "@whatsbot/whatsapp-adapter";
import type { FastifyInstance } from "fastify";
import type { ConversationSession } from "../domain/conversationSession.js";
import type { InMemorySettingsRepository } from "../repositories/settingsRepository.js";

export interface WebhookRouteDeps {
  session: ConversationSession;
  settingsRepository: InMemorySettingsRepository;
}

export function registerWebhookRoutes(app: FastifyInstance, deps: WebhookRouteDeps): void {
  // Meta calls this once, at setup time, to confirm you control the endpoint. Reads the verify
  // token from settings live, so saving a new one in the UI takes effect immediately.
  app.get("/webhook/whatsapp", async (request, reply) => {
    const query = request.query as Record<string, string | undefined>;
    const mode = query["hub.mode"];
    const token = query["hub.verify_token"];
    const challenge = query["hub.challenge"] ?? "";

    if (mode === "subscribe" && token === deps.settingsRepository.get().metaVerifyToken) {
      return reply.status(200).send(challenge);
    }
    return reply.status(403).send("Forbidden");
  });

  // Meta calls this for every inbound message and every delivery/read status update. Always
  // acks with 200 (Meta retries/backs off otherwise) and never lets one message's failure
  // (e.g. an unknown flow) stop the rest of the batch from being processed.
  app.post("/webhook/whatsapp", async (request, reply) => {
    const messages = parseIncomingWebhook(request.body);

    for (const message of messages) {
      try {
        await deps.session.handleIncomingMessage({
          from: message.from,
          text: message.text,
          contactName: message.contactName,
        });
      } catch (error) {
        request.log.error({ err: error, from: message.from }, "failed to process an inbound WhatsApp message");
      }
    }

    return reply.status(200).send({ received: messages.length });
  });
}
