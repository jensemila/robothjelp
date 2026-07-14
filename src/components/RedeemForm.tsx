"use client";

import Link from "next/link";
import { useState } from "react";
import { BALANCE_KEY, CODE_KEY, formatOre } from "@/lib/credit";

export function RedeemForm() {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saldoOre, setSaldoOre] = useState<number | null>(null);

  async function redeem() {
    const trimmed = code.trim();
    if (trimmed.length === 0 || busy) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: trimmed }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setError(data?.error ?? "Noe gikk galt. Prøv igjen.");
        return;
      }
      const ore = data?.saldo_ore;
      if (typeof ore !== "number") {
        setError("Noe gikk galt. Prøv igjen.");
        return;
      }
      setSaldoOre(ore);
      try {
        // Koden oppbevares kun i din nettleser, som et gavekort i lomma.
        localStorage.setItem(CODE_KEY, trimmed);
        localStorage.setItem(BALANCE_KEY, String(ore));
      } catch {
        // Uten localStorage fungerer koden fortsatt, men må limes inn på nytt.
      }
    } catch {
      setError("Fikk ikke kontakt med serveren. Prøv igjen.");
    } finally {
      setBusy(false);
    }
  }

  if (saldoOre !== null) {
    return (
      <div className="rounded-card border border-accent/40 bg-surface p-7">
        <p className="font-mono text-[12px] uppercase tracking-widest text-accent-strong">
          Koden er aktiv
        </p>
        <p className="mt-3 text-3xl font-semibold tracking-tight">
          {formatOre(saldoOre)}
        </p>
        <p className="mt-2 text-[14px] leading-relaxed text-ink-dim">
          Saldoen er klar til bruk med Opus-modellen. Koden er lagret i denne
          nettleseren. Ta vare på den et trygt sted, for eksempel i en
          passordhåndterer. Mister du den, kan vi ikke gjenopprette den.
        </p>
        <Link
          href="/chat"
          className="mt-6 inline-block rounded-(--radius-ctl) bg-accent px-4 py-2.5 text-[14px] font-medium text-accent-ink transition active:scale-[0.98] hover:bg-accent-strong"
        >
          Gå til chat
        </Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void redeem();
      }}
      className="rounded-card border border-line bg-surface p-7"
    >
      <label htmlFor="code" className="block text-[14px] font-medium">
        Kredittkode
      </label>
      <p className="mt-1 text-[13px] text-ink-faint">
        Formatet er SPFR-XXXX-XXXX-XXXX-XXXX
      </p>
      <input
        id="code"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="SPFR-"
        autoComplete="off"
        spellCheck={false}
        className="mt-3 w-full rounded-(--radius-ctl) border border-line-strong bg-bg px-3 py-2.5 font-mono text-[15px] tracking-wide placeholder:text-ink-faint focus:border-accent focus:outline-none"
      />
      {error && (
        <p className="mt-3 text-[13px] text-danger" role="alert">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={busy || code.trim().length === 0}
        className="mt-5 rounded-(--radius-ctl) bg-accent px-4 py-2.5 text-[14px] font-medium text-accent-ink transition active:scale-[0.98] hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy ? "Sjekker…" : "Aktiver kode"}
      </button>
    </form>
  );
}
