import type { ReactNode } from "react";
import { NODE_TYPE_COLORS, NODE_TYPE_LABELS, type FlowNode } from "../lib/flowTypes";
import { NodeTypeIcon } from "./nodeIcons";

interface NodePanelProps {
  node: FlowNode;
  isEntry: boolean;
  onChange: (patch: Record<string, unknown>) => void;
  onRemove: () => void;
  onClose: () => void;
}

export function NodePanel({ node, isEntry, onChange, onRemove, onClose }: NodePanelProps) {
  const colors = NODE_TYPE_COLORS[node.type];

  return (
    <div className="flex h-full w-80 shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: colors.bg }}>
          <NodeTypeIcon type={node.type} className="h-4.5 w-4.5" style={{ color: colors.text }} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-bold text-brand-ink">{NODE_TYPE_LABELS[node.type]}</div>
          <div className="text-[11px] text-slate-400">{node.id}</div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          aria-label="Fechar painel"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>

      {isEntry && (
        <div className="mx-5 mt-4 rounded-lg bg-brand-green/10 px-3 py-2 text-[11px] font-semibold text-brand-green">
          Este é o nó de início do fluxo.
        </div>
      )}

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-5 py-4">
        {node.type === "message" && (
          <Field label="Mensagem">
            <textarea
              className="input"
              rows={4}
              value={node.text}
              onChange={(event) => onChange({ text: event.target.value })}
              placeholder="O que o robô vai dizer aqui?"
            />
          </Field>
        )}

        {node.type === "collect" && (
          <>
            <Field label="Pergunta">
              <textarea
                className="input"
                rows={3}
                value={node.prompt}
                onChange={(event) => onChange({ prompt: event.target.value })}
                placeholder="O que perguntar ao cliente?"
              />
            </Field>
            <Field label="Guardar resposta na variável" hint="letras minúsculas, sem espaço — ex: nome">
              <input
                className="input"
                value={node.variable}
                onChange={(event) => onChange({ variable: event.target.value })}
                placeholder="nome"
              />
            </Field>
          </>
        )}

        {node.type === "condition" && (
          <>
            <Field label="Variável">
              <input
                className="input"
                value={node.variable}
                onChange={(event) => onChange({ variable: event.target.value })}
                placeholder="interesse"
              />
            </Field>
            <Field label="É igual a">
              <input
                className="input"
                value={node.equals}
                onChange={(event) => onChange({ equals: event.target.value })}
                placeholder="vendas"
              />
            </Field>
            <p className="text-[11px] text-slate-400">
              Conecte os dois pontos de saída no canvas para definir para onde vai cada caminho.
            </p>
          </>
        )}

        {node.type === "setStage" && (
          <Field label="Estágio no CRM" hint='ex: "novo-lead", "suporte", "fechado"'>
            <input
              className="input"
              value={node.stage}
              onChange={(event) => onChange({ stage: event.target.value })}
              placeholder="novo-lead"
            />
          </Field>
        )}

        {node.type === "aiReply" && (
          <Field label="Instruções para a IA" hint="o que ela deve saber para responder bem aqui">
            <textarea
              className="input"
              rows={5}
              value={node.systemPrompt}
              onChange={(event) => onChange({ systemPrompt: event.target.value })}
              placeholder="Você é um vendedor consultivo da ZapFlow..."
            />
          </Field>
        )}

        {node.type === "handoff" && (
          <Field label="Motivo da transferência">
            <input
              className="input"
              value={node.reason}
              onChange={(event) => onChange({ reason: event.target.value })}
              placeholder="Cliente pediu para falar com humano"
            />
          </Field>
        )}

        {node.type === "end" && <p className="text-xs text-slate-400">Este nó encerra a conversa — nada é enviado depois dele.</p>}

        {node.type !== "end" && node.type !== "condition" && node.type !== "handoff" && (
          <p className="text-[11px] text-slate-400">
            Arraste do ponto "Próximo passo" no canvas até outro nó para conectar a sequência.
          </p>
        )}
      </div>

      <div className="border-t border-slate-100 px-5 py-4">
        <button
          type="button"
          onClick={onRemove}
          className="w-full rounded-lg border border-red-200 py-2 text-xs font-bold text-red-600 hover:bg-red-50"
        >
          Remover nó
        </button>
      </div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-slate-500">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-slate-400">{hint}</span>}
    </label>
  );
}
