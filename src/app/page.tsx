import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/Footer";
import { FaqAccordion } from "@/components/FaqAccordion";
import { HeroChatInput } from "@/components/HeroChatInput";
import { Topbar } from "@/components/Topbar";
import { QA } from "@/lib/faq";
import { JsonLd, serviceLd } from "@/lib/seo";
import { GITHUB_URL, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  description:
    "Bruk KI helt anonymt. Ingen konto, ingen lagring av samtaler, ingen IP-logging. Still spørsmål gratis med Haiku, eller betal per svar for Sonnet, Opus og Fable. Betaling med Vipps eller bitcoin, frikoblet fra bruk.",
  alternates: { canonical: SITE_URL },
};

const TRUST_POINTS = [
  {
    label: "Samtalene lagres aldri",
    body: "Vi skriver aldri ned det du spør om, og IP-adressen din logges aldri. Historikken finnes kun i din nettleser, og slettes med ett klikk.",
  },
  {
    label: "Ingen konto",
    body: "Ingen e-post, ingen telefon, ingen innlogging. Det finnes ikke noe kunderegister som kan kobles til det du spør om.",
  },
  {
    label: "Åpen kildekode",
    body: "Hele tjenesten ligger på GitHub. Åpenhetssiden lister uttømmende hva som lagres, og du kan sjekke den listen mot koden linje for linje.",
  },
];

