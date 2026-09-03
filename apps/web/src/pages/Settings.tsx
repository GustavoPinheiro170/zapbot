import { useEffect, useState } from "react";
import { fetchSettings, saveSettings, testConnection, type TestConnectionResult, type WhatsAppSettings } from "../lib/apiClient";

export function Settings() {
  const [settings, setSettings] = useState<WhatsAppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [accessTokenInput, setAccessTokenInput] = useState("");
  const [phoneNumberIdInput, setPhoneNumberIdInput] = useState("");
  const [verifyTokenInput, setVerifyTokenInput] = useState("");

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestConnectionResult | null>(null);

  useEffect(() => {
    fetchSettings()
      .then((loaded) => {
        setSettings(loaded);
        setPhoneNumberIdInput(loaded.metaPhoneNumberId);
        setVerifyTokenInput(loaded.metaVerifyToken);
      })
      .catch((err: Error) => setLoadError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    setTestResult(null);
    try {
      const updated = await saveSettings({
        metaAccessToken: accessTokenInput.trim() || undefined,
        metaPhoneNumberId: phoneNumberIdInput.trim() || undefined,
        metaVerifyToken: verifyTokenInput.trim() || undefined,
      });
      setSettings(updated);
      setAccessTokenInput("");
      setSavedAt(Date.now());
    } catch (err) {
      setSaveError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleTestConnection() {
    setTesting(true);
    setTestResult(null);
    try {
      setTestResult(await testConnection());
    } catch (err) {
      setTestResult({ ok: false, error: (err as Error).message });
    } finally {
      setTesting(false);
    }
  }

  if (loading) {
    return <p className="p-8 text-sm text-slate-400">Carregando...</p>;
  }
  if (loadError || !settings) {
    return <p className="p-8 text-sm text-red-600">{loadError ?? "Não foi possível carregar as configurações."}</p>;
  }

  return (
    <div className="p-8">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-extrabold text-brand-ink">Conectar WhatsApp</h1>
        {settings.connected ? (
          <span className="rounded-full bg-brand-green/10 px-3 py-1 text-xs font-bold text-brand-green">Conectado</span>
        ) : (
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">Não conectado</span>
        )}
      </div>
      <p className="mt-1 max-w-xl text-sm text-slate-500">
        Cole aqui as credenciais da Meta Cloud API para o robô passar a enviar mensagens de verdade pelo fluxo que
        você montou. Sem isso, tudo continua funcionando em modo de simulação.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
        <div className="max-w-lg rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex flex-col gap-4">
            <label className="block">
              <span className="text-xs font-semibold text-slate-500">Access Token</span>
              <input
                type="password"
                className="input"
                value={accessTokenInput}
                onChange={(event) => setAccessTokenInput(event.target.value)}
                placeholder={settings.hasAccessToken ? "•••••••••••• (já configurado — deixe em branco para manter)" : "Cole o token da Meta aqui"}
                autoComplete="off"
              />
            </label>

            <label className="block">
              <span className="text-xs font-semibold text-slate-500">Phone Number ID</span>
              <input
                className="input"
                value={phoneNumberIdInput}
                onChange={(event) => setPhoneNumberIdInput(event.target.value)}
                placeholder="ex: 123456789012345"
              />
            </label>

            <label className="block">
              <span className="text-xs font-semibold text-slate-500">Verify Token</span>
              <input
                className="input"
                value={verifyTokenInput}
                onChange={(event) => setVerifyTokenInput(event.target.value)}
                placeholder="uma palavra-chave à sua escolha"
              />
              <span className="mt-1 block text-[11px] text-slate-400">
                Use esse mesmo valor no campo "Verify token" ao configurar o webhook no painel da Meta.
              </span>
            </label>

            <div className="mt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="rounded-full bg-brand-blue px-6 py-2 text-sm font-bold text-white transition-transform hover:-translate-y-0.5 disabled:opacity-50"
              >
                {saving ? "Salvando..." : "Salvar"}
              </button>
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testing || !settings.hasAccessToken}
                className="rounded-full border border-slate-200 px-6 py-2 text-sm font-bold text-brand-ink hover:border-brand-blue hover:text-brand-blue disabled:cursor-not-allowed disabled:opacity-50"
                title={!settings.hasAccessToken ? "Salve um Access Token primeiro" : undefined}
              >
                {testing ? "Testando..." : "Testar conexão"}
              </button>
              {savedAt && !saveError && <span className="text-xs font-semibold text-brand-green">Salvo.</span>}
            </div>

            {saveError && <p className="text-xs text-red-600">{saveError}</p>}

            {testResult && (
              <div
                className={`rounded-lg px-3 py-2 text-xs font-semibold ${
                  testResult.ok ? "bg-brand-green/10 text-brand-green" : "bg-red-50 text-red-600"
                }`}
              >
                {testResult.ok
                  ? `Conexão confirmada${testResult.displayPhoneNumber ? ` — número ${testResult.displayPhoneNumber}` : ""}.`
                  : testResult.error}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-dashed border-slate-300 p-5 text-xs leading-relaxed text-slate-500">
          <div className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Onde pegar cada campo</div>
          <ol className="list-decimal space-y-2 pl-4">
            <li>
              Em <span className="font-semibold text-slate-700">developers.facebook.com</span>, crie um app tipo
              "Business" e adicione o produto <span className="font-semibold text-slate-700">WhatsApp</span>.
            </li>
            <li>
              Em <span className="font-semibold text-slate-700">WhatsApp → API Setup</span>: copie o{" "}
              <span className="font-semibold text-slate-700">Phone number ID</span> e gere um Access Token.
            </li>
            <li>
              Em <span className="font-semibold text-slate-700">WhatsApp → Configuration → Webhook</span>, cadastre a
              URL <code className="rounded bg-slate-100 px-1">https://seu-domínio/webhook/whatsapp</code> e use o
              mesmo Verify Token daqui.
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
