"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { DRAFT_KEY } from "@/lib/draft";
import type { ModelTier } from "@/lib/models";
import { fetchAndSolvePow } from "@/lib/pow-client";
import { SITE_NAME } from "@/lib/site";

type ChatMessage = { role: "user" | "assistant"; content: string };

// All historikk ligger KUN i nettleseren (localStorage), aldri på serveren.
const HISTORY_KEY = "sporfri:history";
const TIER_KEY = "sporfri:model";
const BALANCE_KEY = "sporfri:saldo";

function loadHistory(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function ChatApp() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [tier, setTier] = useState<ModelTier>("haiku");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [ready, setReady] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const sentDraft = useRef(false);

  const send = useCallback(
    async (question: string, history: ChatMessage[], activeTier: ModelTier) => {
      const userMessage: ChatMessage = { role: "user", content: question };
      const outgoing = [...history, userMessage];
      setMessages([...outgoing, { role: "assistant", content: "" }]);
      setBusy(true);
      setError(null);

      let assistantText = "";
      const commit = () => {
        setMessages([
          ...outgoing,
          { role: "assistant", content: assistantText },
        ]);
      };

      try {
        const pow = await fetchAndSolvePow();
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: outgoing, model: activeTier, ...pow }),
        });

        if (!response.ok || !response.body) {
          const data = await response.json().catch(() => null);
          setMessages(outgoing);
          setError(data?.error ?? "Noe gikk galt. Prøv igjen.");
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            let event: { type: string; text?: string; message?: string };
            try {
              event = JSON.parse(line.slice(6));
            } catch {
              continue;
            }
            if (event.type === "text" && event.text) {
              assistantText += event.text;
              commit();
            } else if (event.type === "error") {
              setError(event.message ?? "Noe gikk galt. Prøv igjen.");
            }
          }
        }
        if (assistantText.length === 0) {
          setMessages(outgoing);
        } else {
          commit();
          try {
            localStorage.setItem(
              HISTORY_KEY,
              JSON.stringify([
                ...outgoing,
                { role: "assistant", content: assistantText },
              ]),
            );
          } catch {
            // Full localStorage skal ikke stoppe samtalen.
          }
        }
      } catch {
        setMessages(outgoing);
        setError("Fikk ikke kontakt med serveren. Prøv igjen.");
      } finally {
        setBusy(false);
      }
    },
    [],
  );

  // localStorage finnes ikke ved SSR, så historikken må lastes i en effekt
  // etter hydrering. Lazy useState-init ville gitt hydration-mismatch.
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- hydrering fra localStorage */
    const history = loadHistory();
    setMessages(history);
    const storedTier = localStorage.getItem(TIER_KEY);
    const activeTier: ModelTier = storedTier === "opus" ? "opus" : "haiku";
    setTier(activeTier);
    const storedBalance = localStorage.getItem(BALANCE_KEY);
    if (storedBalance !== null && !Number.isNaN(Number(storedBalance))) {
      setBalance(Number(storedBalance));
    }
    setReady(true);
    /* eslint-enable react-hooks/set-state-in-effect */

    // Utkast fra forsiden sendes automatisk (én gang).
    if (!sentDraft.current) {
      sentDraft.current = true;
      let draft: string | null = null;
      try {
        draft = sessionStorage.getItem(DRAFT_KEY);
        sessionStorage.removeItem(DRAFT_KEY);
      } catch {
        draft = null;
      }
      if (draft && draft.trim().length > 0) {
        void send(draft.trim(), history, activeTier);
      }
    }
  }, [send]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSubmit() {
    const question = input.trim();
    if (question.length === 0 || busy) return;
    setInput("");
    void send(question, messages, tier);
  }

  function selectTier(next: ModelTier) {
    setTier(next);
    try {
      localStorage.setItem(TIER_KEY, next);
    } catch {
      // Ikke kritisk.
    }
  }

  function clearHistory() {
    setMessages([]);
    setError(null);
    try {
      localStorage.removeItem(HISTORY_KEY);
    } catch {
      // Ikke kritisk.
    }
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 border-b border-line bg-bg/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between gap-3 px-5">
          <Link href="/" className="text-[15px] font-semibold tracking-tight">
            {SITE_NAME}
          </Link>
          <div className="flex items-center gap-2">
            <div
              role="group"
              aria-label="Modellvalg"
              className="flex rounded-(--radius-ctl) border border-line p-0.5 text-[13px]"
            >
              <button
                type="button"
                onClick={() => selectTier("haiku")}
                className={`rounded-[7px] px-3 py-1 transition ${
                  tier === "haiku"
                    ? "bg-surface-2 text-ink"
                    : "text-ink-faint hover:text-ink-dim"
                }`}
              >
                Haiku
              </button>
              <button
                type="button"
                onClick={() => selectTier("opus")}
                className={`rounded-[7px] px-3 py-1 transition ${
                  tier === "opus"
                    ? "bg-surface-2 text-ink"
                    : "text-ink-faint hover:text-ink-dim"
                }`}
              >
                Opus
              </button>
            </div>
            <span className="hidden font-mono text-[12px] text-ink-faint sm:inline">
              {balance === null ? "Ingen kreditt" : `Saldo: ${balance} kr`}
            </span>
            <Link
              href="/redeem"
              className="rounded-(--radius-ctl) border border-line-strong px-3 py-1.5 text-[13px] hover:border-accent hover:text-accent-strong"
            >
              Løs inn kode
            </Link>
            <button
              type="button"
              onClick={clearHistory}
              className="rounded-(--radius-ctl) px-3 py-1.5 text-[13px] text-ink-faint hover:bg-surface-2 hover:text-danger"
            >
              Slett historikk
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-5">
        {ready && messages.length === 0 ? (
          <div className="flex flex-1 items-center justify-center">
            <p className="max-w-sm text-center text-[14px] leading-relaxed text-ink-faint">
              Still et spørsmål. Samtalen lagres kun i din nettleser og kan
              slettes når som helst.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-5 py-8">
            {messages.map((message, index) => (
              <div
                key={index}
                className={
                  message.role === "user"
                    ? "self-end rounded-card bg-surface-2 px-4 py-3 text-[15px] leading-relaxed max-w-[85%] whitespace-pre-wrap"
                    : "text-[15px] leading-relaxed whitespace-pre-wrap"
                }
              >
                {message.content ||
                  (busy && index === messages.length - 1 ? "…" : "")}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        )}
        {error && (
          <p className="pb-3 text-[13px] text-danger" role="alert">
            {error}
          </p>
        )}
      </main>

      <div className="sticky bottom-0 border-t border-line bg-bg">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          className="mx-auto flex max-w-3xl items-end gap-2 px-5 py-4"
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            rows={1}
            placeholder="Skriv spørsmålet ditt her"
            aria-label="Spørsmål"
            className="max-h-40 min-h-11 w-full resize-none rounded-(--radius-ctl) border border-line-strong bg-surface px-3 py-2.5 text-[15px] leading-relaxed placeholder:text-ink-faint focus:border-accent focus:outline-none"
          />
          <button
            type="submit"
            disabled={busy || input.trim().length === 0}
            className="shrink-0 rounded-(--radius-ctl) bg-accent px-4 py-2.5 text-[14px] font-medium text-accent-ink transition active:scale-[0.98] hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-50"
          >
            Spør
          </button>
        </form>
      </div>
    </div>
  );
}