export default function Home() {
  return (
    <>
      <JsonLd data={serviceLd()} />
      <Topbar />
      <main>
        <section className="mx-auto max-w-6xl px-5 pb-20 pt-20 sm:pt-24">
          <h1 className="mx-auto max-w-3xl text-center text-4xl font-semibold tracking-tighter sm:text-5xl">
            Bruk KI helt anonymt
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-center text-[15px] leading-relaxed text-ink-dim">
            Vanlige KI-tjenester knytter hvert spørsmål til navnet ditt. Vi har
            ingen konto å knytte det til.
          </p>
          <div className="mt-10">
            <HeroChatInput />
          </div>
        </section>

        <section
          id="slik-virker-det"
          className="border-t border-line scroll-mt-16"
        >
          <div className="mx-auto max-w-6xl px-5 py-16">
            <p className="font-mono text-[12px] uppercase tracking-widest text-ink-faint">
              Slik virker det
            </p>

            <div className="mt-8 rounded-card border border-line bg-surface p-7 sm:p-9">
              <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
                Hvordan er det mulig?
              </h2>

              <div className="mt-6 flex flex-col gap-3 font-mono text-[13px] sm:flex-row sm:items-center sm:gap-4">
                <span className="rounded-(--radius-ctl) border border-line-strong px-3 py-2 text-ink">
                  Din nettleser
                </span>
                <span aria-hidden className="text-ink-faint sm:px-1">
                  ▸
                </span>
                <span className="rounded-(--radius-ctl) border border-accent/40 px-3 py-2 text-accent-strong">
                  Vår server
                </span>
                <span aria-hidden className="text-ink-faint sm:px-1">
                  ▸
                </span>
                <span className="rounded-(--radius-ctl) border border-line-strong px-3 py-2 text-ink">
                  Claude
                </span>
              </div>

              <div className="mt-6 max-w-2xl space-y-3 text-[15px] leading-relaxed text-ink-dim">
                <p>
                  Serveren vår er et rør, ikke et arkiv. Spørsmålet ditt er
                  innom oss i de sekundene det tar å svare, og forsvinner i det
                  svaret er levert. Vi skriver det aldri ned noe sted.
                </p>
                <p>
                  Vi sender det videre fra én felles bedriftskonto, så
                  Anthropic ser at noen spurte, ikke at du gjorde det. Og
                  siden det ikke finnes kontoer hos oss, finnes det ingenting
                  å koble en logg til. Historikken din lagres i din egen
                  nettleser, ikke hos oss.
                </p>
                <p className="text-ink">
                  Du trenger ikke tro på oss.{" "}
                  <a
                    href={GITHUB_URL}
                    rel="noopener noreferrer"
                    target="_blank"
                    className="text-accent-strong underline underline-offset-4 hover:text-accent"
                  >
                    Koden er åpen
                  </a>
                  , så du kan lese nøyaktig hva serveren gjør med hvert eneste
                  kall.
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-px overflow-hidden rounded-card border border-line bg-line sm:grid-cols-3">
              {TRUST_POINTS.map((point) => (
                <div key={point.label} className="bg-surface p-6">
                  <h2 className="text-[15px] font-medium">{point.label}</h2>
                  <p className="mt-2 text-[14px] leading-relaxed text-ink-dim">
                    {point.body}
                  </p>
                </div>
              ))}
            </div>
            <p className="mt-6 max-w-2xl text-[14px] leading-relaxed text-ink-faint">
              Spørsmålene besvares av Claude. Alle kall går fra vår felles
              bedriftskonto, så modell-leverandøren ser at noen spurte om noe,
              men aldri hvem. Les detaljene på{" "}
              <Link
                href="/openness"
                className="text-ink-dim underline underline-offset-4 hover:text-ink"
              >
                åpenhetssiden
              </Link>
              .
            </p>
          </div>
        </section>

        <section id="priser" className="border-t border-line scroll-mt-16">
          <div className="mx-auto max-w-6xl px-5 py-16">
            <p className="font-mono text-[12px] uppercase tracking-widest text-ink-faint">
              Priser
            </p>
            <div className="mt-8 grid gap-5 md:grid-cols-2">
              <div className="rounded-card border border-line bg-surface p-7">
                <h2 className="text-[15px] font-medium">Gratis</h2>
                <p className="mt-1 text-3xl font-semibold tracking-tight">
                  0 kr
                </p>
                <ul className="mt-5 space-y-2 text-[14px] leading-relaxed text-ink-dim">
                  <li>Haiku-modellen, rask og kompetent</li>
                  <li>Ubegrenset bruk innen rimelighetens grenser</li>
                  <li>Nøyaktig samme anonymitet som betalt nivå</li>
                </ul>
                <Link
                  href="/chat"
                  className="mt-7 inline-block rounded-(--radius-ctl) border border-line-strong px-4 py-2.5 text-[14px] font-medium transition active:scale-[0.98] hover:border-accent hover:text-accent-strong"
                >
                  Start gratis
                </Link>
              </div>
              <div className="relative rounded-card border border-accent/40 bg-surface p-7">
                <span className="absolute right-5 top-5 rounded-full border border-accent/40 px-2.5 py-0.5 font-mono text-[11px] text-accent-strong">
                  Best kvalitet
                </span>
                <h2 className="text-[15px] font-medium">Kreditt</h2>
                <p className="mt-1 text-3xl font-semibold tracking-tight">
                  fra 49 kr
                </p>
                <ul className="mt-5 space-y-2 text-[14px] leading-relaxed text-ink-dim">
                  <li>Sonnet, Opus og Fable, markedets beste modeller</li>
                  <li>Du velger modell. Sonnet 1 kr, Opus 2 kr, Fable 5 kr</li>
                  <li>Koden er anonym og ikke knyttet til deg</li>
                  <li>Fra 20 kr hvis du betaler med bitcoin</li>
                </ul>
                <Link
                  href="/buy"
                  className="mt-7 inline-block rounded-(--radius-ctl) bg-accent px-4 py-2.5 text-[14px] font-medium text-accent-ink transition active:scale-[0.98] hover:bg-accent-strong"
                >
                  Kjøp kreditt
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-line">
          <div className="mx-auto max-w-6xl px-5 py-16">
            <p className="font-mono text-[12px] uppercase tracking-widest text-ink-faint">
              Slik kjøper du kreditt
            </p>
            <div className="mt-8 grid gap-5 md:grid-cols-2">
              <div className="rounded-card border border-line bg-surface p-7">
                <h2 className="text-[15px] font-medium">Vipps</h2>
                <p className="mt-2 text-[14px] leading-relaxed text-ink-dim">
                  Betal med Vipps og få en engangskode på skjermen. Vipps ser
                  at du kjøpte en kode av oss, men koblingen mellom betalingen
                  og koden slettes i det koden utstedes. Det finnes ingen vei
                  fra betalingen til det du spør om.
                </p>
              </div>
              <div className="rounded-card border border-line bg-surface p-7">
                <h2 className="text-[15px] font-medium">Bitcoin</h2>
                <p className="mt-2 text-[14px] leading-relaxed text-ink-dim">
                  Betal med bitcoin, Lightning eller on-chain, hvis du ikke vil at noen
                  skal vite at du er kunde hos oss i det hele tatt. Da må du
                  betale fra din egen lommebok, ikke rett fra en børs.{" "}
                  <Link
                    href="/anonymt"
                    className="text-ink underline underline-offset-4"
                  >
                    Slik gjør du det
                  </Link>
                  .
                </p>
              </div>
            </div>
            <p className="mt-6 max-w-2xl text-[14px] leading-relaxed text-ink-faint">
              Koden er et ihendehaverbevis, som kontanter. Mister du den, kan
              vi ikke finne den igjen for deg, for vi vet ikke hvem den
              tilhørte. Derfor selger vi små valører.
            </p>
          </div>
        </section>

        <section id="sporsmal" className="border-t border-line scroll-mt-16">
          <div className="mx-auto max-w-3xl px-5 py-16">
            <p className="font-mono text-[12px] uppercase tracking-widest text-ink-faint">
              Spørsmål og svar
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight">
              De vanligste innvendingene
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-ink-dim">
              Besvart så ærlig vi klarer. Trykk for å lese svaret.
            </p>
            <div className="mt-8">
              <FaqAccordion items={QA} />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
