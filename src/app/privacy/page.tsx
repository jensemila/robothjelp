import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/Footer";
import { Topbar } from "@/components/Topbar";
import { CONTACT_EMAIL, SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Personvern",
};

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-10">
      <h2 className="text-[17px] font-semibold tracking-tight">{title}</h2>
      <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-ink-dim">
        {children}
      </div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <>
      <Topbar />
      <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-16">
        <h1 className="text-3xl font-semibold tracking-tighter">
          Personvernerklæring
        </h1>
        <p className="mt-3 font-mono text-[12px] text-ink-faint">
          Sist oppdatert 14. juli 2026
        </p>

        <Section title="1. Behandlingsansvarlig">
          <p>
            [SELSKAPSNAVN], organisasjonsnummer [ORG.NR], er
            behandlingsansvarlig for {SITE_NAME} på {SITE_URL}. Henvendelser
            om personvern rettes til {CONTACT_EMAIL}.
          </p>
        </Section>

        <Section title="2. Utgangspunktet: vi samler ikke inn personopplysninger">
          <p>
            Tjenesten er bygget for å behandle så lite som mulig. Det finnes
            ingen kontoer, ingen registrering og ingen identifikatorer
            knyttet til bruk. Den fullstendige oversikten over hva som lagres
            står på{" "}
            <Link
              href="/openness"
              className="text-ink underline underline-offset-4"
            >
              åpenhetssiden
            </Link>
            : hashede kredittkoder med saldo, og hashede betalingsreferanser.
            Ingen av delene kan knyttes til en person av oss.
          </p>
        </Section>

        <Section title="3. Opplysninger som behandles flyktig">
          <p>
            Når du bruker tjenesten, passerer to ting serveren i sanntid uten
            å bli lagret:
          </p>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              IP-adressen din, som er teknisk nødvendig for å levere svar
              over internett. Den skrives aldri til logg eller disk. En hash
              av den holdes i minnet i inntil ett minutt for å begrense
              automatisert misbruk (berettiget interesse, GDPR artikkel 6
              nr. 1 bokstav f).
            </li>
            <li>
              Innholdet i spørsmål og svar, som streames mellom deg og
              KI-leverandøren. Det lagres aldri hos oss.
            </li>
          </ul>
        </Section>

        <Section title="4. Databehandlere og tredjeparter">
          <p>
            Spørsmål besvares av Claude fra Anthropic. Alle kall sendes fra
            vår felles bedriftskonto uten identitet. Anthropic oppbevarer
            API-data i en begrenset periode for misbruksovervåking etter
            sine egne vilkår.
          </p>
          <p>
            Ved kjøp med Vipps behandler Vipps MobilePay dine
            betalingsopplysninger som selvstendig behandlingsansvarlig. Vi
            mottar bare en bekreftelse på at et anonymt referansenummer er
            betalt. Ved betaling med Bitcoin over Lightning behandles ingen
            personopplysninger hos oss.
          </p>
        </Section>

        <Section title="5. Lagring i din egen nettleser">
          <p>
            Samtalehistorikk, modellvalg, kredittkode og sist kjente saldo
            lagres kun i localStorage i din nettleser, på din enhet. Vi har
            ikke tilgang til dette, og du kan slette det når som helst med
            «Slett historikk»-knappen eller i nettleserens innstillinger. Vi
            bruker ingen informasjonskapsler og ingen sporing.
          </p>
        </Section>

        <Section title="6. Dine rettigheter">
          <p>
            Du har rett til innsyn, retting og sletting etter GDPR. I praksis
            har vi ingenting å gi innsyn i: vi kan ikke finne opplysninger om
            deg, fordi ingenting vi lagrer kan knyttes til deg. Mener du
            likevel at vi behandler opplysninger om deg, kontakt oss på{" "}
            {CONTACT_EMAIL}. Du kan også klage til Datatilsynet.
          </p>
        </Section>

        <Section title="7. Endringer">
          <p>
            Endringer i denne erklæringen publiseres på denne siden. Vesentlige
            endringer varsles på forsiden.
          </p>
        </Section>
      </main>
      <Footer />
    </>
  );
}
