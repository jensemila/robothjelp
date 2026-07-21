import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/Footer";
import { Topbar } from "@/components/Topbar";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  description:
    "Slik kjøper du kreditt helt anonymt: ta ut bitcoin til din egen Lightning-lommebok først, og betal oss derfra. Da vet ingen at du er kunde.",
  alternates: { canonical: `${SITE_URL}/anonymt` },
  title: "Slik kjøper du anonymt",
};

function Step({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <li className="relative border-l border-line pb-10 pl-8 last:pb-0">
      <span className="absolute -left-[13px] top-0 flex h-6 w-6 items-center justify-center rounded-full border border-line-strong bg-surface font-mono text-[11px] text-ink-dim">
        {n}
      </span>
      <h2 className="text-[17px] font-semibold tracking-tight">{title}</h2>
      <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-ink-dim">
        {children}
      </div>
    </li>
  );
}

export default function AnonymtPage() {
  return (
    <>
      <Topbar />
      <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-16">
        <h1 className="text-3xl font-semibold tracking-tighter">
          Slik kjøper du anonymt
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-dim">
          Vil du ikke at noen skal vite at du er kunde hos oss, betaler du med
          Lightning. Men det holder ikke å betale rett fra en børs. Her er
          hvorfor, og hva du gjør i stedet.
        </p>

        <div className="mt-8 rounded-card border border-line bg-surface p-6">
          <h2 className="text-[15px] font-medium">Kort fortalt</h2>
          <p className="mt-2 text-[14px] leading-relaxed text-ink-dim">
            Alle norske bitcoin-børser krever legitimasjon. Det er ikke til å
            komme utenom, og det er heller ikke problemet. Problemet oppstår
            hvis du sender betalingen rett fra børsen til oss: da sitter
            børsen igjen med en logg som viser at nettopp du betalte nettopp
            oss. Løsningen er å ta bitcoin ut til din egen lommebok først.
          </p>
        </div>

        <ol className="mt-12">
          <Step n={1} title="Kjøp bitcoin på en børs">
            <p>
              Bruk for eksempel{" "}
              <a
                href="https://barebitcoin.no"
                rel="noopener noreferrer"
                target="_blank"
                className="text-ink underline underline-offset-4"
              >
                barebitcoin.no
              </a>
              . Du må legitimere deg. Det er norsk lov, og alle registrerte
              børser krever det.
            </p>
            <p>
              Kjøp for litt mer enn kredittkoden koster, så du har margin til
              nettverksgebyr.
            </p>
          </Step>

          <Step n={2} title="Ta ut til din egen Lightning-lommebok">
            <p className="text-ink">
              Dette steget er hele forskjellen. Ikke hopp over det.
            </p>
            <p>
              Installer en Lightning-lommebok du selv kontrollerer, for
              eksempel Phoenix eller Zeus, og ta ut bitcoin fra børsen til
              den. Nå vet børsen at du kjøpte og tok ut bitcoin, men ikke hva
              du bruker den til senere.
            </p>
            <p>
              Hold uttaket under 1 000 euro. Over den grensen må børsen kreve
              dokumentasjon på at du eier lommeboka, typisk et skjermbilde.
              Små uttak er både enklere og mer diskré.
            </p>
          </Step>

          <Step n={3} title="Betal oss fra din egen lommebok">
            <p>
              Gå til{" "}
              <Link
                href="/buy"
                className="text-ink underline underline-offset-4"
              >
                kjøpssiden
              </Link>
              , velg valør og Lightning, og følg betalingssiden. I lommeboka
              di gjør du så:
            </p>
            <ol className="list-decimal space-y-1.5 pl-5">
              <li>Trykk send</li>
              <li>Scan QR-koden på betalingssiden</li>
              <li>Tillat betalingen</li>
              <li>Sveip for å sende</li>
              <li>Verifiser i appen</li>
            </ol>
            <p>
              Betalingen går på sekunder. Koden vises på skjermen med én gang,
              og den vises kun én gang.
            </p>
          </Step>

          <Step n={4} title="Ta vare på koden">
            <p>
              Koden er et ihendehaverbevis, som kontanter. Lagre den i en
              passordhåndterer før du lukker siden. Mister du den, kan vi ikke
              gjenopprette den, for vi vet ikke hvem den tilhørte.
            </p>
          </Step>
        </ol>

        <section className="mt-4 rounded-card border border-line bg-surface p-6">
          <h2 className="text-[15px] font-medium">
            Hva hvert steg faktisk skjuler, og for hvem
          </h2>
          <div className="mt-3 space-y-3 text-[14px] leading-relaxed text-ink-dim">
            <p>
              <span className="text-ink">Børsen</span> vet hvem du er og at du
              kjøpte bitcoin. Etter steg 2 vet den ikke hva du brukte den til.
            </p>
            <p>
              <span className="text-ink">Vi</span> ser en betaling fra en
              tilfeldig lommebok, uten navn. Koblingen mellom betalingen og
              koden slettes i det koden utleveres.
            </p>
            <p>
              <span className="text-ink">Internettleverandøren din</span> ser
              at du besøkte domenet vårt, ikke hva du spør om. Vil du skjule
              også det, bruk Tor eller VPN. Vi blokkerer ikke Tor.
            </p>
            <p>
              Dette gir deg anonymitet mot oss og mot børsen. Det gjør deg
              ikke usporbar i absolutt forstand, og det påstår vi heller
              ikke. Les{" "}
              <Link
                href="/openness"
                className="text-ink underline underline-offset-4"
              >
                åpenhetssiden
              </Link>{" "}
              for hele bildet.
            </p>
          </div>
        </section>

        <p className="mt-8 text-[14px] leading-relaxed text-ink-faint">
          Synes du dette er for tungvint, er Vipps helt greit. Da vet Vipps at
          du kjøpte en kode av oss, men fortsatt ikke hva du spør om.
        </p>
      </main>
      <Footer />
    </>
  );
}
