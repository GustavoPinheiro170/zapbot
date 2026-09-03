import { NavLink } from "react-router-dom";

const LINKS = [
  { to: "/", label: "Painel", end: true },
  { to: "/flows", label: "Fluxos", end: false },
  { to: "/conversations", label: "Conversas", end: false },
  { to: "/settings", label: "Conectar WhatsApp", end: false },
];

export function Sidebar() {
  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-slate-200 bg-white px-4 py-6">
      <div className="mb-8 flex items-center gap-2 px-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-blue to-brand-green">
          <svg width="16" height="16" viewBox="0 0 24 24">
            <path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" fill="#fff" />
          </svg>
        </div>
        <span className="font-display text-lg font-extrabold text-brand-ink">ZapFlow</span>
      </div>
      <nav className="flex flex-col gap-1">
        {LINKS.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) =>
              `rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                isActive ? "bg-brand-blue/10 text-brand-blue" : "text-slate-500 hover:bg-slate-100"
              }`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
