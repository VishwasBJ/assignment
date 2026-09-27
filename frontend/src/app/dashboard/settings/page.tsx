"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { apiClient } from "@/lib/api";
import type { AIProvider, ProviderType } from "@/lib/types";
import { GlassButton } from "@/components/ui/GlassButton";
import { GlassModal } from "@/components/ui/GlassModal";
import { GlassInput } from "@/components/ui/GlassInput";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Plus, Trash2, Star, Cpu, CheckCircle2 } from "lucide-react";

const PRESETS: Record<ProviderType, { label: string; baseUrl: string; model: string }> = {
  OPENAI:     { label: "OpenAI",     baseUrl: "https://api.openai.com/v1",       model: "gpt-4o-mini" },
  LM_STUDIO:  { label: "LM Studio",  baseUrl: "http://localhost:1234/v1",         model: "local-model" },
  OLLAMA:     { label: "Ollama",      baseUrl: "http://localhost:11434/v1",        model: "llama3" },
  OPENROUTER: { label: "OpenRouter",  baseUrl: "https://openrouter.ai/api/v1",    model: "meta-llama/llama-3.1-8b-instruct:free" },
  CUSTOM:     { label: "Custom",      baseUrl: "http://localhost:8000/v1",         model: "custom-model" },
};

export default function SettingsPage() {
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  const fetch = async () => {
    setLoading(true);
    try { const { data } = await apiClient.get("/ai-providers"); setProviders(data); }
    catch { toast.error("Failed to load providers"); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetch(); }, []);

  const setDefault = async (id: string) => {
    try { await apiClient.put(`/ai-providers/${id}`, { isDefault: true }); toast.success("Default updated"); fetch(); }
    catch { toast.error("Failed to update"); }
  };

  const del = async (id: string) => {
    if (!confirm("Delete this provider?")) return;
    try { await apiClient.delete(`/ai-providers/${id}`); setProviders(p => p.filter(x => x.id !== id)); toast.success("Deleted"); }
    catch { toast.error("Failed to delete"); }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: "40rem", margin: "0 auto" }}>
      <div className="section-header">
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#f1f5f9", marginBottom: "0.25rem" }}>Settings</h1>
          <p style={{ color: "#475569", fontSize: "0.875rem" }}>Configure your AI providers</p>
        </div>
        <GlassButton onClick={() => setShowAdd(true)} icon={<Plus size={15} />}>Add Provider</GlassButton>
      </div>

      {loading ? <div style={{ display: "flex", justifyContent: "center", marginTop: "3rem" }}><LoadingSpinner /></div>
        : providers.length === 0 ? (
          <div className="card"><div className="empty-state">
            <Cpu size={36} style={{ color: "#1e293b" }} />
            <p style={{ fontWeight: 600, color: "#f1f5f9" }}>No AI providers yet</p>
            <p style={{ color: "#475569", fontSize: "0.875rem", textAlign: "center" }}>
              Add OpenAI, LM Studio, Ollama, or any OpenAI-compatible endpoint.
            </p>
            <GlassButton onClick={() => setShowAdd(true)} icon={<Plus size={15} />}>Add Provider</GlassButton>
          </div></div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {providers.map(p => (
              <div key={p.id} className="card" style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.375rem" }}>
                    <span style={{ fontWeight: 600, color: "#f1f5f9" }}>{p.name}</span>
                    {p.isDefault && (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", fontSize: "0.7rem", fontWeight: 700, color: "#a5b4fc", background: "rgba(99,102,241,0.2)", padding: "0.15rem 0.5rem", borderRadius: "99px" }}>
                        <CheckCircle2 size={10} /> Default
                      </span>
                    )}
                    <span style={{ fontSize: "0.7rem", color: "#475569", background: "rgba(255,255,255,0.05)", padding: "0.15rem 0.5rem", borderRadius: "99px", textTransform: "uppercase" }}>
                      {PRESETS[p.providerType]?.label ?? p.providerType}
                    </span>
                  </div>
                  <p style={{ fontSize: "0.8125rem", color: "#475569", margin: "0 0 0.125rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.baseUrl}</p>
                  <p style={{ fontSize: "0.75rem", color: "#334155", margin: 0 }}>Model: {p.modelName}</p>
                </div>
                <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
                  {!p.isDefault && (
                    <GlassButton variant="ghost" size="sm" onClick={() => setDefault(p.id)} icon={<Star size={12} />}>
                      Default
                    </GlassButton>
                  )}
                  <GlassButton variant="danger" size="sm" onClick={() => del(p.id)} icon={<Trash2 size={13} />} />
                </div>
              </div>
            ))}
          </div>
        )}

      <AddProviderModal open={showAdd} onClose={() => setShowAdd(false)} onAdded={() => { setShowAdd(false); fetch(); }} />
    </div>
  );
}

