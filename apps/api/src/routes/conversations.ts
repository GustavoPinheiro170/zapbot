import type { FastifyInstance } from "fastify";
import type { InMemoryConversationRepository } from "../repositories/conversationRepository.js";

export interface ConversationRouteDeps {
  conversationRepository: InMemoryConversationRepository;
}

export function registerConversationRoutes(app: FastifyInstance, deps: ConversationRouteDeps): void {
  app.get("/conversations", async () => deps.conversationRepository.list());
}
