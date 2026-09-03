import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Sidebar } from "./components/Sidebar";
import { Conversations } from "./pages/Conversations";
import { Dashboard } from "./pages/Dashboard";
import { FlowEditor } from "./pages/FlowEditor";
import { Flows } from "./pages/Flows";
import { Settings } from "./pages/Settings";

export function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/flows" element={<Flows />} />
            <Route path="/flows/:id" element={<FlowEditor />} />
            <Route path="/conversations" element={<Conversations />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
