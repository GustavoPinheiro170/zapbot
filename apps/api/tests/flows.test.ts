import { MockAdapter } from "@whatsbot/whatsapp-adapter";
import { describe, expect, it } from "vitest";
import { EchoAiResponder } from "../src/domain/aiResponder.js";
import { InMemoryConversationRepository } from "../src/repositories/conversationRepository.js";
import { InMemoryFlowRepository } from "../src/repositories/flowRepository.js";
import { InMemorySettingsRepository } from "../src/repositories/settingsRepository.js";
import { buildServer } from "../src/server.js";

function buildTestServer() {
  const flowRepository = new InMemoryFlowRepository();
  const settingsRepository = new InMemorySettingsRepository({
    metaVerifyToken: "test-verify-token",
    activeFlowId: "welcome",
  });
  const app = buildServer({
    adapter: new MockAdapter(),
    aiResponder: new EchoAiResponder(),
    flowRepository,
    conversationRepository: new InMemoryConversationRepository(),
    settingsRepository,
  });
  return { app, flowRepository, settingsRepository };
}

describe("flows API", () => {
  it("starts with an empty list", async () => {
    const { app } = buildTestServer();

    const response = await app.inject({ method: "GET", url: "/flows" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual([]);
  });

  it("creates a flow and returns it in the list", async () => {
    const { app } = buildTestServer();
    const flow = {
      id: "test-flow",
      name: "Fluxo de teste",
      entryNodeId: "a",
      nodes: [{ id: "a", type: "message", text: "Oi!" }],
    };

    const createResponse = await app.inject({ method: "POST", url: "/flows", payload: flow });
    expect(createResponse.statusCode).toBe(201);

    const listResponse = await app.inject({ method: "GET", url: "/flows" });
    expect(listResponse.json()).toEqual([flow]);
  });

  it("returns a single flow by id", async () => {
    const { app } = buildTestServer();
    const flow = { id: "test-flow", name: "Fluxo", entryNodeId: "a", nodes: [{ id: "a", type: "end" }] };
    await app.inject({ method: "POST", url: "/flows", payload: flow });

    const response = await app.inject({ method: "GET", url: "/flows/test-flow" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual(flow);
  });

  it("returns 404 for an unknown flow id", async () => {
    const { app } = buildTestServer();

    const response = await app.inject({ method: "GET", url: "/flows/does-not-exist" });

    expect(response.statusCode).toBe(404);
  });

  it("rejects a flow missing required fields with 400", async () => {
    const { app } = buildTestServer();

    const response = await app.inject({ method: "POST", url: "/flows", payload: { name: "Sem id" } });

    expect(response.statusCode).toBe(400);
  });

  it("keeps flows from different x-user-id callers completely separate", async () => {
    const { app } = buildTestServer();
    const flow = { id: "shared-id", name: "Fluxo do usuário 1", entryNodeId: "a", nodes: [{ id: "a", type: "end" }] };

    await app.inject({ method: "POST", url: "/flows", payload: flow, headers: { "x-user-id": "user-1" } });

    const user1List = await app.inject({ method: "GET", url: "/flows", headers: { "x-user-id": "user-1" } });
    const user2List = await app.inject({ method: "GET", url: "/flows", headers: { "x-user-id": "user-2" } });

    expect(user1List.json()).toEqual([flow]);
    expect(user2List.json()).toEqual([]);
  });

  it("activates a flow so new conversations start on it", async () => {
    const { app, settingsRepository } = buildTestServer();
    const flow = { id: "custom-flow", name: "Meu fluxo", entryNodeId: "a", nodes: [{ id: "a", type: "end" }] };
    await app.inject({ method: "POST", url: "/flows", payload: flow });

    const response = await app.inject({ method: "POST", url: "/flows/custom-flow/activate" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ activeFlowId: "custom-flow" });
    expect(settingsRepository.get().activeFlowId).toBe("custom-flow");
  });

  it("returns 404 when trying to activate a flow that doesn't exist", async () => {
    const { app } = buildTestServer();

    const response = await app.inject({ method: "POST", url: "/flows/does-not-exist/activate" });

    expect(response.statusCode).toBe(404);
  });
});
