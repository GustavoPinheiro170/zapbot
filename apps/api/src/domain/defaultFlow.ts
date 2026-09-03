import type { Flow } from "@whatsbot/flow-engine";

/**
 * The bot's proposal made concrete: greet the customer, learn their name, find out whether
 * they need sales or support, route accordingly, and either bring in the AI assistant or
 * hand off to a human. This is the flow a brand-new ZapFlow account starts with.
 */
export const welcomeFlow: Flow = {
  id: "welcome",
  name: "Boas-vindas",
  entryNodeId: "ask_name",
  nodes: [
    {
      id: "ask_name",
      type: "collect",
      prompt: "Olá! Eu sou o assistente virtual da ZapFlow. Qual é o seu nome?",
      variable: "name",
      next: "ask_interest",
    },
    {
      id: "ask_interest",
      type: "collect",
      prompt: "Prazer, {{name}}! Você quer falar sobre vendas ou suporte?",
      variable: "interest",
      next: "route",
    },
    {
      id: "route",
      type: "condition",
      variable: "interest",
      equals: "vendas",
      whenTrue: "sales_stage",
      whenFalse: "support_stage",
    },
    {
      id: "sales_stage",
      type: "setStage",
      stage: "novo-lead",
      next: "sales_reply",
    },
    {
      id: "sales_reply",
      type: "aiReply",
      systemPrompt:
        "Você é um vendedor consultivo da ZapFlow. Responda dúvidas sobre planos e recursos de forma direta e simpática.",
      next: "sales_bye",
    },
    {
      id: "sales_bye",
      type: "message",
      text: "Fico à disposição por aqui, {{name}}. Qualquer dúvida é só chamar!",
    },
    {
      id: "support_stage",
      type: "setStage",
      stage: "suporte",
      next: "support_handoff",
    },
    {
      id: "support_handoff",
      type: "handoff",
      reason: "Cliente pediu suporte e precisa de um atendente humano",
    },
  ],
};
