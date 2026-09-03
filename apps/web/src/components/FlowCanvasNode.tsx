import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import { NODE_TYPE_COLORS, NODE_TYPE_LABELS, type FlowNode } from "../lib/flowTypes";
import { getNodeOutputs, getNodePreview } from "../lib/flowNodePresentation";
import { NodeTypeIcon } from "./nodeIcons";

export interface FlowCanvasNodeData extends Record<string, unknown> {
  node: FlowNode;
  isEntry: boolean;
}

export type FlowCanvasNodeType = Node<FlowCanvasNodeData, "flowNode">;

export function FlowCanvasNode({ data, selected }: NodeProps<FlowCanvasNodeType>) {
  const { node, isEntry } = data;
  const colors = NODE_TYPE_COLORS[node.type];
  const outputs = getNodeOutputs(node);

  return (
    <div
      className="w-72 rounded-2xl border bg-white shadow-sm transition-shadow"
      style={{ borderColor: selected ? colors.ring : "#E5E8F0", boxShadow: selected ? `0 0 0 3px ${colors.ring}33` : undefined }}
    >
      <Handle
        type="target"
        position={Position.Left}
        id="in"
        className="!h-3 !w-3 !border-2 !bg-white"
        style={{ borderColor: colors.ring }}
      />

      <div className="flex items-center gap-2 rounded-t-2xl px-3 py-2.5" style={{ background: colors.bg }}>
        <NodeTypeIcon type={node.type} className="h-4 w-4 shrink-0" style={{ color: colors.text }} />
        <span className="text-xs font-bold" style={{ color: colors.text }}>
          {NODE_TYPE_LABELS[node.type]}
        </span>
        {isEntry && (
          <span className="ml-auto shrink-0 rounded-full bg-white/70 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-slate-500">
            Início
          </span>
        )}
      </div>

      <div className="line-clamp-3 px-3 py-2.5 text-xs leading-relaxed text-slate-600">{getNodePreview(node)}</div>

      {outputs.length > 0 && (
        <div className="flex flex-col border-t border-slate-100">
          {outputs.map((output) => (
            <div key={output.id} className="relative border-t border-slate-50 px-3 py-2 text-[11px] font-semibold text-slate-500 first:border-t-0">
              {output.label}
              <Handle
                type="source"
                position={Position.Right}
                id={output.id}
                className="!h-3 !w-3 !border-2 !bg-white"
                style={{ position: "absolute", right: -7, top: "50%", transform: "translateY(-50%)", borderColor: colors.ring }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
