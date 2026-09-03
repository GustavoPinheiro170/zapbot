import type { ConversationSummary } from "../lib/apiClient";

// Mirrors the stage values the default flow's setStage nodes emit (see apps/api/src/domain/defaultFlow.ts).
// A future iteration can make these columns configurable per account instead of hard-coded here.
const COLUMNS: { key: string | null; label: string }[] = [
  { key: null, label: "Novo contato" },
  { key: "novo-lead", label: "Novo lead" },
  { key: "suporte", label: "Suporte" },
  { key: "fechado", label: "Fechado" },
];

export function KanbanBoard({ conversations }: { conversations: ConversationSummary[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
      {COLUMNS.map((column) => {
        const items = conversations.filter((conversation) => conversation.stage === column.key);
        return (
          <div key={column.label} className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">{column.label}</div>
            <div className="flex flex-col gap-3">
              {items.length === 0 && <p className="text-xs text-slate-400">Nenhuma conversa por aqui ainda.</p>}
              {items.map((conversation) => {
                const lastOutbound = [...conversation.history].reverse().find((entry) => entry.direction === "out");
                const lastSendFailed = lastOutbound?.status === "failed";
                return (
                  <div
                    key={conversation.phone}
                    className="rounded-xl border-l-4 border-brand-blue bg-slate-50 p-3"
                  >
                    <div className="text-sm font-bold text-slate-900">
                      {conversation.contactName ?? conversation.phone}
                    </div>
                    {conversation.needsHuman && (
                      <div className="mt-1 text-xs font-semibold text-amber-600">
                        Precisa de atendimento humano
                      </div>
                    )}
                    {lastSendFailed && (
                      <div className="mt-1 text-xs font-semibold text-red-600" title={lastOutbound?.error}>
                        Última mensagem não foi entregue
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
