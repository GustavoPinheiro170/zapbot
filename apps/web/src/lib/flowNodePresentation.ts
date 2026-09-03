import type { FlowNode, NodeId } from "./flowTypes";

export interface NodeOutput {
  id: "next" | "whenTrue" | "whenFalse";
  label: string;
}

export function getNodeOutputs(node: FlowNode): NodeOutput[] {
  switch (node.type) {
    case "condition":
      return [
        { id: "whenTrue", label: node.equals ? `Se = "${node.equals}"` : "Se verdadeiro" },
        { id: "whenFalse", label: "Senão" },
      ];
    case "message":
    case "collect":
    case "setStage":
    case "aiReply":
      return [{ id: "next", label: "Próximo passo" }];
    case "handoff":
    case "end":
      return [];
  }
}

export function getNodePreview(node: FlowNode): string {
  switch (node.type) {
    case "message":
      return node.text || "Nenhuma mensagem definida ainda.";
    case "collect":
      return node.prompt || "Nenhuma pergunta definida ainda.";
    case "condition":
      return `${node.variable || "variável"} = "${node.equals || "..."}"`;
    case "setStage":
      return node.stage ? `Move para "${node.stage}" no CRM.` : "Nenhum estágio definido ainda.";
    case "aiReply":
      return node.systemPrompt || "Nenhuma instrução definida ainda.";
    case "handoff":
      return node.reason || "Nenhum motivo definido ainda.";
    case "end":
      return "Encerra a conversa aqui.";
  }
}

/** All node ids this node points at — used to derive canvas edges from the flow's own data. */
export function getOutgoingTargets(node: FlowNode): { output: NodeOutput["id"]; target: NodeId }[] {
  if (node.type === "condition") {
    const edges: { output: NodeOutput["id"]; target: NodeId }[] = [
      { output: "whenTrue", target: node.whenTrue },
      { output: "whenFalse", target: node.whenFalse },
    ];
    return edges.filter((edge) => edge.target);
  }
  if ("next" in node && node.next) {
    return [{ output: "next", target: node.next }];
  }
  return [];
}
