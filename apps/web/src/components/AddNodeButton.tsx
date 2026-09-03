import { useState } from "react";
import { NODE_TYPE_LABELS, NODE_TYPE_ORDER, type FlowNodeType } from "../lib/flowTypes";
import { NodeTypeIcon } from "./nodeIcons";

export function AddNodeButton({ onAdd }: { onAdd: (type: FlowNodeType) => void }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="absolute right-5 top-5 z-10">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-blue text-white shadow-lg transition-transform hover:-translate-y-0.5"
        aria-label="Adicionar nó"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Fechar"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-0 cursor-default"
          />
          <div className="absolute right-0 top-14 z-10 w-64 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
            {NODE_TYPE_ORDER.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => {
                  onAdd(type);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-semibold text-brand-ink hover:bg-slate-50"
              >
                <NodeTypeIcon type={type} className="h-4 w-4 text-slate-400" />
                {NODE_TYPE_LABELS[type]}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
