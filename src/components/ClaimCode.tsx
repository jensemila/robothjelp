"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

// Henter kredittkoden etter betaling. Serveren sletter koblingen
// betaling→kode i det koden hentes, så den vises kun én gang.

const POLL_INTERVAL_MS = 3000;
const MAX_POLLS = 200; // ~10 minutter

export function ClaimCode() {
  const params = useSearchParams();
  const reference = params.get("ref");
  const method = params.get("m");
  const [code, setCode] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const started = useRef(false);

  // Avledet av URL-parametrene; trenger ikke state.
  const validLink =
    typeof reference === "string" &&
    /^[0-9a-f]{32}$/.test(reference) &&
    (method === "vipps" || method === "lightning");

  const error = validLink
    ? apiError
    : "Ugyldig lenke. Gå tilbake til kjøpssiden.";

  useEffect(() => {
    if (started.current || !validLink) return;
    started.current = true;

    let polls = 0;
    let cancelled = false;

    async function poll() {
      if (cancelled) return;
      polls += 1;
      try {
        const response = await fetch("/api/buy/claim", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reference, method }),
        });
        const data = await response.json().catch(() => null);
        if (cancelled) return;
        if (response.ok && typeof data?.code === "string") {
          setCode(data.code);
          return;
        }
        if (response.ok && data?.pending) {
          if (polls < MAX_POLLS) {
            setTimeout(poll, POLL_INTERVAL_MS);
          } else {
            setApiError(
              "Betalingen er ikke bekreftet ennå. Behold betalingskvitteringen og kontakt oss hvis koden ikke dukker opp.",
            );
          }
          return;
        }
        setApiError(data?.error ?? "Noe gikk galt. Prøv å laste siden på nytt.");
      } catch {
        if (!cancelled && polls < MAX_POLLS) {
          setTimeout(poll, POLL_INTERVAL_MS);
        }
      }
    }

    void poll();
    return () => {
      cancelled = true;
    };
  }, [reference, method, validLink]);

  if (error) {
    return (
      <div className="rounded-card border border-line bg-surface p-7">
        <p className="text-[15px] leading-relaxed text-danger">{error}</p>
        <Link
          href="/buy"
          className="mt-5 inline-block rounded-(--radius-ctl) border border-line-strong px-4 py-2.5 text-[14px] hover:border-accent hover:text-accent-strong"
        >
          Tilbake til kjøp
        </Link>
      </div>
    );
  }

  if (!code) {
    return (
      <div className="rounded-card border border-line bg-surface p-7">
        <p className="font-mono text-[12px] uppercase tracking-widest text-ink-faint">
          Venter på bekreftelse
        </p>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-dim">
          Vi venter på at betalingen bekreftes. Dette tar vanligvis noen
          sekunder. Ikke lukk siden.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-card border border-accent/40 bg-surface p-7">
      <p className="font-mono text-[12px] uppercase tracking-widest text-accent-strong">
        Kredittkoden din
      </p>
      <p className="mt-4 break-all rounded-(--radius-ctl) border border-line bg-bg px-4 py-3 font-mono text-lg tracking-wide">
        {code}
      </p>
      <p className="mt-4 text-[14px] leading-relaxed text-ink-dim">
        Koden vises kun nå. Lagre den et trygt sted, for eksempel i en
        passordhåndterer. Vi kan ikke gjenopprette den, for vi vet ikke at
        den er din. Koblingen til betalingen er allerede slettet.
      </p>
      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={() => {
            void navigator.clipboard
              .writeText(code)
              .then(() => setCopied(true))
              .catch(() => setCopied(false));
          }}
          className="rounded-(--radius-ctl) border border-line-strong px-4 py-2.5 text-[14px] transition active:scale-[0.98] hover:border-accent hover:text-accent-strong"
        >
          {copied ? "Kopiert" : "Kopier koden"}
        </button>
        <Link
          href="/redeem"
          className="rounded-(--radius-ctl) bg-accent px-4 py-2.5 text-[14px] font-medium text-accent-ink transition active:scale-[0.98] hover:bg-accent-strong"
        >
          Løs inn koden
        </Link>
      </div>
    </div>
  );
}
