"use client";

import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { apiClient } from "@/lib/api";
import type { ChatSession, Message, AIProvider } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { GlassButton } from "@/components/ui/GlassButton";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Send, Plus, MessageSquare, Trash2 } from "lucide-react";

interface Props { projectId: string }

export function ChatPanel({ projectId }: Props) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [providerId, setProviderId] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    apiClient.get(`/projects/${projectId}/chat/sessions`)
      .then(({ data }) => setSessions(data))
      .catch(() => toast.error("Failed to load sessions"))
      .finally(() => setLoading(false));
    apiClient.get("/ai-providers").then(({ data }) => setProviders(data)).catch(() => {});
  }, [projectId]);

  const openSession = async (s: ChatSession) => {
    setActiveSession(s);
    try { const { data } = await apiClient.get(`/projects/${projectId}/chat/sessions/${s.id}/messages`); setMessages(data); }
    catch { toast.error("Failed to load messages"); }
  };

  const createSession = async () => {
    try {
      const { data } = await apiClient.post(`/projects/${projectId}/chat/sessions`);
      setSessions(s => [data, ...s]); setActiveSession(data); setMessages([]);
    } catch { toast.error("Failed to create session"); }
  };

  const deleteSession = async (id: string) => {
    try {
      await apiClient.delete(`/projects/${projectId}/chat/sessions/${id}`);
      setSessions(s => s.filter(x => x.id !== id));
      if (activeSession?.id === id) { setActiveSession(null); setMessages([]); }
      toast.success("Session deleted");
    } catch { toast.error("Failed to delete"); }
  };

  const sendMessage = async () => {
    if (!input.trim() || !activeSession) return;
    const text = input.trim(); setInput(""); setSending(true);
    const tempId = `temp-${Date.now()}`;
    setMessages(m => [...m, { id: tempId, role: "USER", content: text, createdAt: new Date().toISOString() }]);
    try {
      const { data } = await apiClient.post(
        `/projects/${projectId}/chat/sessions/${activeSession.id}/messages`,
        { message: text, providerId: providerId || undefined }
      );
      setMessages(m => [...m.filter(x => x.id !== tempId),
        { id: `u-${Date.now()}`, role: "USER", content: text, createdAt: new Date().toISOString() },
        data]);
    } catch (err: any) {
      setMessages(m => m.filter(x => x.id !== tempId));
      toast.error(err?.response?.data?.message || "Failed to send message");
    } finally { setSending(false); }
  };

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: "1rem", height: 580 }}>
      {/* Sessions sidebar */}
      <div className="card" style={{ padding: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "0.75rem 1rem", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#64748b" }}>Sessions</span>
          <button onClick={createSession} style={{ background: "none", border: "none", cursor: "pointer", color: "#818cf8", padding: "0.125rem", display: "flex" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#a5b4fc")}
            onMouseLeave={e => (e.currentTarget.style.color = "#818cf8")}
            aria-label="New session"><Plus size={15} /></button>
        </div>
        <div style={{ flex: 1, overflowY: "auto" }}>
          {loading ? <div style={{ display: "flex", justifyContent: "center", padding: "2rem" }}><LoadingSpinner size={20} /></div>
            : sessions.length === 0 ? (
              <div style={{ padding: "2rem 1rem", textAlign: "center", color: "#334155", fontSize: "0.8125rem" }}>
                <MessageSquare size={22} style={{ margin: "0 auto 0.5rem", opacity: 0.4 }} />
                No sessions yet
              </div>
            ) : sessions.map(s => (
              <div key={s.id}
                style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.625rem 0.75rem", cursor: "pointer", borderLeft: `3px solid ${activeSession?.id === s.id ? "#6366f1" : "transparent"}`, background: activeSession?.id === s.id ? "rgba(99,102,241,0.1)" : "transparent", transition: "background 0.15s" }}
                onClick={() => openSession(s)}
                onMouseEnter={e => { if (activeSession?.id !== s.id) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)"; }}
                onMouseLeave={e => { if (activeSession?.id !== s.id) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
              >
                <MessageSquare size={12} style={{ color: "#475569", flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: "0.8125rem", color: activeSession?.id === s.id ? "#a5b4fc" : "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {s.title || "New chat"}
                </span>
                <button onClick={e => { e.stopPropagation(); deleteSession(s.id); }}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "transparent", padding: "0.125rem", display: "flex", flexShrink: 0 }}
                  onMouseEnter={e => (e.currentTarget.style.color = "#f87171")}
                  onMouseLeave={e => (e.currentTarget.style.color = "transparent")}
                  aria-label="Delete"><Trash2 size={11} /></button>
              </div>
            ))}
        </div>
      </div>

      {/* Chat window */}
      <div className="card" style={{ padding: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {!activeSession ? (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "2rem" }}>
            <MessageSquare size={36} style={{ color: "#1e293b", marginBottom: "0.75rem" }} />
            <p style={{ fontWeight: 600, color: "#f1f5f9", marginBottom: "0.375rem" }}>Chat with your code</p>
            <p style={{ color: "#475569", fontSize: "0.875rem", maxWidth: "22rem", lineHeight: 1.6 }}>
              Ask questions about your uploaded code. The AI references relevant files automatically.
            </p>
            <div style={{ marginTop: "1.25rem" }}>
              <GlassButton onClick={createSession} icon={<Plus size={14} />}>Start Chat</GlassButton>
            </div>
          </div>
        ) : (
          <>
            {/* Messages */}
            <div style={{ flex: 1, overflowY: "auto", padding: "1rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
              {messages.length === 0 && (
                <div style={{ textAlign: "center", color: "#334155", fontSize: "0.875rem", paddingTop: "3rem" }}>
                  Ask a question about your code…
                </div>
              )}
              {messages.map(msg => <MessageBubble key={msg.id} message={msg} />)}
              {sending && (
                <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(99,102,241,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <LoadingSpinner size={14} />
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>

            {/* Input */}
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", padding: "0.75rem", display: "flex", gap: "0.5rem", alignItems: "flex-end" }}>
              {providers.length > 0 && (
                <select className="input" value={providerId} onChange={e => setProviderId(e.target.value)}
                  style={{ width: "auto", fontSize: "0.75rem", padding: "0.4rem 0.6rem", background: "rgba(15,15,46,0.9)", flexShrink: 0 }}
                  aria-label="Select AI provider">
                  <option value="">Default</option>
                  {providers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              )}
              <textarea className="input" rows={2} placeholder="Ask about your code… (Enter to send, Shift+Enter for newline)"
                value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                disabled={sending}
                style={{ flex: 1, resize: "none", padding: "0.6rem 0.875rem" }} />
              <GlassButton onClick={sendMessage} loading={sending} disabled={!input.trim()} icon={<Send size={14} />}
                style={{ flexShrink: 0, alignSelf: "flex-end" }} aria-label="Send">
                Send
              </GlassButton>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "USER";
  return (
    <div style={{ display: "flex", gap: "0.75rem", flexDirection: isUser ? "row-reverse" : "row", alignItems: "flex-start" }}>
      <div style={{ width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem", fontWeight: 700, flexShrink: 0,
        background: isUser ? "#6366f1" : "rgba(139,92,246,0.2)", color: isUser ? "#fff" : "#c084fc" }}>
        {isUser ? "U" : "AI"}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", maxWidth: "78%", alignItems: isUser ? "flex-end" : "flex-start" }}>
        <div className={isUser ? "bubble-user" : "bubble-ai"}>{message.content}</div>
        <span style={{ fontSize: "0.7rem", color: "#334155", paddingInline: "0.25rem" }}>{formatDate(message.createdAt)}</span>
      </div>
    </div>
  );
}
