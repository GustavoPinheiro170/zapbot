import cors from "@fastify/cors";
import type { WhatsAppAdapter } from "@whatsbot/whatsapp-adapter";
import Fastify, { type FastifyInstance } from "fastify";
import type { AiResponder } from "./domain/aiResponder.js";
import { ConversationSession } from "./domain/conversationSession.js";
import { DEFAULT_USER_ID } from "./domain/defaultUser.js";
import { DynamicAdapter } from "./domain/dynamicAdapter.js";
import type { InMemoryConversationRepository } from "./repositories/conversationRepository.js";
import type { FlowRepository } from "./repositories/flowRepository.js";
import type { InMemorySettingsRepository } from "./repositories/settingsRepository.js";
import { registerConversationRoutes } from "./routes/conversations.js";
import { registerFlowRoutes } from "./routes/flows.js";
import { registerSettingsRoutes } from "./routes/settings.js";
import { registerWebhookRoutes } from "./routes/webhook.js";

export interface ServerDeps {
  /** Used until real WhatsApp credentials are saved in settings — see DynamicAdapter. */
  adapter: WhatsAppAdapter;
  aiResponder: AiResponder;
  flowRepository: FlowRepository;
  conversationRepository: InMemoryConversationRepository;
  /** Also holds which flow is active — see settingsRepository.activeFlowId. */
  settingsRepository: InMemorySettingsRepository;
}

/**
 * Factory instead of a module-level singleton so tests can inject a MockAdapter and fresh,
 * isolated repositories for every run.
 */
export function buildServer(deps: ServerDeps): FastifyInstance {
  const app = Fastify({ logger: false });

  app.register(cors, { origin: true });

  const dynamicAdapter = new DynamicAdapter(deps.settingsRepository, deps.adapter);

  const session = new ConversationSession({
    flowRepository: deps.flowRepository,
    conversationRepository: deps.conversationRepository,
    adapter: dynamicAdapter,
    aiResponder: deps.aiResponder,
    settingsRepository: deps.settingsRepository,
    ownerUserId: DEFAULT_USER_ID,
  });

  registerWebhookRoutes(app, { session, settingsRepository: deps.settingsRepository });
  registerFlowRoutes(app, { flowRepository: deps.flowRepository, settingsRepository: deps.settingsRepository });
  registerConversationRoutes(app, { conversationRepository: deps.conversationRepository });
  registerSettingsRoutes(app, { settingsRepository: deps.settingsRepository });

  return app;
}
