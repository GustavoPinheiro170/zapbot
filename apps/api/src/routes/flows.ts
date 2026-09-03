import type { Flow } from "@whatsbot/flow-engine";
import type { FastifyInstance, FastifyRequest } from "fastify";
import { DEFAULT_USER_ID } from "../domain/defaultUser.js";
import type { FlowRepository } from "../repositories/flowRepository.js";
import type { InMemorySettingsRepository } from "../repositories/settingsRepository.js";

export interface FlowRouteDeps {
  flowRepository: FlowRepository;
  settingsRepository: InMemorySettingsRepository;
}

function isValidFlow(body: unknown): body is Flow {
  if (typeof body !== "object" || body === null) return false;
  const candidate = body as Partial<Flow>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.name === "string" &&
    typeof candidate.entryNodeId === "string" &&
    Array.isArray(candidate.nodes)
  );
}

/**
 * There's no login system yet, so every request runs as DEFAULT_USER_ID — except a caller
 * that already sends `x-user-id` (a future authenticated frontend), which is honored as-is.
 * This is the only place that decision is made, so wiring up real auth later is a one-line
 * change here.
 */
function resolveUserId(request: FastifyRequest): string {
  const header = request.headers["x-user-id"];
  const value = Array.isArray(header) ? header[0] : header;
  return value?.trim() || DEFAULT_USER_ID;
}

export function registerFlowRoutes(app: FastifyInstance, deps: FlowRouteDeps): void {
  app.get("/flows", async (request) => deps.flowRepository.list(resolveUserId(request)));

  app.get("/flows/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const flow = await deps.flowRepository.get(resolveUserId(request), id);
    if (!flow) {
      return reply.status(404).send({ error: `Flow "${id}" not found` });
    }
    return flow;
  });

  app.post("/flows", async (request, reply) => {
    if (!isValidFlow(request.body)) {
      return reply.status(400).send({ error: "id, name, entryNodeId and nodes are required" });
    }
    const flow = await deps.flowRepository.save(resolveUserId(request), request.body);
    return reply.status(201).send(flow);
  });

  // Marks this flow as the one a brand-new conversation starts on — see ConversationSession.
  app.post("/flows/:id/activate", async (request, reply) => {
    const { id } = request.params as { id: string };
    const flow = await deps.flowRepository.get(resolveUserId(request), id);
    if (!flow) {
      return reply.status(404).send({ error: `Flow "${id}" not found` });
    }
    const settings = deps.settingsRepository.update({ activeFlowId: id });
    return { activeFlowId: settings.activeFlowId };
  });
}