function AddProviderModal({ open, onClose, onAdded }: { open: boolean; onClose: () => void; onAdded: () => void }) {
  const [type, setType] = useState<ProviderType>("OPENAI");
  const [name, setName] = useState(""); const [baseUrl, setBaseUrl] = useState(PRESETS.OPENAI.baseUrl);
  const [apiKey, setApiKey] = useState(""); const [model, setModel] = useState(PRESETS.OPENAI.model);
  const [isDefault, setIsDefault] = useState(false); const [saving, setSaving] = useState(false);

  const changeType = (t: ProviderType) => { setType(t); setBaseUrl(PRESETS[t].baseUrl); setModel(PRESETS[t].model); if (!name) setName(PRESETS[t].label); };

  const handleSave = async () => {
    if (!name.trim() || !baseUrl.trim() || !model.trim()) { toast.error("Name, Base URL, and Model are required"); return; }
    setSaving(true);
    try {
      await apiClient.post("/ai-providers", { name: name.trim(), providerType: type, baseUrl: baseUrl.trim(), apiKey: apiKey.trim() || undefined, modelName: model.trim(), isDefault });
      toast.success("Provider added!"); onAdded();
    } catch (err: any) { toast.error(err?.response?.data?.message || "Failed to add provider"); }
    finally { setSaving(false); }
  };

  return (
    <GlassModal open={open} onClose={onClose} title="Add AI Provider">
      <div style={{ display: "flex", flexDirection: "column", gap: "1.125rem" }}>
        <div>
          <p className="label">Provider Type</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            {(Object.keys(PRESETS) as ProviderType[]).map(t => (
              <button key={t} onClick={() => changeType(t)} style={{
                padding: "0.4rem 0.875rem", borderRadius: "0.625rem", cursor: "pointer",
                border: `1px solid ${type === t ? "rgba(99,102,241,0.5)" : "rgba(255,255,255,0.1)"}`,
                background: type === t ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.03)",
                color: type === t ? "#a5b4fc" : "#64748b", fontSize: "0.8125rem", fontWeight: 500,
              }}>{PRESETS[t].label}</button>
            ))}
          </div>
        </div>
        <GlassInput label="Display Name" placeholder="My OpenAI" value={name} onChange={e => setName(e.target.value)} />
        <GlassInput label="Base URL" placeholder="https://api.openai.com/v1" value={baseUrl} onChange={e => setBaseUrl(e.target.value)} />
        <GlassInput label="API Key (leave blank for local models)" type="password" placeholder="sk-…" value={apiKey} onChange={e => setApiKey(e.target.value)} />
        <GlassInput label="Model Name" placeholder="gpt-4o-mini" value={model} onChange={e => setModel(e.target.value)} />
        <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.875rem", color: "#94a3b8" }}>
          <input type="checkbox" checked={isDefault} onChange={e => setIsDefault(e.target.checked)} style={{ accentColor: "#6366f1" }} />
          Set as default provider
        </label>
        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", paddingTop: "0.5rem" }}>
          <GlassButton variant="ghost" onClick={onClose}>Cancel</GlassButton>
          <GlassButton onClick={handleSave} loading={saving}>Add Provider</GlassButton>
        </div>
      </div>
    </GlassModal>
  );
}
