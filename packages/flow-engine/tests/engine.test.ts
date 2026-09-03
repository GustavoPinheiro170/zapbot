import { describe, expect, it } from "vitest";
import { createInitialState, step } from "../src/engine.js";
import type { Flow } from "../src/types.js";

describe("flow engine", () => {
  it("sends the message from the entry node and pauses when there is nowhere to go", () => {
    const flow: Flow = {
      id: "f1",
      name: "Simple",
      entryNodeId: "greet",
      nodes: [{ id: "greet", type: "message", text: "Olá! Como posso ajudar?" }],
    };

    const result = step(flow, createInitialState(), null);

    expect(result.actions).toEqual([{ type: "sendMessage", text: "Olá! Como posso ajudar?" }]);
    expect(result.state.finished).toBe(false);
    expect(result.state.currentNodeId).toBeNull();
  });

  it("chains through multiple message nodes automatically in a single step", () => {
    const flow: Flow = {
      id: "f2",
      name: "Chain",
      entryNodeId: "a",
      nodes: [
        { id: "a", type: "message", text: "Mensagem 1", next: "b" },
        { id: "b", type: "message", text: "Mensagem 2" },
      ],
    };

    const result = step(flow, createInitialState(), null);

    expect(result.actions).toEqual([
      { type: "sendMessage", text: "Mensagem 1" },
      { type: "sendMessage", text: "Mensagem 2" },
    ]);
  });

  it("pauses on a collect node and stores the next reply as a variable", () => {
    const flow: Flow = {
      id: "f3",
      name: "Collect",
      entryNodeId: "ask",
      nodes: [
        { id: "ask", type: "collect", prompt: "Qual seu nome?", variable: "name", next: "thanks" },
        { id: "thanks", type: "message", text: "Obrigado, {{name}}!" },
      ],
    };

    const first = step(flow, createInitialState(), null);
    expect(first.actions).toEqual([{ type: "sendMessage", text: "Qual seu nome?" }]);
    expect(first.state.awaitingVariable).toBe("name");

    const second = step(flow, first.state, "Maria");
    expect(second.actions).toEqual([{ type: "sendMessage", text: "Obrigado, Maria!" }]);
    expect(second.state.variables.name).toBe("Maria");
  });

  it("branches with a condition node based on a stored variable", () => {
    const flow: Flow = {
      id: "f4",
      name: "Condition",
      entryNodeId: "ask",
      nodes: [
        { id: "ask", type: "collect", prompt: "Já é cliente? (sim/nao)", variable: "isClient", next: "check" },
        { id: "check", type: "condition", variable: "isClient", equals: "sim", whenTrue: "vip", whenFalse: "newbie" },
        { id: "vip", type: "message", text: "Bem-vindo de volta!" },
        { id: "newbie", type: "message", text: "Vamos te apresentar o produto." },
      ],
    };

    const afterAsk = step(flow, createInitialState(), null);

    const yesPath = step(flow, afterAsk.state, "sim");
    expect(yesPath.actions).toEqual([{ type: "sendMessage", text: "Bem-vindo de volta!" }]);

    const noPath = step(flow, afterAsk.state, "nao");
    expect(noPath.actions).toEqual([{ type: "sendMessage", text: "Vamos te apresentar o produto." }]);
  });

  it("emits a setStage action and keeps the stage on the engine state", () => {
    const flow: Flow = {
      id: "f5",
      name: "Stage",
      entryNodeId: "move",
      nodes: [
        { id: "move", type: "setStage", stage: "qualificado", next: "bye" },
        { id: "bye", type: "message", text: "Ok!" },
      ],
    };

    const result = step(flow, createInitialState(), null);

    expect(result.actions[0]).toEqual({ type: "setStage", stage: "qualificado" });
    expect(result.state.stage).toBe("qualificado");
  });

  it("emits a requestAiReply action for an aiReply node without blocking the rest of the flow", () => {
    const flow: Flow = {
      id: "f6",
      name: "AI",
      entryNodeId: "ai",
      nodes: [
        { id: "ai", type: "aiReply", systemPrompt: "Você é um assistente de vendas.", next: "bye" },
        { id: "bye", type: "message", text: "Mais alguma coisa?" },
      ],
    };

    const result = step(flow, createInitialState(), "Quanto custa o plano Pro?");

    expect(result.actions[0]).toEqual({
      type: "requestAiReply",
      systemPrompt: "Você é um assistente de vendas.",
      userMessage: "Quanto custa o plano Pro?",
    });
    expect(result.actions[1]).toEqual({ type: "sendMessage", text: "Mais alguma coisa?" });
  });

  it("stops the flow and marks it finished on a handoff node", () => {
    const flow: Flow = {
      id: "f7",
      name: "Handoff",
      entryNodeId: "h",
      nodes: [{ id: "h", type: "handoff", reason: "Cliente pediu para falar com humano" }],
    };

    const result = step(flow, createInitialState(), null);

    expect(result.actions).toEqual([{ type: "handoff", reason: "Cliente pediu para falar com humano" }]);
    expect(result.state.finished).toBe(true);
  });

  it("marks the flow as finished on an end node", () => {
    const flow: Flow = {
      id: "f8",
      name: "End",
      entryNodeId: "e",
      nodes: [{ id: "e", type: "end" }],
    };

    const result = step(flow, createInitialState(), null);

    expect(result.state.finished).toBe(true);
  });

  it("does nothing once the flow has already finished", () => {
    const flow: Flow = {
      id: "f9",
      name: "Finished",
      entryNodeId: "e",
      nodes: [{ id: "e", type: "end" }],
    };
    const finishedState = step(flow, createInitialState(), null).state;

    const again = step(flow, finishedState, "oi de novo");

    expect(again.actions).toEqual([]);
    expect(again.state).toBe(finishedState);
  });

  it("throws a clear error if a cyclic flow never reaches a stopping node", () => {
    const flow: Flow = {
      id: "f10",
      name: "Cycle",
      entryNodeId: "a",
      nodes: [
        { id: "a", type: "setStage", stage: "x", next: "b" },
        { id: "b", type: "setStage", stage: "y", next: "a" },
      ],
    };

    expect(() => step(flow, createInitialState(), null)).toThrow(/exceeded/);
  });

  it("throws a clear error when a node references an id that does not exist in the flow", () => {
    const flow: Flow = {
      id: "f11",
      name: "Broken",
      entryNodeId: "missing",
      nodes: [{ id: "a", type: "end" }],
    };

    expect(() => step(flow, createInitialState(), null)).toThrow(/no node with id "missing"/);
  });
});
