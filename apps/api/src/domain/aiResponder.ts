export interface AiReplyInput {
  systemPrompt: string;
  userMessage: string;
}

/** Anything that can turn an `aiReply` flow node into an actual message back to the customer. */
export interface AiResponder {
  reply(input: AiReplyInput): Promise<string>;
}

/**
 * Placeholder implementation used until a real LLM provider (e.g. the Anthropic API) is wired in.
 * Kept behind the same `AiResponder` interface so swapping it later never touches the flow engine
 * or the routes — only this one class needs to change.
 */
export class EchoAiResponder implements AiResponder {
  async reply({ userMessage }: AiReplyInput): Promise<string> {
    return `Entendi: "${userMessage}". Um especialista confirma os detalhes em seguida.`;
  }
}
