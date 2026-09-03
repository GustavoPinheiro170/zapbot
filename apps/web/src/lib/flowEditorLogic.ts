import type { Flow, FlowNode, FlowNodeType, NodeId } from "./flowTypes";

export function createEmptyFlow(id: string, name: string): Flow {
  return { id, name, entryNodeId: "", nodes: [] };
}

function nextNodeId(existingIds: NodeId[]): NodeId {
  let candidate = existingIds.length + 1;
  while (existingIds.includes(`no-${candidate}`)) {
    candidate += 1;
  }
  return `no-${candidate}`;
}

function createNode(type: FlowNodeType, id: NodeId): FlowNode {
  switch (type) {
    case "message":
      return { id, type, text: "" };
    case "collect":
      return { id, type, prompt: "", variable: "" };
    case "condition":
      return { id, type, variable: "", equals: "", whenTrue: "", whenFalse: "" };
    case "setStage":
      return { id, type, stage: "" };
    case "aiReply":
      return { id, type, systemPrompt: "" };
    case "handoff":
      return { id, type, reason: "" };
    case "end":
      return { id, type };
  }
}

export function addNode(flow: Flow, type: FlowNodeType): Flow {
  const id = nextNodeId(flow.nodes.map((node) => node.id));
  const node = createNode(type, id);
  const entryNodeId = flow.entryNodeId || id;
  return { ...flow, entryNodeId, nodes: [...flow.nodes, node] };
}

function clearReferencesTo(node: FlowNode, removedId: NodeId): FlowNode {
  if ("next" in node && node.next === removedId) {
    const { next: _next, ...rest } = node;
    return rest as FlowNode;
  }
  if (node.type === "condition") {
    return {
      ...node,
      whenTrue: node.whenTrue === removedId ? "" : node.whenTrue,
      whenFalse: node.whenFalse === removedId ? "" : node.whenFalse,
    };
  }
  return node;
}

export function removeNode(flow: Flow, nodeId: NodeId): Flow {
  const nodes = flow.nodes.filter((node) => node.id !== nodeId).map((node) => clearReferencesTo(node, nodeId));
  const entryNodeId = flow.entryNodeId === nodeId ? (nodes[0]?.id ?? "") : flow.entryNodeId;
  return { ...flow, entryNodeId, nodes };
}

export function updateNode(flow: Flow, nodeId: NodeId, patch: Record<string, unknown>): Flow {
  const nodes = flow.nodes.map((node) => (node.id === nodeId ? ({ ...node, ...patch } as FlowNode) : node));
  return { ...flow, nodes };
}

export function validateFlow(flow: Flow): string[] {
  const errors: string[] = [];

  if (!flow.name.trim()) {
    errors.push("Dê um nome ao fluxo.");
  }
  if (flow.nodes.length === 0) {
    errors.push("Adicione pelo menos um nó.");
    return errors;
  }
  if (!flow.nodes.some((node) => node.id === flow.entryNodeId)) {
    errors.push("Escolha um nó de início válido.");
  }

  for (const node of flow.nodes) {
    switch (node.type) {
      case "message":
        if (!node.text.trim()) errors.push(`O nó "${node.id}" (mensagem) está vazio.`);
        break;
      case "collect":
        if (!node.prompt.trim() || !node.variable.trim()) {
          errors.push(`O nó "${node.id}" (pergunta) precisa de uma pergunta e um nome de variável.`);
        }
        break;
      case "condition":
        if (!node.variable.trim() || !node.equals.trim()) {
          errors.push(`O nó "${node.id}" (condição) precisa de uma variável e um valor de comparação.`);
        }
        if (!node.whenTrue || !node.whenFalse) {
          errors.push(`O nó "${node.id}" (condição) precisa dos dois caminhos (verdadeiro e falso) preenchidos.`);
        }
        break;
      case "setStage":
        if (!node.stage.trim()) errors.push(`O nó "${node.id}" (mover no CRM) precisa de um estágio.`);
        break;
      case "aiReply":
        if (!node.systemPrompt.trim()) errors.push(`O nó "${node.id}" (resposta com IA) precisa de instruções.`);
        break;
      case "handoff":
        if (!node.reason.trim()) errors.push(`O nó "${node.id}" (transferência) precisa de um motivo.`);
        break;
      case "end":
        break;
    }
  }

  return errors;
}
