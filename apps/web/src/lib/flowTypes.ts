export type NodeId = string;

export type FlowNodeType = "message" | "collect" | "condition" | "setStage" | "aiReply" | "handoff" | "end";

export interface CanvasPosition {
  x: number;
  y: number;
}

interface BaseNode {
  id: NodeId;
  /** Where this node sits on the visual canvas. Absent for a node the layout has never placed yet. */
  position?: CanvasPosition;
}

export interface MessageNode extends BaseNode {
  type: "message";
  text: string;
  next?: NodeId;
}

export interface CollectNode extends BaseNode {
  type: "collect";
  prompt: string;
  variable: string;
  next?: NodeId;
}

export interface ConditionNode extends BaseNode {
  type: "condition";
  variable: string;
  equals: string;
  whenTrue: NodeId;
  whenFalse: NodeId;
}

export interface SetStageNode extends BaseNode {
  type: "setStage";
  stage: string;
  next?: NodeId;
}

export interface AiReplyNode extends BaseNode {
  type: "aiReply";
  systemPrompt: string;
  next?: NodeId;
}

export interface HandoffNode extends BaseNode {
  type: "handoff";
  reason: string;
}

export interface EndNode extends BaseNode {
  type: "end";
}

export type FlowNode =
  | MessageNode
  | CollectNode
  | ConditionNode
  | SetStageNode
  | AiReplyNode
  | HandoffNode
  | EndNode;

export interface Flow {
  id: string;
  name: string;
  entryNodeId: NodeId;
  nodes: FlowNode[];
}

export const NODE_TYPE_ORDER: FlowNodeType[] = [
  "message",
  "collect",
  "condition",
  "setStage",
  "aiReply",
  "handoff",
  "end",
];

export const NODE_TYPE_LABELS: Record<FlowNodeType, string> = {
  message: "Mensagem",
  collect: "Pergunta (coleta resposta)",
  condition: "Condição",
  setStage: "Mover no CRM",
  aiReply: "Resposta com IA",
  handoff: "Transferir para humano",
  end: "Encerrar conversa",
};

export const NODE_TYPE_COLORS: Record<FlowNodeType, { text: string; bg: string; ring: string }> = {
  message: { text: "#1DA851", bg: "#E9FBF0", ring: "#25D366" },
  collect: { text: "#2C56F2", bg: "#EAF0FF", ring: "#2C56F2" },
  condition: { text: "#7B3FF2", bg: "#F2ECFF", ring: "#7B3FF2" },
  setStage: { text: "#B36B00", bg: "#FFF4E0", ring: "#F0A63A" },
  aiReply: { text: "#0F9E9E", bg: "#E4FBFB", ring: "#14B8B8" },
  handoff: { text: "#C2410C", bg: "#FFEBE0", ring: "#F97316" },
  end: { text: "#B91C1C", bg: "#FDECEC", ring: "#EF4444" },
};
