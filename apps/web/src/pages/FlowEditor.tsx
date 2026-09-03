import {
  Background,
  BackgroundVariant,
  Controls,
  ReactFlow,
  ReactFlowProvider,
  type Connection,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
  type NodeMouseHandler,
  type NodeTypes,
} from "@xyflow/react";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AddNodeButton } from "../components/AddNodeButton";
import { FlowCanvasNode, type FlowCanvasNodeType } from "../components/FlowCanvasNode";
import { FlowStartNode, START_NODE_ID } from "../components/FlowStartNode";
import { NodePanel } from "../components/NodePanel";
import { fetchFlow, saveFlow } from "../lib/apiClient";
import { addNode, createEmptyFlow, removeNode, updateNode } from "../lib/flowEditorLogic";
import { layoutNodes } from "../lib/flowLayout";
import { getOutgoingTargets } from "../lib/flowNodePresentation";
import type { Flow, FlowNodeType } from "../lib/flowTypes";

const nodeTypes: NodeTypes = { flowNode: FlowCanvasNode, startNode: FlowStartNode };
const AUTOSAVE_DELAY_MS = 800;

function generateFlowId(): string {
  return `fluxo-${Date.now().toString(36)}`;
}

type CanvasNode = FlowCanvasNodeType | Node<Record<string, unknown>, "startNode">;

export function FlowEditor() {
  return (
    <ReactFlowProvider>
      <FlowEditorCanvas />
    </ReactFlowProvider>
  );
}

