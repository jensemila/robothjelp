"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BALANCE_KEY,
  TIER_KEY,
  formatOre,
} from "@/lib/credit";
import { DRAFT_KEY } from "@/lib/draft";
import {
  MODEL_ORDER,
  MODEL_TIERS,
  type ModelTier,
  TOKEN_VALUE_ORE,
  isModelTier,
} from "@/lib/models";
import { tokenCount } from "@/lib/pp-client";

export function HeroChatInput() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [ready, setReady] = useState(false);
  const [tier, setTier] = useState<ModelTier>("haiku");
  const [balance, setBalance] = useState<number | null>(null);
  const [ppCount, setPpCount] = useState(0);

  // Etter hydrering: les inn hva den tilbakevendende brukeren har fra før.
  // localStorage finnes ikke ved SSR, så dette må skje i en effekt.
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- hydrering fra localStorage */
    const storedTier = localStorage.getItem(TIER_KEY);
    if (isModelTier(storedTier)) setTier(storedTier);
    const storedBalance = localStorage.getItem(BALANCE_KEY);
    if (storedBalance !== null && !Number.isNaN(Number(storedBalance))) {
      setBalance(Number(storedBalance));
    }
    setPpCount(tokenCount());
    setReady(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const hasCredit = ppCount > 0 || (balance !== null && balance > 0);

  function selectTier(next: ModelTier) {
    setTier(next);
    try {
      localStorage.setItem(TIER_KEY, next);
    } catch {
      // Ikke kritisk; /chat faller tilbake til Haiku.
    }
  }

  function submit() {
    const question = value.trim();
    if (question.length > 0) {
      try {
        sessionStorage.setItem(DRAFT_KEY, question);
      } catch {
        // Uten sessionStorage går brukeren bare til tom chat.
      }
    }
    router.push("/chat");
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="mx-auto w-full max-w-2xl"
    >
      <div className="flex items-end gap-2 rounded-card border border-line-strong bg-surface p-2 focus-within:border-accent">
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          rows={2}
          placeholder="Skriv spørsmålet ditt her"
          aria-label="Spørsmål"
          className="max-h-40 min-h-14 w-full resize-none bg-transparent px-3 py-2 text-[15px] leading-relaxed placeholder:text-ink-faint focus:outline-none"
        />
        <button
          type="submit"
          className="shrink-0 rounded-(--radius-ctl) bg-accent px-4 py-2.5 text-[14px] font-medium text-accent-ink transition active:scale-[0.98] hover:bg-accent-strong"
        >
          Spør
        </button>
      </div>

      {ready && hasCredit ? (
        // Tilbakevendende bruker med kreditt: vis modellvelger og saldo, så du
        // kan fortsette der du slapp uten å gå veien om chat-siden.
        <div className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
          <div className="flex rounded-(--radius-ctl) border border-line p-0.5 text-[12px]">
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
                  className={`rounded-[7px] px-2.5 py-1 transition ${
                    active
                      ? "bg-surface-2 text-ink"
                      : "text-ink-faint hover:text-ink-dim"
                  }`}
                >
                  {model.label}
                </button>
              );
            })}
          </div>
          <span className="font-mono text-[12px] text-accent-strong">
            {ppCount > 0
              ? `${formatOre(ppCount * TOKEN_VALUE_ORE)} igjen`
              : `${formatOre(balance ?? 0)} igjen`}
          </span>
        </div>
      ) : (
        <p className="mt-3 text-center font-mono text-[12px] text-ink-faint">
          Gratis med Haiku-modellen, helt uten registrering
        </p>
      )}
    </form>
  );
}
