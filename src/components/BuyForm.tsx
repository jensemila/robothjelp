"use client";

import Link from "next/link";
import { useState } from "react";
import { formatOre } from "@/lib/credit";
import { DENOMINATIONS_ORE } from "@/lib/pricing";

type Method = "vipps" | "lightning";

export function BuyForm() {
  const [amountOre, setAmountOre] = useState<number>(DENOMINATIONS_ORE[0]);
  const [method, setMethod] = useState<Method>("vipps");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startPurchase() {
    if (busy || !consent) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/buy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount_ore: amountOre, method }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.redirectUrl) {
        setError(data?.error ?? "Noe gikk galt. Prøv igjen.");
        return;
      }
      window.location.href = data.redirectUrl;
    } catch {
      setError("Fikk ikke kontakt med serveren. Prøv igjen.");
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void startPurchase();
      }}
    >
      <p className="font-mono text-[12px] uppercase tracking-widest text-ink-faint">
        Velg valør
      </p>
      <div className="mt-3 grid grid-cols-3 gap-3" role="radiogroup" aria-label="Valør">
        {DENOMINATIONS_ORE.map((ore) => (
          <button
            key={ore}
            type="button"
            role="radio"
            aria-checked={amountOre === ore}
            onClick={() => setAmountOre(ore)}
            className={`rounded-card border p-5 text-center transition ${
              amountOre === ore
                ? "border-accent bg-surface text-ink"
                : "border-line bg-surface text-ink-dim hover:border-line-strong"
            }`}
          >
            <span className="text-xl font-semibold tracking-tight">
              {formatOre(ore)}
            </span>
          </button>
        ))}
      </div>

      <p className="mt-8 font-mono text-[12px] uppercase tracking-widest text-ink-faint">
        Velg betalingsmetode
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Betalingsmetode">
        <button
          type="button"
          role="radio"
          aria-checked={method === "vipps"}
          onClick={() => setMethod("vipps")}
          className={`rounded-card border p-5 text-left transition ${
            method === "vipps"
              ? "border-accent bg-surface"
              : "border-line bg-surface hover:border-line-strong"
          }`}
        >
          <span className="text-[15px] font-medium">Vipps</span>
          <p className="mt-1 text-[13px] leading-relaxed text-ink-dim">
            Raskt og kjent. Vipps ser at du kjøpte en kode, men aldri hva du
            spør om.
          </p>
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={method === "lightning"}
          onClick={() => setMethod("lightning")}
          className={`rounded-card border p-5 text-left transition ${
            method === "lightning"
              ? "border-accent bg-surface"
              : "border-line bg-surface hover:border-line-strong"
          }`}
        >
          <span className="text-[15px] font-medium">Lightning</span>
          <p className="mt-1 text-[13px] leading-relaxed text-ink-dim">
            Bitcoin over Lightning. Ingen vet at du er kunde hos oss i det
            hele tatt.
          </p>
        </button>
      </div>

      <p className="mt-6 text-[13px] leading-relaxed text-ink-faint">
        Koden vises én gang etter betaling og er som kontanter: mister du den,
        kan vi ikke gjenopprette den. Koblingen mellom betalingen og koden
        slettes i det koden hentes.
      </p>

      <label className="mt-5 flex items-start gap-3 text-[13px] leading-relaxed text-ink-dim">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 accent-(--color-accent)"
        />
        <span>
          Jeg samtykker til at koden leveres umiddelbart, og forstår at
          angreretten dermed går tapt, jf. angrerettloven § 22 bokstav n. Jeg
          godtar{" "}
          <Link href="/terms" className="text-ink underline underline-offset-4">
            salgsvilkårene
          </Link>
          .
        </span>
      </label>

      {error && (
        <p className="mt-4 text-[13px] text-danger" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy || !consent}
        className="mt-6 rounded-(--radius-ctl) bg-accent px-5 py-2.5 text-[14px] font-medium text-accent-ink transition active:scale-[0.98] hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy ? "Starter betaling…" : "Til betaling"}
      </button>
    </form>
  );
}
