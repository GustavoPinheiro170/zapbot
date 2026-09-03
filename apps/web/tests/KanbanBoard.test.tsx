import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { KanbanBoard } from "../src/components/KanbanBoard";
import type { ConversationSummary } from "../src/lib/apiClient";

describe("KanbanBoard", () => {
  it("groups conversations into their CRM stage column", () => {
    const conversations: ConversationSummary[] = [
      { phone: "1", contactName: "Ana", stage: "novo-lead", needsHuman: false, history: [] },
      { phone: "2", contactName: "Rafael", stage: "suporte", needsHuman: true, history: [] },
      { phone: "3", contactName: "Camila", stage: null, needsHuman: false, history: [] },
    ];

    render(<KanbanBoard conversations={conversations} />);

    expect(screen.getByText("Ana")).toBeInTheDocument();
    expect(screen.getByText("Rafael")).toBeInTheDocument();
    expect(screen.getByText("Camila")).toBeInTheDocument();
    expect(screen.getByText("Novo lead")).toBeInTheDocument();
    expect(screen.getByText("Suporte")).toBeInTheDocument();
  });

  it("falls back to the phone number when a contact has no name yet", () => {
    const conversations: ConversationSummary[] = [
      { phone: "5511999998888", stage: null, needsHuman: false, history: [] },
    ];

    render(<KanbanBoard conversations={conversations} />);

    expect(screen.getByText("5511999998888")).toBeInTheDocument();
  });

  it("flags conversations that are waiting for a human", () => {
    const conversations: ConversationSummary[] = [
      { phone: "1", contactName: "Rafael", stage: "suporte", needsHuman: true, history: [] },
    ];

    render(<KanbanBoard conversations={conversations} />);

    expect(screen.getByText(/precisa de atendimento humano/i)).toBeInTheDocument();
  });

  it("shows an empty-state hint in a column with no conversations", () => {
    render(<KanbanBoard conversations={[]} />);

    expect(screen.getAllByText(/nenhuma conversa/i).length).toBeGreaterThan(0);
  });

  it("flags a conversation whose last outbound message failed to send", () => {
    const conversations: ConversationSummary[] = [
      {
        phone: "1",
        contactName: "Ana",
        stage: "novo-lead",
        needsHuman: false,
        history: [
          { direction: "in", text: "Oi", at: "2026-01-01T00:00:00.000Z" },
          {
            direction: "out",
            text: "Olá!",
            at: "2026-01-01T00:00:01.000Z",
            status: "failed",
            error: "Re-engagement message",
          },
        ],
      },
    ];

    render(<KanbanBoard conversations={conversations} />);

    expect(screen.getByText(/última mensagem não foi entregue/i)).toBeInTheDocument();
  });

  it("does not flag a conversation whose last outbound message was sent fine", () => {
    const conversations: ConversationSummary[] = [
      {
        phone: "1",
        contactName: "Ana",
        stage: "novo-lead",
        needsHuman: false,
        history: [{ direction: "out", text: "Olá!", at: "2026-01-01T00:00:00.000Z", status: "sent" }],
      },
    ];

    render(<KanbanBoard conversations={conversations} />);

    expect(screen.queryByText(/última mensagem não foi entregue/i)).not.toBeInTheDocument();
  });
});
