"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { apiClient } from "@/lib/api";
import type { AIProvider, ProviderType } from "@/lib/types";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { GlassModal } from "@/components/ui/GlassModal";
import { GlassInput } from "@/components/ui/GlassInput";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Plus, Trash2, Star, Cpu, CheckCircle2 } from "lucide-react";

const PROVIDER_PRESETS: Record<ProviderType, { label: string; baseUrl: string; model: string }> = {
  OPENAI:     { label: "OpenAI",      baseUrl: "https://api.openai.com/v1",         model: "gpt-4o-mini" },
  LM_STUDIO:  { label: "LM Studio",   baseUrl: "http://localhost:1234/v1",           model: "local-model" },
  OLLAMA:     { label: "Ollama",       baseUrl: "http://localhost:11434/v1",          model: "llama3" },
  OPENROUTER: { label: "OpenRouter",   baseUrl: "https://openrouter.ai/api/v1",      model: "meta-llama/llama-3.1-8b-instruct:free" },
  CUSTOM:     { label: "Custom",       baseUrl: "http://localhost:8000/v1",           model: "custom-model" },
};

export default function SettingsPage() {
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  const fetch = async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get("/ai-providers");
      setProviders(data);
    } catch { toast.error("Failed to load providers"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  const setDefault = async (id: string) => {
    try {
      await apiClient.put(`/ai-providers/${id}`, { isDefault: true });
      toast.success("Default provider updated");
      fetch();
    } catch { toast.error("Failed to update provider"); }
  };

  const deleteProvider = async (id: string) => {
    if (!confirm("Delete this AI provider?")) return;
    try {
      await apiClient.delete(`/ai-providers/${id}`);
      setProviders((p) => p.filter((x) => x.id !== id));
      toast.success("Provider deleted");
    } catch { toast.error("Failed to delete provider"); }
  };

  return (
    <div className="animate-fade-in max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-slate-400 text-sm mt-0.5">Configure your AI providers</p>
        </div>
        <GlassButton onClick={() => setShowAdd(true)} icon={<Plus size={15} />}>
          Add Provider
        </GlassButton>
      </div>

      {loading ? (
        <div className="flex justify-center mt-10"><LoadingSpinner /></div>
      ) : providers.length === 0 ? (
        <GlassCard className="text-center py-12">
          <Cpu size={36} className="mx-auto text-slate-600 mb-3" />
          <p className="text-white font-medium">No AI providers yet</p>
          <p className="text-slate-400 text-sm mt-1 mb-6">
            Add OpenAI, LM Studio, Ollama, or any OpenAI-compatible endpoint.
          </p>
          <GlassButton onClick={() => setShowAdd(true)} icon={<Plus size={15} />}>
            Add Provider
          </GlassButton>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {providers.map((p) => (
            <GlassCard key={p.id} className="flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-white">{p.name}</span>
                  {p.isDefault && (
                    <span className="flex items-center gap-1 text-[10px] font-semibold text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded-full uppercase">
                      <CheckCircle2 size={10} /> Default
                    </span>
                  )}
                  <span className="text-[10px] text-slate-500 bg-white/5 px-2 py-0.5 rounded-full uppercase">
                    {PROVIDER_PRESETS[p.providerType]?.label ?? p.providerType}
                  </span>
                </div>
                <p className="text-sm text-slate-400 mt-0.5 truncate">{p.baseUrl}</p>
                <p className="text-xs text-slate-500 mt-0.5">Model: {p.modelName}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {!p.isDefault && (
                  <GlassButton variant="ghost" size="sm" onClick={() => setDefault(p.id)} icon={<Star size={13} />}>
                    Set Default
                  </GlassButton>
                )}
                <GlassButton variant="danger" size="sm" onClick={() => deleteProvider(p.id)} icon={<Trash2 size={13} />} />
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      <AddProviderModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onAdded={() => { setShowAdd(false); fetch(); }}
      />
    </div>
  );
}

function AddProviderModal({ open, onClose, onAdded }: {
  open: boolean; onClose: () => void; onAdded: () => void;
}) {
  const [type, setType] = useState<ProviderType>("OPENAI");
  const [name, setName] = useState("");
  const [baseUrl, setBaseUrl] = useState(PROVIDER_PRESETS.OPENAI.baseUrl);
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState(PROVIDER_PRESETS.OPENAI.model);
  const [isDefault, setIsDefault] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleTypeChange = (t: ProviderType) => {
    setType(t);
    const preset = PROVIDER_PRESETS[t];
    setBaseUrl(preset.baseUrl);
    setModel(preset.model);
    if (!name) setName(preset.label);
  };

  const handleSave = async () => {
    if (!name.trim() || !baseUrl.trim() || !model.trim()) {
      toast.error("Name, Base URL, and Model are required");
      return;
    }
    setSaving(true);
    try {
      await apiClient.post("/ai-providers", {
        name: name.trim(),
        providerType: type,
        baseUrl: baseUrl.trim(),
        apiKey: apiKey.trim() || undefined,
        modelName: model.trim(),
        isDefault,
      });
      toast.success("Provider added!");
      onAdded();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to add provider");
    } finally {
      setSaving(false);
    }
  };

  return (
    <GlassModal open={open} onClose={onClose} title="Add AI Provider" size="md">
      <div className="space-y-4">
        {/* Type selector */}
        <div>
          <p className="text-sm font-medium text-slate-300 mb-2">Provider Type</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {(Object.keys(PROVIDER_PRESETS) as ProviderType[]).map((t) => (
              <button
                key={t}
                onClick={() => handleTypeChange(t)}
                className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all
                  ${type === t
                    ? "border-indigo-500/60 bg-indigo-600/20 text-indigo-300"
                    : "border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:text-white"}`}
              >
                {PROVIDER_PRESETS[t].label}
              </button>
            ))}
          </div>
        </div>

        <GlassInput label="Display Name" placeholder="My OpenAI" value={name} onChange={(e) => setName(e.target.value)} />
        <GlassInput label="Base URL" placeholder="https://api.openai.com/v1" value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} />
        <GlassInput label="API Key (optional for local models)" type="password" placeholder="sk-..." value={apiKey} onChange={(e) => setApiKey(e.target.value)} />
        <GlassInput label="Model Name" placeholder="gpt-4o-mini" value={model} onChange={(e) => setModel(e.target.value)} />

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isDefault}
            onChange={(e) => setIsDefault(e.target.checked)}
            className="accent-indigo-500"
          />
          <span className="text-sm text-slate-300">Set as default provider</span>
        </label>

        <div className="flex gap-3 justify-end pt-2">
          <GlassButton variant="ghost" onClick={onClose}>Cancel</GlassButton>
          <GlassButton onClick={handleSave} loading={saving}>Add Provider</GlassButton>
        </div>
      </div>
    </GlassModal>
  );
}
