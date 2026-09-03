import type { CSSProperties } from "react";
import type { FlowNodeType } from "../lib/flowTypes";

const PATHS: Record<FlowNodeType, string> = {
  message: "M4 5h16v11H8l-4 4V5z",
  collect:
    "M12 20.5a8.5 8.5 0 100-17 8.5 8.5 0 000 17zM9.7 9.6a2.3 2.3 0 014.5.7c0 1.4-1.9 1.6-1.9 3M12 16.2v.1",
  condition: "M6 5v6M6 11a3 3 0 003 3h4M18 5v3.5",
  setStage: "M3.5 4h5v16h-5zM10.2 4h5v10h-5zM16.8 4h5v13h-5z",
  aiReply:
    "M12 3l1.4 3.8L17 8l-3.6 1.2L12 13l-1.4-3.8L7 8l3.6-1.2L12 3zM19 14l.6 1.7 1.9.6-1.9.6-.6 1.7-.6-1.7-1.9-.6 1.9-.6L19 14z",
  handoff: "M12 4.8a3.2 3.2 0 110 6.4 3.2 3.2 0 010-6.4zM5 19.5c0-3.6 3.1-6.5 7-6.5s7 2.9 7 6.5",
  end: "M6 3v18M6 4h11l-3 4 3 4H6",
};

const CIRCLE_TYPES = new Set<FlowNodeType>(["collect", "condition"]);

export function NodeTypeIcon({ type, className, style }: { type: FlowNodeType; className?: string; style?: CSSProperties }) {
  return (
    <svg
      className={className}
      style={style}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={type === "collect" ? 1.6 : 1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {CIRCLE_TYPES.has(type) && type === "collect" && <circle cx="12" cy="12" r="8.5" />}
      {CIRCLE_TYPES.has(type) && type === "condition" && (
        <>
          <circle cx="6" cy="5" r="1.6" fill="currentColor" stroke="none" />
          <circle cx="6" cy="19" r="1.6" fill="currentColor" stroke="none" />
          <circle cx="18" cy="8.5" r="1.6" fill="currentColor" stroke="none" />
        </>
      )}
      <path d={PATHS[type]} />
    </svg>
  );
}
