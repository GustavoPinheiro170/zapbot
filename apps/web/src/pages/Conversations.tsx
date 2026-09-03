import { useEffect, useState } from "react";
import { KanbanBoard } from "../components/KanbanBoard";
import { fetchConversations, type ConversationSummary } from "../lib/apiClient";

export function Conversations() {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchConversations()
      .then(setConversations)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-extrabold text-brand-ink">Conversas</h1>
      <p className="mt-1 text-sm text-slate-500">
        Funil de atendimento do WhatsApp, atualizado pelo robô a cada mensagem.
      </p>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="mt-6 text-sm text-slate-400">Carregando...</p>
      ) : (
        <div className="mt-6">
          <KanbanBoard conversations={conversations} />
        </div>
      )}
    </div>
  );
}
