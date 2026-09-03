export type NodeId = string;

export interface MessageNode {
  id: NodeId;
  type: "message";
  /** May reference {{variable}} placeholders collected earlier in the conversation. */
  text: string;
  next?: NodeId;
}

export interface CollectNode {
  id: NodeId;
  type: "collect";
  prompt: string;
  /** Name the customer's next reply is stored under. */
  variable: string;
  next?: NodeId;
}

export interface ConditionNode {
  id: NodeId;
  type: "condition";
  variable: string;
  equals: string;
  whenTrue: NodeId;
  whenFalse: NodeId;
}

export interface SetStageNode {
  id: NodeId;
  type: "setStage";
  /** CRM Kanban stage this conversation moves to. */
  stage: string;
  next?: NodeId;
}

export interface AiReplyNode {
  id: NodeId;
  type: "aiReply";
  systemPrompt: string;
  next?: NodeId;
}

export interface HandoffNode {
  id: NodeId;
  type: "handoff";
  reason: string;
}

export interface EndNode {
  id: NodeId;
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

export interface EngineState {
  currentNodeId: NodeId | null;
  awaitingVariable: string | null;
  variables: Record<string, string>;
  stage: string | null;
  finished: boolean;
}

export type FlowAction =
  | { type: "sendMessage"; text: string }
  | { type: "setStage"; stage: string }
  | { type: "handoff"; reason: string }
  | { type: "requestAiReply"; systemPrompt: string; userMessage: string };

export interface StepResult {
  state: EngineState;
  actions: FlowAction[];
}
