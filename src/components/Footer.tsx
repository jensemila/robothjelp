import Link from "next/link";
import { GITHUB_URL, SITE_TAGLINE } from "@/lib/site";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-10 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-mono text-[13px] text-ink-dim">{SITE_TAGLINE}</p>
        <nav className="flex gap-6 text-[13px] text-ink-faint">
          <Link href="/privacy" className="hover:text-ink">
            Personvern
          </Link>
          <Link href="/terms" className="hover:text-ink">
            Vilkår
          </Link>
          <Link href="/faq" className="hover:text-ink">
            Spørsmål og svar
          </Link>
          <a
            href={GITHUB_URL}
            rel="noopener noreferrer"
            target="_blank"
            className="hover:text-ink"
          >
            GitHub
          </a>
        </nav>
      </div>
    </footer>
  );
}
