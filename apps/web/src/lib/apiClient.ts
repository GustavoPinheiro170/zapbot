import type { Flow } from "./flowTypes";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3333";

export interface HistoryEntry {
  direction: "in" | "out";
  text: string;
  at: string;
  status?: "sent" | "failed";
  error?: string;
}

export interface ConversationSummary {
  phone: string;
  contactName?: string;
  stage: string | null;
  needsHuman: boolean;
  history: HistoryEntry[];
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!response.ok) {
    throw new Error(`${init?.method ?? "GET"} ${path} failed with ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export function fetchFlows(): Promise<Flow[]> {
  return request<Flow[]>("/flows");
}

export function fetchFlow(id: string): Promise<Flow> {
  return request<Flow>(`/flows/${encodeURIComponent(id)}`);
}

/** The API's POST /flows upserts by id, so this covers both creating and updating a flow. */
export function saveFlow(flow: Flow): Promise<Flow> {
  return request<Flow>("/flows", { method: "POST", body: JSON.stringify(flow) });
}

/** Makes this the flow a brand-new conversation starts on. */
export function activateFlow(id: string): Promise<{ activeFlowId: string }> {
  return request<{ activeFlowId: string }>(`/flows/${encodeURIComponent(id)}/activate`, { method: "POST" });
}

export function fetchConversations(): Promise<ConversationSummary[]> {
  return request<ConversationSummary[]>("/conversations");
}

export interface WhatsAppSettings {
  metaPhoneNumberId: string;
  metaVerifyToken: string;
  hasAccessToken: boolean;
  connected: boolean;
  activeFlowId: string;
}

export interface WhatsAppSettingsPatch {
  metaAccessToken?: string;
  metaPhoneNumberId?: string;
  metaVerifyToken?: string;
}

export function fetchSettings(): Promise<WhatsAppSettings> {
  return request<WhatsAppSettings>("/settings");
}

export function saveSettings(patch: WhatsAppSettingsPatch): Promise<WhatsAppSettings> {
  return request<WhatsAppSettings>("/settings", { method: "POST", body: JSON.stringify(patch) });
}

export type TestConnectionResult = { ok: true; displayPhoneNumber?: string } | { ok: false; error: string };

/** Deliberately does not use `request()` — a failed check (400/ok:false) is a normal result to show, not a thrown error. */
export async function testConnection(): Promise<TestConnectionResult> {
  const response = await fetch(`${API_URL}/settings/test-connection`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  return response.json() as Promise<TestConnectionResult>;
}

export type { Flow, FlowNode, FlowNodeType, NodeId } from "./flowTypes";
