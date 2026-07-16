"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { BALANCE_KEY, CODE_KEY, TIER_KEY, formatOre } from "@/lib/credit";
import { DRAFT_KEY } from "@/lib/draft";
import {
  MODEL_ORDER,
  MODEL_TIERS,
  type ModelTier,
  TOKEN_VALUE_ORE,
  isPaidTier,
  tokensFor,
} from "@/lib/models";
import { fetchAndSolvePow } from "@/lib/pow-client";
import {
  type PpToken,
  loadTokens,
  popTokens,
  returnTokens,
  tokenCount,
} from "@/lib/pp-client";
import { SITE_NAME } from "@/lib/site";

type ChatMessage = { role: "user" | "assistant"; content: string };

// All historikk ligger KUN i nettleseren (localStorage), aldri på serveren.
const HISTORY_KEY = "robothjelp:history";

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
  const [ppCount, setPpCount] = useState(0);

  // Har du noe å betale med? Da skal Opus være det åpenbare valget.
  const hasCredit = ppCount > 0 || (balance !== null && balance > 0);
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

      // Mynter tatt ut for dette svaret. Går kallet galt, legges de tilbake.
      let spentTokens: PpToken[] | null = null;

      try {
        const pow = await fetchAndSolvePow();
        // Betalt nivå: bruk Privacy Pass-mynter hvis vi har nok, ellers koden.
        let code: string | null = null;
        if (isPaidTier(activeTier)) {
          spentTokens = popTokens(tokensFor(activeTier));
          setPpCount(tokenCount());
          if (!spentTokens) {
            try {
              code = localStorage.getItem(CODE_KEY);
            } catch {
              code = null;
            }
          }
        }
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: outgoing,
            model: activeTier,
            ...(spentTokens
              ? { pp_tokens: spentTokens }
              : code
                ? { code }
                : {}),
            ...pow,
          }),
        });

        if (!response.ok || !response.body) {
          const data = await response.json().catch(() => null);
          // Serveren avviste før den brukte myntene: ta dem tilbake.
          if (spentTokens) {
            returnTokens(spentTokens);
            spentTokens = null;
            setPpCount(tokenCount());
          }
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
            let event: {
              type: string;
              text?: string;
              message?: string;
              saldo_ore?: number;
            };
            try {
              event = JSON.parse(line.slice(6));
            } catch {
              continue;
            }
            // Saldoen kan følge med både «done» og «error» (refusjon).
            if (typeof event.saldo_ore === "number") {
              setBalance(event.saldo_ore);
              try {
                localStorage.setItem(BALANCE_KEY, String(event.saldo_ore));
              } catch {
                // Ikke kritisk.
              }
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
        // Nettverket sviktet, så myntene ble aldri brukt. Ta dem tilbake.
        if (spentTokens) {
          returnTokens(spentTokens);
          setPpCount(tokenCount());
        }
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
    setPpCount(loadTokens().length);
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
              {MODEL_ORDER.map((key) => {
                const model = MODEL_TIERS[key];
                const active = tier === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => selectTier(key)}
                    aria-pressed={active}
                    title={`${model.description} ${
                      model.priceOre === 0
                        ? "Gratis."
                        : `${formatOre(model.priceOre)} per svar.`
                    }`}
                    className={`rounded-[7px] px-2.5 py-1 leading-tight transition ${
                      active
                        ? "bg-surface-2 text-ink"
                        : "text-ink-faint hover:text-ink-dim"
                    }`}
                  >
                    {model.label}
                    <span
                      className={`ml-1.5 hidden font-mono text-[10px] sm:inline ${
                        active ? "text-accent-strong" : "text-ink-faint"
                      }`}
                    >
                      {model.priceOre === 0
                        ? "gratis"
                        : formatOre(model.priceOre)}
                    </span>
                  </button>
                );
              })}
            </div>
            <span className="hidden font-mono text-[12px] text-ink-faint sm:inline">
              {ppCount > 0
                ? `${formatOre(ppCount * TOKEN_VALUE_ORE)} anonymt`
                : balance === null
                  ? "Ingen kreditt"
                  : `Saldo: ${formatOre(balance)}`}
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
          <div className="flex flex-1 flex-col items-center justify-center gap-4">
            <p className="max-w-sm text-center text-[14px] leading-relaxed text-ink-faint">
              Still et spørsmål. Samtalen lagres kun i din nettleser og kan
              slettes når som helst.
            </p>
            {hasCredit && tier === "haiku" && (
              <button
                type="button"
                onClick={() => selectTier("opus")}
                className="rounded-(--radius-ctl) border border-accent/40 px-4 py-2 text-[13px] text-accent-strong transition active:scale-[0.98] hover:bg-surface"
              >
                Du har kreditt. Bytt til Opus for merkbart bedre svar.
              </button>
            )}
            {isPaidTier(tier) && (
              <p className="font-mono text-[11px] text-ink-faint">
                {MODEL_TIERS[tier].label} koster{" "}
                {formatOre(MODEL_TIERS[tier].priceOre)} per svar
                {ppCount > 0 && ` (${tokensFor(tier)} mynter)`}
              </p>
            )}
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
