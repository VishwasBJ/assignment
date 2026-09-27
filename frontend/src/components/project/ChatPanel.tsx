"use client";

import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { apiClient } from "@/lib/api";
import type { ChatSession, Message, AIProvider } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { GlassCard } from "@/components/ui/GlassCard";
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

  const fetchSessions = async () => {
    try {
      const { data } = await apiClient.get(`/projects/${projectId}/chat/sessions`);
      setSessions(data);
    } catch { toast.error("Failed to load sessions"); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchSessions();
    apiClient.get("/ai-providers").then(({ data }) => { setProviders(data); if (data.length) setProviderId(""); });
  }, [projectId]);

  const openSession = async (session: ChatSession) => {
    setActiveSession(session);
    try {
      const { data } = await apiClient.get(`/projects/${projectId}/chat/sessions/${session.id}/messages`);
      setMessages(data);
    } catch { toast.error("Failed to load messages"); }
  };

  const createSession = async () => {
    try {
      const { data } = await apiClient.post(`/projects/${projectId}/chat/sessions`);
      setSessions((s) => [data, ...s]);
      setActiveSession(data);
      setMessages([]);
    } catch { toast.error("Failed to create session"); }
  };

  const deleteSession = async (id: string) => {
    try {
      await apiClient.delete(`/projects/${projectId}/chat/sessions/${id}`);
      setSessions((s) => s.filter((x) => x.id !== id));
      if (activeSession?.id === id) { setActiveSession(null); setMessages([]); }
      toast.success("Session deleted");
    } catch { toast.error("Failed to delete session"); }
  };

  const sendMessage = async () => {
    if (!input.trim() || !activeSession) return;
    const text = input.trim();
    setInput("");
    setSending(true);

    // Optimistic user message
    const tempMsg: Message = { id: "temp", role: "USER", content: text, createdAt: new Date().toISOString() };
    setMessages((m) => [...m, tempMsg]);

    try {
      const { data } = await apiClient.post(
        `/projects/${projectId}/chat/sessions/${activeSession.id}/messages`,
        { message: text, providerId: providerId || undefined }
      );
      setMessages((m) => [...m.filter((x) => x.id !== "temp"), { id: `user-${Date.now()}`, role: "USER", content: text, createdAt: new Date().toISOString() }, data]);
    } catch (err: any) {
      setMessages((m) => m.filter((x) => x.id !== "temp"));
      toast.error(err?.response?.data?.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[600px]">
      {/* Session list */}
      <GlassCard noPad className="lg:col-span-1 flex flex-col overflow-hidden">
        <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
          <span className="text-sm font-medium text-slate-300">Sessions</span>
          <button onClick={createSession} className="text-indigo-400 hover:text-indigo-300 transition-colors" aria-label="New session">
            <Plus size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto py-1">
          {loading ? (
            <div className="flex justify-center mt-8"><LoadingSpinner size={20} /></div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm px-4">
              <MessageSquare size={24} className="mx-auto mb-2 opacity-50" />
              No sessions yet
            </div>
          ) : (
            sessions.map((s) => (
              <div
                key={s.id}
                className={`group flex items-center gap-2 px-4 py-2.5 cursor-pointer transition-colors
                  ${activeSession?.id === s.id ? "bg-indigo-600/20" : "hover:bg-white/5"}`}
                onClick={() => openSession(s)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && openSession(s)}
              >
                <MessageSquare size={13} className="text-slate-500 shrink-0" />
                <span className={`text-sm truncate flex-1 ${activeSession?.id === s.id ? "text-indigo-300" : "text-slate-300"}`}>
                  {s.title || "New chat"}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteSession(s.id); }}
                  className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-all shrink-0"
                  aria-label="Delete session"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))
          )}
        </div>
      </GlassCard>

      {/* Chat window */}
      <GlassCard noPad className="lg:col-span-3 flex flex-col overflow-hidden">
        {!activeSession ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-8">
            <MessageSquare size={36} className="text-slate-600 mb-3" />
            <p className="text-white font-medium">Chat with your code</p>
            <p className="text-slate-400 text-sm mt-1 max-w-xs">
              Ask questions about your uploaded code. The AI will reference relevant files.
            </p>
            <GlassButton className="mt-5" onClick={createSession} icon={<Plus size={14} />}>
              Start Chat
            </GlassButton>
          </div>
        ) : (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && (
                <div className="text-center text-slate-500 text-sm py-8">
                  Ask a question about your code…
                </div>
              )}
              {messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))}
              {sending && (
                <div className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-indigo-600/20 flex items-center justify-center shrink-0">
                    <LoadingSpinner size={14} />
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>

            {/* Input */}
            <div className="border-t border-white/10 p-3 flex gap-2">
              {providers.length > 0 && (
                <select
                  className="glass rounded-lg px-3 py-2 text-xs text-slate-400 bg-transparent focus:outline-none focus:ring-1 focus:ring-indigo-500/60 shrink-0"
                  value={providerId}
                  onChange={(e) => setProviderId(e.target.value)}
                  aria-label="Select AI provider"
                >
                  <option value="" className="bg-slate-900">Default</option>
                  {providers.map((p) => (
                    <option key={p.id} value={p.id} className="bg-slate-900">{p.name}</option>
                  ))}
                </select>
              )}
              <textarea
                className="flex-1 glass rounded-xl px-3 py-2 text-sm text-white placeholder:text-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/60 transition-all"
                rows={2}
                placeholder="Ask about your code…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                disabled={sending}
              />
              <GlassButton
                onClick={sendMessage}
                loading={sending}
                disabled={!input.trim()}
                icon={<Send size={14} />}
                size="sm"
                className="self-end"
                aria-label="Send message"
              >
                <span className="hidden sm:inline">Send</span>
              </GlassButton>
            </div>
          </>
        )}
      </GlassCard>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "USER";
  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5
        ${isUser ? "bg-indigo-600 text-white" : "bg-purple-600/30 text-purple-300"}`}>
        {isUser ? "U" : "AI"}
      </div>
      <div className={`max-w-[80%] ${isUser ? "items-end" : "items-start"} flex flex-col gap-1`}>
        <div className={`glass rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap
          ${isUser ? "rounded-tr-sm text-white" : "rounded-tl-sm text-slate-300"}`}>
          {message.content}
        </div>
        <span className="text-[10px] text-slate-600 px-1">{formatDate(message.createdAt)}</span>
      </div>
    </div>
  );
}