function FlowEditorCanvas() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = id === "new";

  const [flow, setFlow] = useState<Flow | null>(null);
  const [loading, setLoading] = useState(!isNew);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveError, setSaveError] = useState<string | null>(null);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipNextSaveRef = useRef(true);

  useEffect(() => {
    if (isNew) {
      skipNextSaveRef.current = true;
      setFlow(createEmptyFlow(generateFlowId(), "Novo fluxo"));
      return;
    }
    if (!id) return;
    setLoading(true);
    fetchFlow(id)
      .then((loaded) => {
        skipNextSaveRef.current = true;
        setFlow(loaded);
      })
      .catch((err: Error) => setLoadError(err.message))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Fills in a canvas position for any node that doesn't have one yet (new flow, or a node
  // just added) without disturbing nodes the user has already dragged somewhere.
  useEffect(() => {
    if (!flow) return;
    if (!flow.nodes.some((node) => !node.position)) return;
    setFlow({ ...flow, nodes: layoutNodes(flow) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flow]);

  function flushSave(target: Flow) {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setSaveStatus("saving");
    return saveFlow(target)
      .then(() => {
        setSaveStatus("saved");
        setSaveError(null);
      })
      .catch((err: Error) => {
        setSaveStatus("error");
        setSaveError(err.message);
      });
  }

  // Autosave: debounce every change to `flow`, but never on the render right after we just
  // loaded/replaced it from the server (that isn't an edit).
  useEffect(() => {
    if (!flow) return;
    if (skipNextSaveRef.current) {
      skipNextSaveRef.current = false;
      return;
    }
    setSaveStatus("saving");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    const flowToSave = flow;
    saveTimer.current = setTimeout(() => {
      saveFlow(flowToSave)
        .then(() => {
          setSaveStatus("saved");
          setSaveError(null);
          if (isNew) {
            navigate(`/flows/${flowToSave.id}`, { replace: true });
          }
        })
        .catch((err: Error) => {
          setSaveStatus("error");
          setSaveError(err.message);
        });
    }, AUTOSAVE_DELAY_MS);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flow]);

  async function handleBack() {
    if (flow) await flushSave(flow);
    navigate("/flows");
  }

  if (loading) {
    return <p className="p-8 text-sm text-slate-400">Carregando...</p>;
  }
  if (loadError || !flow) {
    return <p className="p-8 text-sm text-red-600">{loadError ?? "Fluxo não encontrado."}</p>;
  }

  const selectedNode = flow.nodes.find((node) => node.id === selectedNodeId) ?? null;

  const canvasNodes: CanvasNode[] = [
    {
      id: START_NODE_ID,
      type: "startNode",
      position: { x: -280, y: flow.nodes.find((node) => node.id === flow.entryNodeId)?.position?.y ?? 0 },
      data: {},
      draggable: false,
      selectable: false,
    },
    ...flow.nodes
      .filter((node) => node.position)
      .map<FlowCanvasNodeType>((node) => ({
        id: node.id,
        type: "flowNode",
        position: node.position!,
        selected: node.id === selectedNodeId,
        data: { node, isEntry: node.id === flow.entryNodeId },
      })),
  ];

  const canvasEdges: Edge[] = [];
  if (flow.entryNodeId) {
    canvasEdges.push({
      id: `${START_NODE_ID}->${flow.entryNodeId}`,
      source: START_NODE_ID,
      sourceHandle: "start",
      target: flow.entryNodeId,
      targetHandle: "in",
      style: { stroke: "#1DA851", strokeWidth: 2 },
    });
  }
  for (const node of flow.nodes) {
    for (const { output, target } of getOutgoingTargets(node)) {
      canvasEdges.push({
        id: `${node.id}:${output}->${target}`,
        source: node.id,
        sourceHandle: output,
        target,
        targetHandle: "in",
        style: { stroke: "#94A3B8", strokeWidth: 1.6 },
      });
    }
  }

  function handleNodesChange(changes: NodeChange[]) {
    if (!flow) return;
    let next = flow;
    let clearedSelection = false;
    for (const change of changes) {
      if (change.type === "position" && change.position && change.id !== START_NODE_ID) {
        next = updateNode(next, change.id, { position: change.position });
      } else if (change.type === "remove" && change.id !== START_NODE_ID) {
        next = removeNode(next, change.id);
        if (change.id === selectedNodeId) clearedSelection = true;
      }
    }
    if (next !== flow) setFlow(next);
    if (clearedSelection) setSelectedNodeId(null);
  }

  function handleEdgesChange(changes: EdgeChange[]) {
    if (!flow) return;
    let next = flow;
    for (const change of changes) {
      if (change.type !== "remove") continue;
      const edge = canvasEdges.find((candidate) => candidate.id === change.id);
      if (!edge) continue;
      if (edge.source === START_NODE_ID) {
        next = { ...next, entryNodeId: "" };
      } else {
        const field = (edge.sourceHandle ?? "next") as "next" | "whenTrue" | "whenFalse";
        next = updateNode(next, edge.source, { [field]: field === "next" ? undefined : "" });
      }
    }
    if (next !== flow) setFlow(next);
  }

  function handleConnect(connection: Connection) {
    if (!flow || !connection.source || !connection.target) return;
    if (connection.source === START_NODE_ID) {
      setFlow({ ...flow, entryNodeId: connection.target });
      return;
    }
    const field = (connection.sourceHandle ?? "next") as "next" | "whenTrue" | "whenFalse";
    setFlow(updateNode(flow, connection.source, { [field]: connection.target }));
  }

  const handleNodeClick: NodeMouseHandler = (_event, node) => {
    if (node.id === START_NODE_ID) return;
    setSelectedNodeId(node.id);
  };

  function handleAddNode(type: FlowNodeType) {
    if (!flow) return;
    setFlow(addNode(flow, type));
  }

  const saveStatusLabel =
    saveStatus === "saving"
      ? "Salvando..."
      : saveStatus === "error"
        ? `Não foi possível salvar${saveError ? `: ${saveError}` : ""}`
        : saveStatus === "saved"
          ? "Tudo salvo"
          : "";

  return (
    <div className="flex h-screen w-full">
      {selectedNode && (
        <NodePanel
          node={selectedNode}
          isEntry={selectedNode.id === flow.entryNodeId}
          onChange={(patch) => setFlow(updateNode(flow, selectedNode.id, patch))}
          onRemove={() => {
            setFlow(removeNode(flow, selectedNode.id));
            setSelectedNodeId(null);
          }}
          onClose={() => setSelectedNodeId(null)}
        />
      )}

      <div className="relative flex-1">
        <div className="absolute left-5 top-5 z-10 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/95 px-4 py-2.5 shadow-sm backdrop-blur">
          <button type="button" onClick={handleBack} className="text-xs font-semibold text-slate-400 hover:text-brand-blue">
            ← Fluxos
          </button>
          <div className="h-4 w-px bg-slate-200" />
          <input
            className="font-display text-sm font-bold text-brand-ink outline-none"
            value={flow.name}
            onChange={(event) => setFlow({ ...flow, name: event.target.value })}
          />
          <span className="text-[11px] font-semibold text-slate-400">{saveStatusLabel}</span>
        </div>

        <AddNodeButton onAdd={handleAddNode} />

        <ReactFlow
          nodes={canvasNodes}
          edges={canvasEdges}
          nodeTypes={nodeTypes}
          onNodesChange={handleNodesChange}
          onEdgesChange={handleEdgesChange}
          onConnect={handleConnect}
          onNodeClick={handleNodeClick}
          onPaneClick={() => setSelectedNodeId(null)}
          fitView
          proOptions={{ hideAttribution: true }}
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#E2E8F0" />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>
    </div>
  );
}
