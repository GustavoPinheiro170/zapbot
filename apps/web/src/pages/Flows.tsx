import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { activateFlow, fetchFlows, fetchSettings } from "../lib/apiClient";
import type { Flow } from "../lib/flowTypes";

export function Flows() {
  const [flows, setFlows] = useState<Flow[]>([]);
  const [activeFlowId, setActiveFlowId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activatingId, setActivatingId] = useState<string | null>(null);

  function load() {
    setLoading(true);
    Promise.all([fetchFlows(), fetchSettings()])
      .then(([flowList, settings]) => {
        setFlows(flowList);
        setActiveFlowId(settings.activeFlowId);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleActivate(id: string) {
    setActivatingId(id);
    try {
      const result = await activateFlow(id);
      setActiveFlowId(result.activeFlowId);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setActivatingId(null);
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-brand-ink">Fluxos</h1>
          <p className="mt-1 text-sm text-slate-500">
            Os roteiros que o robô segue em cada conversa. Só o fluxo marcado como{" "}
            <span className="font-semibold text-brand-green">Ativo</span> roda quando uma mensagem chega.
          </p>
        </div>
        <Link
          to="/flows/new"
          className="shrink-0 rounded-full bg-brand-blue px-5 py-2 text-sm font-bold text-white transition-transform hover:-translate-y-0.5"
        >
          + Novo fluxo
        </Link>
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="mt-6 text-sm text-slate-400">Carregando...</p>
      ) : flows.length === 0 ? (
        <p className="mt-6 max-w-lg text-sm text-slate-400">
          Nenhum fluxo ainda. Clique em "Novo fluxo" para montar as perguntas e respostas do seu robô.
        </p>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {flows.map((flow) => {
            const isActive = flow.id === activeFlowId;
            return (
              <div
                key={flow.id}
                className={`rounded-2xl border bg-white p-5 transition-colors ${
                  isActive ? "border-brand-green" : "border-slate-200 hover:border-brand-blue"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <Link to={`/flows/${flow.id}`} className="min-w-0 flex-1">
                    <div className="truncate text-sm font-bold text-brand-ink">{flow.name}</div>
                    <div className="mt-1 text-xs text-slate-400">
                      {flow.nodes.length} nó(s) · início em "{flow.entryNodeId || "—"}"
                    </div>
                  </Link>
                  {isActive ? (
                    <span className="shrink-0 rounded-full bg-brand-green/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-brand-green">
                      Ativo
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleActivate(flow.id)}
                      disabled={activatingId === flow.id}
                      className="shrink-0 rounded-full border border-slate-200 px-3 py-1 text-xs font-bold text-brand-ink hover:border-brand-blue hover:text-brand-blue disabled:opacity-50"
                    >
                      {activatingId === flow.id ? "Ativando..." : "Ativar"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
