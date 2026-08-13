"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/browser";

interface ChatMessage {
  id: string;
  name: string;
  text: string;
  ts: number;
}

const NAME_STORAGE_KEY = "sorteapp-chat-name";
const CHANNEL_NAME = "vivo-chat";
const MIN_INTERVAL_MS = 3000;
const MAX_MESSAGE_LENGTH = 300;
const MAX_NAME_LENGTH = 40;
const MAX_MESSAGES_KEPT = 100;

/**
 * Live-draw side chat (v1, per this batch's own explicit scope: ephemeral,
 * no moderation). Supabase Realtime **Broadcast** — not a DB table — on
 * purpose: messages are never persisted anywhere, which sidesteps RLS
 * design and content-retention questions entirely for this first version.
 * The tradeoff, spelled out because it's a real one: nobody (not even an
 * admin) can delete a message after it's sent, and latecomers see no
 * history. Name is asked once and kept in `localStorage`, not auth —
 * matches `/vivo` being reachable without an account.
 */
export function LiveChat() {
  // Lazy initializer, not an effect: this component is loaded with
  // `next/dynamic({ ssr: false })` (see `/vivo/page.tsx`) specifically so
  // it never renders on the server, so there's no SSR value this needs to
  // match on first paint — safe to read `localStorage` synchronously here.
  const [name, setName] = useState<string | null>(() => {
    try {
      return localStorage.getItem(NAME_STORAGE_KEY);
    } catch {
      return null; // Private browsing / storage disabled — just asks every visit.
    }
  });
  const [nameDraft, setNameDraft] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const lastSentRef = useRef(0);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel(CHANNEL_NAME);

    channel
      .on("broadcast", { event: "message" }, ({ payload }) => {
        setMessages((current) => [...current, payload as ChatMessage].slice(-MAX_MESSAGES_KEPT));
      })
      .subscribe();

    channelRef.current = channel;
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    const list = listRef.current;
    if (list) {
      list.scrollTop = list.scrollHeight;
    }
  }, [messages]);

  function handleSetName(event: FormEvent) {
    event.preventDefault();
    const trimmed = nameDraft.trim().slice(0, MAX_NAME_LENGTH);
    if (!trimmed) return;

    setName(trimmed);
    try {
      localStorage.setItem(NAME_STORAGE_KEY, trimmed);
    } catch {
      // Private browsing / storage disabled — just asks every visit.
    }
  }

  function handleSend(event: FormEvent) {
    event.preventDefault();
    if (!name) return;

    const text = draft.trim().slice(0, MAX_MESSAGE_LENGTH);
    if (!text) return;

    const now = Date.now();
    if (now - lastSentRef.current < MIN_INTERVAL_MS) {
      setError("Esperá un segundo antes de mandar otro mensaje.");
      return;
    }
    lastSentRef.current = now;
    setError(null);

    const message: ChatMessage = { id: crypto.randomUUID(), name, text, ts: now };
    channelRef.current?.send({ type: "broadcast", event: "message", payload: message });
    setMessages((current) => [...current, message].slice(-MAX_MESSAGES_KEPT));
    setDraft("");
  }

  return (
    <div className="flex h-[32rem] flex-col rounded-2xl border border-white/15 bg-surface/40 lg:h-full">
      <p className="border-b border-white/15 px-4 py-3 text-sm font-semibold text-foreground">
        Chat en vivo
      </p>

      <div ref={listRef} className="flex-1 space-y-2 overflow-y-auto px-4 py-3">
        {messages.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Todavía no hay mensajes. ¡Sé el primero en saludar!
          </p>
        ) : (
          messages.map((message) => (
            <p key={message.id} className="text-sm text-foreground">
              <span className="font-semibold text-champagne">{message.name}: </span>
              {message.text}
            </p>
          ))
        )}
      </div>

      <div className="border-t border-white/15 p-3">
        {name ? (
          <form onSubmit={handleSend} className="flex gap-2">
            <input
              type="text"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Escribí un mensaje..."
              maxLength={MAX_MESSAGE_LENGTH}
              className="w-full rounded-lg border border-white/15 bg-ink px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-champagne focus:outline-none"
            />
            <button
              type="submit"
              className="shrink-0 rounded-lg bg-champagne px-4 py-2 text-sm font-semibold text-ink transition hover:opacity-90"
            >
              Enviar
            </button>
          </form>
        ) : (
          <form onSubmit={handleSetName} className="flex gap-2">
            <input
              type="text"
              value={nameDraft}
              onChange={(event) => setNameDraft(event.target.value)}
              placeholder="Tu nombre para el chat"
              maxLength={MAX_NAME_LENGTH}
              className="w-full rounded-lg border border-white/15 bg-ink px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-champagne focus:outline-none"
            />
            <button
              type="submit"
              className="shrink-0 rounded-lg bg-champagne px-4 py-2 text-sm font-semibold text-ink transition hover:opacity-90"
            >
              Entrar
            </button>
          </form>
        )}
        {error ? (
          <p role="alert" className="mt-1 text-xs text-red-400">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}
