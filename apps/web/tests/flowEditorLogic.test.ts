import { describe, expect, it } from "vitest";
import {
  addNode,
  createEmptyFlow,
  removeNode,
  updateNode,
  validateFlow,
} from "../src/lib/flowEditorLogic";
import type { Flow } from "../src/lib/flowTypes";

describe("createEmptyFlow", () => {
  it("creates a flow with no nodes and no entry point yet", () => {
    const flow = createEmptyFlow("f1", "Meu fluxo");
    expect(flow).toEqual({ id: "f1", name: "Meu fluxo", entryNodeId: "", nodes: [] });
  });
});

describe("addNode", () => {
  it("appends a node with a generated id and type-appropriate empty fields", () => {
    const flow = createEmptyFlow("f1", "Meu fluxo");

    const withMessage = addNode(flow, "message");

    expect(withMessage.nodes).toEqual([{ id: "no-1", type: "message", text: "" }]);
  });

  it("sets the first node added as the entry node automatically", () => {
    const flow = createEmptyFlow("f1", "Meu fluxo");

    const withMessage = addNode(flow, "message");

    expect(withMessage.entryNodeId).toBe("no-1");
  });

  it("does not change the entry node when a second node is added", () => {
    let flow = createEmptyFlow("f1", "Meu fluxo");
    flow = addNode(flow, "message");

    flow = addNode(flow, "collect");

    expect(flow.entryNodeId).toBe("no-1");
    expect(flow.nodes.map((n) => n.id)).toEqual(["no-1", "no-2"]);
  });

  it("creates the right empty shape for each node type", () => {
    let flow = createEmptyFlow("f1", "Meu fluxo");
    flow = addNode(flow, "collect");
    flow = addNode(flow, "condition");
    flow = addNode(flow, "setStage");
    flow = addNode(flow, "aiReply");
    flow = addNode(flow, "handoff");
    flow = addNode(flow, "end");

    expect(flow.nodes).toEqual([
      { id: "no-1", type: "collect", prompt: "", variable: "" },
      { id: "no-2", type: "condition", variable: "", equals: "", whenTrue: "", whenFalse: "" },
      { id: "no-3", type: "setStage", stage: "" },
      { id: "no-4", type: "aiReply", systemPrompt: "" },
      { id: "no-5", type: "handoff", reason: "" },
      { id: "no-6", type: "end" },
    ]);
  });
});

describe("updateNode", () => {
  it("merges a patch into the matching node and leaves the others untouched", () => {
    let flow = createEmptyFlow("f1", "Meu fluxo");
    flow = addNode(flow, "message");
    flow = addNode(flow, "message");

    flow = updateNode(flow, "no-2", { text: "Olá!" });

    expect(flow.nodes[0]).toEqual({ id: "no-1", type: "message", text: "" });
    expect(flow.nodes[1]).toEqual({ id: "no-2", type: "message", text: "Olá!" });
  });
});

describe("removeNode", () => {
  it("removes the node and clears dangling next/entry references to it", () => {
    let flow = createEmptyFlow("f1", "Meu fluxo");
    flow = addNode(flow, "message"); // no-1
    flow = addNode(flow, "message"); // no-2
    flow = updateNode(flow, "no-1", { next: "no-2" });

    flow = removeNode(flow, "no-2");

    expect(flow.nodes).toEqual([{ id: "no-1", type: "message", text: "" }]);
  });

  it("clears whenTrue/whenFalse references on condition nodes", () => {
    let flow = createEmptyFlow("f1", "Meu fluxo");
    flow = addNode(flow, "condition"); // no-1
    flow = addNode(flow, "message"); // no-2
    flow = updateNode(flow, "no-1", { whenTrue: "no-2", whenFalse: "no-2" });

    flow = removeNode(flow, "no-2");

    const condition = flow.nodes.find((n) => n.id === "no-1");
    expect(condition).toMatchObject({ whenTrue: "", whenFalse: "" });
  });

  it("falls back the entry node to the first remaining node when the entry node is removed", () => {
    let flow = createEmptyFlow("f1", "Meu fluxo");
    flow = addNode(flow, "message"); // no-1, becomes entry
    flow = addNode(flow, "message"); // no-2

    flow = removeNode(flow, "no-1");

    expect(flow.entryNodeId).toBe("no-2");
  });

  it("clears the entry node when the last remaining node is removed", () => {
    let flow = createEmptyFlow("f1", "Meu fluxo");
    flow = addNode(flow, "message");

    flow = removeNode(flow, "no-1");

    expect(flow.entryNodeId).toBe("");
    expect(flow.nodes).toEqual([]);
  });
});

describe("validateFlow", () => {
  it("requires a name", () => {
    const flow: Flow = { id: "f1", name: "  ", entryNodeId: "", nodes: [] };
    expect(validateFlow(flow)).toContain("Dê um nome ao fluxo.");
  });

  it("requires at least one node", () => {
    const flow: Flow = { id: "f1", name: "Fluxo", entryNodeId: "", nodes: [] };
    expect(validateFlow(flow)).toContain("Adicione pelo menos um nó.");
  });

  it("requires the entry node to point at an existing node", () => {
    const flow: Flow = {
      id: "f1",
      name: "Fluxo",
      entryNodeId: "no-9",
      nodes: [{ id: "no-1", type: "end" }],
    };
    expect(validateFlow(flow)).toContain("Escolha um nó de início válido.");
  });

  it("requires condition nodes to have both branches set", () => {
    const flow: Flow = {
      id: "f1",
      name: "Fluxo",
      entryNodeId: "no-1",
      nodes: [{ id: "no-1", type: "condition", variable: "x", equals: "y", whenTrue: "", whenFalse: "" }],
    };
    expect(validateFlow(flow).some((message) => message.includes("no-1"))).toBe(true);
  });

  it("requires message nodes to have text and collect nodes to have a prompt and variable", () => {
    const flow: Flow = {
      id: "f1",
      name: "Fluxo",
      entryNodeId: "no-1",
      nodes: [
        { id: "no-1", type: "message", text: "" },
        { id: "no-2", type: "collect", prompt: "", variable: "" },
      ],
    };
    const errors = validateFlow(flow);
    expect(errors.some((message) => message.includes("no-1"))).toBe(true);
    expect(errors.some((message) => message.includes("no-2"))).toBe(true);
  });

  it("returns no errors for a valid, complete flow", () => {
    const flow: Flow = {
      id: "f1",
      name: "Fluxo válido",
      entryNodeId: "no-1",
      nodes: [{ id: "no-1", type: "message", text: "Olá!" }],
    };
    expect(validateFlow(flow)).toEqual([]);
  });
});
