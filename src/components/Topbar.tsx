import Link from "next/link";
import { SITE_NAME } from "@/lib/site";

const NAV_LINKS = [
  { href: "/#slik-virker-det", label: "Slik virker det" },
  { href: "/#priser", label: "Priser" },
  { href: "/openness", label: "Åpenhet" },
  { href: "/faq", label: "Spørsmål og svar" },
];

export function Topbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="text-[15px] font-semibold tracking-tight">
            {SITE_NAME}
          </span>
          <span className="hidden font-mono text-[11px] text-ink-faint sm:inline">
            anonyme KI-søk
          </span>
        </Link>

        {/* Desktop: lenkene ligger utover. */}
        <nav className="hidden items-center gap-1 text-[13px] text-ink-dim sm:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-(--radius-ctl) px-3 py-1.5 hover:bg-surface-2 hover:text-ink"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/redeem"
            className="ml-1 rounded-(--radius-ctl) border border-line-strong px-3 py-1.5 text-ink hover:border-accent hover:text-accent-strong"
          >
            Løs inn kode
          </Link>
        </nav>

        {/* Mobil: alt bak en meny, så Priser/FAQ er nåbare. */}
        <details className="group relative sm:hidden">
          <summary className="flex cursor-pointer list-none items-center gap-2 rounded-(--radius-ctl) border border-line-strong px-3 py-1.5 text-[13px] text-ink [&::-webkit-details-marker]:hidden">
            Meny
            <span
              aria-hidden
              className="text-ink-faint transition-transform group-open:rotate-45"
            >
              +
            </span>
          </summary>
          <nav className="absolute right-0 mt-2 flex w-56 flex-col rounded-card border border-line bg-surface p-1.5 text-[14px] shadow-lg shadow-black/40">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-(--radius-ctl) px-3 py-2 text-ink-dim hover:bg-surface-2 hover:text-ink"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/redeem"
              className="mt-1 rounded-(--radius-ctl) border border-line-strong px-3 py-2 text-ink hover:border-accent hover:text-accent-strong"
            >
              Løs inn kode
            </Link>
          </nav>
        </details>
      </div>
    </header>
  );
}
