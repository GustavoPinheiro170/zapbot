import { describe, expect, it } from "vitest";
import { layoutNodes } from "../src/lib/flowLayout";
import type { CanvasPosition, Flow, FlowNode } from "../src/lib/flowTypes";

function positionsById(nodes: FlowNode[]) {
  const byId = new Map(nodes.map((node) => [node.id, node.position]));
  return (id: string): CanvasPosition => {
    const position = byId.get(id);
    if (!position) throw new Error(`No position for node "${id}"`);
    return position;
  };
}

describe("layoutNodes", () => {
  it("places the entry node in the first column and leaves nodes that already have a position untouched", () => {
    const flow: Flow = {
      id: "f1",
      name: "Fluxo",
      entryNodeId: "a",
      nodes: [
        { id: "a", type: "message", text: "Oi", next: "b", position: { x: 999, y: 999 } },
        { id: "b", type: "end" },
      ],
    };

    const positioned = layoutNodes(flow);

    expect(positioned.find((n) => n.id === "a")?.position).toEqual({ x: 999, y: 999 });
    expect(positioned.find((n) => n.id === "b")?.position).toBeDefined();
  });

  it("places nodes reachable later in the flow in later columns (increasing x)", () => {
    const flow: Flow = {
      id: "f1",
      name: "Fluxo",
      entryNodeId: "a",
      nodes: [
        { id: "a", type: "message", text: "1", next: "b" },
        { id: "b", type: "message", text: "2", next: "c" },
        { id: "c", type: "end" },
      ],
    };

    const pos = positionsById(layoutNodes(flow));

    expect(pos("a").x).toBeLessThan(pos("b").x);
    expect(pos("b").x).toBeLessThan(pos("c").x);
  });

  it("gives the two branches of a condition node different rows in the same column", () => {
    const flow: Flow = {
      id: "f1",
      name: "Fluxo",
      entryNodeId: "cond",
      nodes: [
        { id: "cond", type: "condition", variable: "x", equals: "y", whenTrue: "t", whenFalse: "f" },
        { id: "t", type: "end" },
        { id: "f", type: "end" },
      ],
    };

    const pos = positionsById(layoutNodes(flow));

    expect(pos("t").x).toBe(pos("f").x);
    expect(pos("t").y).not.toBe(pos("f").y);
  });

  it("still places a node that is not reachable from the entry node, instead of dropping it", () => {
    const flow: Flow = {
      id: "f1",
      name: "Fluxo",
      entryNodeId: "a",
      nodes: [
        { id: "a", type: "end" },
        { id: "orphan", type: "end" },
      ],
    };

    const positioned = layoutNodes(flow);

    expect(positioned.find((n) => n.id === "orphan")?.position).toBeDefined();
  });

  it("returns every node from the original flow, same length", () => {
    const flow: Flow = {
      id: "f1",
      name: "Fluxo",
      entryNodeId: "a",
      nodes: [
        { id: "a", type: "message", text: "1", next: "b" },
        { id: "b", type: "end" },
      ],
    };

    expect(layoutNodes(flow)).toHaveLength(2);
  });
});
