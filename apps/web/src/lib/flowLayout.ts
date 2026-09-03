import type { CanvasPosition, Flow, FlowNode, NodeId } from "./flowTypes";

const COLUMN_WIDTH = 340;
const ROW_HEIGHT = 170;

function outgoingIds(node: FlowNode): NodeId[] {
  if (node.type === "condition") {
    return [node.whenTrue, node.whenFalse].filter(Boolean);
  }
  if ("next" in node && node.next) {
    return [node.next];
  }
  return [];
}

/** Shortest number of hops from the entry node to every reachable node (BFS). */
function columnsFromEntry(flow: Flow): Map<NodeId, number> {
  const columns = new Map<NodeId, number>();
  if (!flow.entryNodeId) return columns;

  const byId = new Map(flow.nodes.map((node) => [node.id, node]));
  const queue: NodeId[] = [flow.entryNodeId];
  columns.set(flow.entryNodeId, 0);

  while (queue.length > 0) {
    const currentId = queue.shift();
    if (!currentId) continue;
    const current = byId.get(currentId);
    if (!current) continue;
    const currentColumn = columns.get(currentId) ?? 0;

    for (const nextId of outgoingIds(current)) {
      if (!byId.has(nextId) || columns.has(nextId)) continue;
      columns.set(nextId, currentColumn + 1);
      queue.push(nextId);
    }
  }

  return columns;
}

/**
 * Assigns a canvas position to every node that doesn't already have one, laying reachable
 * nodes out left-to-right by distance from the entry node, and stacking nodes sharing a
 * column vertically. Nodes that already carry a `position` (the user dragged them) are
 * left exactly where they are.
 */
export function layoutNodes(flow: Flow): FlowNode[] {
  const columns = columnsFromEntry(flow);
  const maxKnownColumn = Math.max(-1, ...columns.values());
  const rowCountPerColumn = new Map<number, number>();

  function placeIn(column: number): CanvasPosition {
    const row = rowCountPerColumn.get(column) ?? 0;
    rowCountPerColumn.set(column, row + 1);
    return { x: column * COLUMN_WIDTH, y: row * ROW_HEIGHT };
  }

  return flow.nodes.map((node) => {
    if (node.position) return node;
    const column = columns.get(node.id) ?? maxKnownColumn + 1;
    return { ...node, position: placeIn(column) };
  });
}
