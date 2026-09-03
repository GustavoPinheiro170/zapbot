import { Handle, Position } from "@xyflow/react";

export const START_NODE_ID = "__start__";

export function FlowStartNode() {
  return (
    <div className="flex w-56 items-center gap-2 rounded-2xl border border-brand-green/40 bg-brand-green/10 px-4 py-3">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1DA851" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 4l14 8-14 8V4z" fill="#1DA851" stroke="none" />
      </svg>
      <div>
        <div className="text-xs font-bold text-brand-green">Início do fluxo</div>
        <div className="text-[10px] text-slate-500">Conecte ao primeiro nó</div>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        id="start"
        className="!h-3 !w-3 !border-2 !bg-white"
        style={{ borderColor: "#1DA851" }}
      />
    </div>
  );
}
