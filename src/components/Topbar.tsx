import Link from "next/link";
import { SITE_NAME } from "@/lib/site";

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
        <nav className="flex items-center gap-1 text-[13px] text-ink-dim">
          <Link
            href="/#slik-virker-det"
            className="hidden rounded-(--radius-ctl) px-3 py-1.5 hover:bg-surface-2 hover:text-ink md:inline"
          >
            Slik virker det
          </Link>
          <Link
            href="/#priser"
            className="hidden rounded-(--radius-ctl) px-3 py-1.5 hover:bg-surface-2 hover:text-ink sm:inline"
          >
            Priser
          </Link>
          <Link
            href="/openness"
            className="rounded-(--radius-ctl) px-3 py-1.5 hover:bg-surface-2 hover:text-ink"
          >
            Åpenhet
          </Link>
          <Link
            href="/redeem"
            className="ml-1 rounded-(--radius-ctl) border border-line-strong px-3 py-1.5 text-ink hover:border-accent hover:text-accent-strong"
          >
            Løs inn kode
          </Link>
        </nav>
      </div>
    </header>
  );
}
