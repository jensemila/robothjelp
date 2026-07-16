"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BALANCE_KEY, CODE_KEY, TIER_KEY, formatOre } from "@/lib/credit";
import { TOKEN_VALUE_ORE } from "@/lib/models";
import { exchangeCodeForTokens, ppEnabled } from "@/lib/pp-client";

const MAX_TOKENS_PER_EXCHANGE = 200;

export function RedeemForm() {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saldoOre, setSaldoOre] = useState<number | null>(null);
  const [ppAvailable, setPpAvailable] = useState(false);
  const [ppBusy, setPpBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [ppError, setPpError] = useState<string | null>(null);
  const [ppTotal, setPpTotal] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    void ppEnabled().then((enabled) => {
      if (!cancelled) setPpAvailable(enabled);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function exchangeAll() {
    if (ppBusy || saldoOre === null) return;
    const count = Math.min(
      Math.floor(saldoOre / TOKEN_VALUE_ORE),
      MAX_TOKENS_PER_EXCHANGE,
    );
    if (count === 0) {
      setPpError("Saldoen er for lav til å veksle inn tokens.");
      return;
    }
    setPpBusy(true);
    setPpError(null);
    try {
      const total = await exchangeCodeForTokens(code.trim(), count);
      const newBalance = saldoOre - count * TOKEN_VALUE_ORE;
      setPpTotal(total);
      setSaldoOre(newBalance);
      try {
        localStorage.setItem(BALANCE_KEY, String(newBalance));
      } catch {
        // Ikke kritisk.
      }
    } catch (err) {
      setPpError(
        err instanceof Error ? err.message : "Noe gikk galt. Prøv igjen.",
      );
    } finally {
      setPpBusy(false);
    }
  }

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
        // Du har nettopp betalt for det beste nivået, så chatten skal starte
        // der, ikke på gratismodellen.
        localStorage.setItem(TIER_KEY, "opus");
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
    const exchanged = ppTotal !== null;
    return (
      <div className="rounded-card border border-accent/40 bg-surface p-7">
        <p className="font-mono text-[12px] uppercase tracking-widest text-accent-strong">
          {exchanged ? "Vekslet inn" : "Koden er aktiv"}
        </p>
        <p className="mt-3 text-3xl font-semibold tracking-tight">
          {exchanged
            ? `${formatOre((ppTotal ?? 0) * TOKEN_VALUE_ORE)} anonymt`
            : formatOre(saldoOre)}
        </p>
        {exchanged ? (
          <div className="mt-2 space-y-2 text-[14px] leading-relaxed text-ink-dim">
            <p>
              Saldoen er flyttet ut av koden og inn i denne nettleseren, som{" "}
              {ppTotal} anonyme mynter à én krone. Koden er derfor tom nå, og
              du trenger den ikke lenger. Du får ingen nye koder: mynter er
              ikke noe du kan skrive inn et sted, de brukes automatisk når du
              spør. Et svar koster like mange mynter som modellen koster
              kroner.
            </p>
            <p className="text-ink">
              Verdien finnes nå kun i denne nettleseren. Sletter du
              nettleserdataene for siden, eller bytter til en annen nettleser
              eller enhet, er de {formatOre((ppTotal ?? 0) * TOKEN_VALUE_ORE)}{" "}
              borte. Vi kan ikke gjenopprette dem, for vi vet ikke at de var
              dine.
            </p>
          </div>
        ) : (
          <p className="mt-2 text-[14px] leading-relaxed text-ink-dim">
            Saldoen er klar til bruk. Velg selv hvilken modell du vil bruke i
            chatten: jo bedre modell, jo raskere går kreditten. Koden er lagret
            i denne nettleseren. Ta vare på den et trygt sted, for eksempel i
            en passordhåndterer. Mister du den, kan vi ikke gjenopprette den.
          </p>
        )}

        {ppAvailable && !exchanged && saldoOre >= TOKEN_VALUE_ORE && (
          <div className="mt-6 rounded-(--radius-ctl) border border-line bg-bg p-4">
            <p className="text-[14px] font-medium">
              Privacy Pass: fjern siste kobling
            </p>
            <p className="mt-1 text-[13px] leading-relaxed text-ink-dim">
              Du kan veksle saldoen inn i anonyme engangstokens. Da kan ikke
              engang serveren se hvilke betalte søk som hører sammen. Dette er
              helt frivillig: koden fungerer utmerket som den er.
            </p>

            {ppError && (
              <p className="mt-2 text-[13px] text-danger" role="alert">
                {ppError}
              </p>
            )}

            {!confirming ? (
              <button
                type="button"
                onClick={() => {
                  setConfirming(true);
                  setPpError(null);
                }}
                className="mt-3 rounded-(--radius-ctl) border border-line-strong px-4 py-2 text-[13px] transition active:scale-[0.98] hover:border-accent hover:text-accent-strong"
              >
                Les mer om innveksling
              </button>
            ) : (
              <div className="mt-4 border-t border-line pt-4">
                <p className="text-[13px] font-medium text-ink">
                  Les dette før du velger. Innvekslingen kan ikke angres.
                </p>
                <dl className="mt-3 space-y-3 text-[13px] leading-relaxed">
                  <div>
                    <dt className="text-accent-strong">Dette vinner du</dt>
                    <dd className="text-ink-dim">
                      Serveren kan i dag se at de betalte søkene dine hører til
                      samme kode. Etter innveksling kan den ikke det, fordi den
                      signerer tokens uten å se dem.
                    </dd>
                  </div>
                  <div>
                    <dt className="text-danger">Dette gir du fra deg</dt>
                    <dd className="text-ink-dim">
                      Saldoen slutter å være flyttbar. Koden kan du bruke fra
                      hvilken som helst enhet. Tokens finnes kun i denne
                      nettleseren. Sletter du nettleserdataene for siden, bytter
                      nettleser, eller bytter enhet, er{" "}
                      {formatOre(
                        Math.min(
                          Math.floor(saldoOre / TOKEN_VALUE_ORE),
                          MAX_TOKENS_PER_EXCHANGE,
                        ) * TOKEN_VALUE_ORE,
                      )}{" "}
                      borte for godt. Vi kan ikke gjenopprette dem, for vi vet
                      ikke at de var dine.
                    </dd>
                  </div>
                </dl>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void exchangeAll()}
                    disabled={ppBusy}
                    className="rounded-(--radius-ctl) bg-accent px-4 py-2 text-[13px] font-medium text-accent-ink transition active:scale-[0.98] hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {ppBusy
                      ? "Veksler…"
                      : `Jeg forstår, veksle inn ${formatOre(
                          Math.min(
                            Math.floor(saldoOre / TOKEN_VALUE_ORE),
                            MAX_TOKENS_PER_EXCHANGE,
                          ) * TOKEN_VALUE_ORE,
                        )}`}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirming(false)}
                    disabled={ppBusy}
                    className="rounded-(--radius-ctl) border border-line-strong px-4 py-2 text-[13px] text-ink-dim transition hover:text-ink disabled:opacity-50"
                  >
                    Behold koden som den er
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

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
        Formatet er ROBO-XXXX-XXXX-XXXX-XXXX
      </p>
      <input
        id="code"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="ROBO-"
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
