"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MODEL_TIERS } from "@/lib/models";

// Tips om betalte modeller etter en stund på Haiku. Vises én gang per
// nettleser: en påminnelse folk allerede har avvist er reklame, ikke hjelp.
// Nøkkelen ligger i localStorage, som alt annet her, og forsvinner når
// brukeren tømmer nettleserdataene.
const DISMISSED_KEY = "robothjelp:upgrade_hint_seen";
const DELAY_MS = 30_000;

export function UpgradeHint({
  active,
}: {
  /** Vis kun når brukeren faktisk er på gratisnivå uten kreditt. */
  active: boolean;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!active) return;
    try {
      if (localStorage.getItem(DISMISSED_KEY)) return;
    } catch {
      // Uten localStorage viser vi tipset denne økten.
    }
    const timer = setTimeout(() => setVisible(true), DELAY_MS);
    return () => clearTimeout(timer);
  }, [active]);

  function dismiss() {
    setVisible(false);
    try {
      localStorage.setItem(DISMISSED_KEY, "1");
    } catch {
      // Ikke kritisk.
    }
  }

  if (!visible) return null;

  return (
    <div
      role="status"
      className="pointer-events-auto fixed bottom-24 left-1/2 z-50 w-[calc(100%-2.5rem)] max-w-md -translate-x-1/2 rounded-card border border-line-strong bg-surface p-5 shadow-lg shadow-black/40"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[14px] font-medium">Du bruker gratismodellen</p>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Lukk"
          className="-mt-1 -mr-1 shrink-0 rounded-(--radius-ctl) px-2 py-1 text-[16px] leading-none text-ink-faint transition hover:bg-surface-2 hover:text-ink"
        >
          ×
        </button>
      </div>
      <p className="mt-2 text-[13px] leading-relaxed text-ink-dim">
        Haiku er rask og god til det meste. Trenger du mer, koster{" "}
        {MODEL_TIERS.sonnet.label} 1 kr per svar og {MODEL_TIERS.fable.label},
        den sterkeste modellen som finnes, 5 kr. Samme anonymitet uansett.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href="/buy"
          onClick={dismiss}
          className="rounded-(--radius-ctl) bg-accent px-4 py-2 text-[13px] font-medium text-accent-ink transition active:scale-[0.98] hover:bg-accent-strong"
        >
          Kjøp kreditt
        </Link>
        <Link
          href="/redeem"
          onClick={dismiss}
          className="rounded-(--radius-ctl) border border-line-strong px-4 py-2 text-[13px] transition hover:border-accent hover:text-accent-strong"
        >
          Jeg har en kode
        </Link>
      </div>
    </div>
  );
}
