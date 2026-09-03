import { useEffect, useState } from "react";
import { fetchConversations, fetchFlows, type ConversationSummary, type Flow } from "../lib/apiClient";

export function Dashboard() {
  const [flows, setFlows] = useState<Flow[] | null>(null);
  const [conversations, setConversations] = useState<ConversationSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([fetchFlows(), fetchConversations()])
      .then(([flowList, conversationList]) => {
        setFlows(flowList);
        setConversations(conversationList);
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  const needingHuman = conversations?.filter((conversation) => conversation.needsHuman).length ?? 0;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-extrabold text-brand-ink">Painel</h1>
      <p className="mt-1 text-sm text-slate-500">Visão geral do seu robô de atendimento.</p>

      {error && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Não foi possível carregar os dados da API ({error}). Confirme que ela está rodando (
          <code>npm run dev:api</code>).
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Fluxos ativos" value={flows?.length ?? "—"} />
        <StatCard label="Conversas" value={conversations?.length ?? "—"} />
        <StatCard label="Aguardando humano" value={needingHuman} highlight={needingHuman > 0} />
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number | string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</div>
      <div
        className={`mt-2 font-display text-3xl font-extrabold ${
          highlight ? "text-amber-600" : "text-brand-ink"
        }`}
      >
        {value}
      </div>
    </div>
  );
}
