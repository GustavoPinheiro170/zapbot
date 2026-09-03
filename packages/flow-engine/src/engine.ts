import type { EngineState, Flow, FlowAction, FlowNode, NodeId, StepResult } from "./types.js";

/** Guards against a cyclic flow (e.g. two setStage nodes pointing at each other) hanging the process. */
const MAX_STEPS_PER_TURN = 50;

export function createInitialState(): EngineState {
  return {
    currentNodeId: null,
    awaitingVariable: null,
    variables: {},
    stage: null,
    finished: false,
  };
}

function findNode(flow: Flow, id: NodeId): FlowNode {
  const node = flow.nodes.find((candidate) => candidate.id === id);
  if (!node) {
    throw new Error(`Flow "${flow.id}" has no node with id "${id}"`);
  }
  return node;
}

function interpolate(template: string, variables: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => variables[key] ?? "");
}

/**
 * Advances the flow by one customer turn: resumes from wherever the conversation paused
 * (start, or waiting on a `collect` node) and runs nodes until it hits another pause point
 * (`collect`), a terminal node (`handoff`/`end`), or the end of the graph.
 */
export function step(flow: Flow, state: EngineState, incomingText: string | null): StepResult {
  if (state.finished) {
    return { state, actions: [] };
  }

  const variables = { ...state.variables };
  let currentNodeId = state.currentNodeId;
  let awaitingVariable = state.awaitingVariable;

  if (awaitingVariable) {
    variables[awaitingVariable] = incomingText ?? "";
    const collectNode = currentNodeId ? findNode(flow, currentNodeId) : null;
    currentNodeId = collectNode && "next" in collectNode ? collectNode.next ?? null : null;
    awaitingVariable = null;
  } else if (currentNodeId === null) {
    currentNodeId = flow.entryNodeId;
  }

  const actions: FlowAction[] = [];
  let stage = state.stage;
  let finished = false;
  let guard = 0;

  while (currentNodeId) {
    if (guard++ > MAX_STEPS_PER_TURN) {
      throw new Error(
        `Flow "${flow.id}" exceeded ${MAX_STEPS_PER_TURN} steps in a single turn — check for a cycle without a stopping node.`,
      );
    }

    const node = findNode(flow, currentNodeId);

    switch (node.type) {
      case "message": {
        actions.push({ type: "sendMessage", text: interpolate(node.text, variables) });
        currentNodeId = node.next ?? null;
        break;
      }
      case "collect": {
        actions.push({ type: "sendMessage", text: interpolate(node.prompt, variables) });
        awaitingVariable = node.variable;
        // Keep pointing at this node (instead of null) so the next turn can resume via its `next`.
        currentNodeId = node.id;
        break;
      }
      case "condition": {
        currentNodeId = variables[node.variable] === node.equals ? node.whenTrue : node.whenFalse;
        break;
      }
      case "setStage": {
        stage = node.stage;
        actions.push({ type: "setStage", stage: node.stage });
        currentNodeId = node.next ?? null;
        break;
      }
      case "aiReply": {
        actions.push({
          type: "requestAiReply",
          systemPrompt: node.systemPrompt,
          userMessage: incomingText ?? "",
        });
        currentNodeId = node.next ?? null;
        break;
      }
      case "handoff": {
        actions.push({ type: "handoff", reason: node.reason });
        currentNodeId = null;
        finished = true;
        break;
      }
      case "end": {
        currentNodeId = null;
        finished = true;
        break;
      }
    }

    // A collect node parks the conversation on itself (see above) so the next turn can
    // resume via its `next` — stop walking the graph the moment that happens.
    if (awaitingVariable) {
      break;
    }
  }

  return {
    state: { currentNodeId, awaitingVariable, variables, stage, finished },
    actions,
  };
}
