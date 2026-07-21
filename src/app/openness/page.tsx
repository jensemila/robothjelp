import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/Footer";
import { Topbar } from "@/components/Topbar";
import { GITHUB_URL, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  description:
    "Uttømmende oversikt over hva Robothjelp lagrer: kun hashede kredittkoder med saldo. Ingen samtaler, ingen IP-logger, ingen kontoer. Sjekk listen mot den åpne kildekoden.",
  alternates: { canonical: `${SITE_URL}/openness` },
  title: "Åpenhet",
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

export default function OpennessPage() {
  return (
    <>
      <Topbar />
      <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-16">
        <h1 className="text-3xl font-semibold tracking-tighter">Åpenhet</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-dim">
          Dette er den uttømmende oversikten over hva tjenesten lagrer, hva
          som kun finnes i minnet, og hva Anthropic ser. Finner du avvik
          mellom denne siden og koden, er det en feil du gjerne må melde.
        </p>

        <Section title="Det vi lagrer på disk (alt sammen)">
          <p>Databasen inneholder tre tabeller. Ingenting annet lagres.</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <span className="text-ink">Kredittkoder:</span> hash av koden
              (aldri koden i klartekst), gjenværende saldo og
              opprettelsestidspunkt.
            </li>
            <li>
              <span className="text-ink">Brukte betalingsreferanser:</span>{" "}
              hash av en tilfeldig betalingsreferanse og tidspunkt. Dette
              hindrer at samme betaling utsteder to koder. Referansen kan
              ikke kobles til noen kode, noe søk eller noen person.
            </li>
            <li>
              <span className="text-ink">Brukte Privacy Pass-tokens:</span>{" "}
              hash av hvert brukt token og tidspunkt, så samme token ikke kan
              brukes to ganger. Tokens er blindsignerte tilfeldige verdier,
              og kan per konstruksjon ikke kobles til koden de ble vekslet
              fra, til kjøpet eller til andre søk.
            </li>
          </ul>
          <p>
            Ingen samtaler. Ingen IP-adresser. Ingen brukeragenter. Ingen
            kontoer. Ingen kobling mellom betaling og kode.
          </p>
        </Section>

        <Section title="Det som finnes kort i minnet (aldri på disk)">
          <ul className="list-disc space-y-2 pl-5">
            <li>
              Spørsmålet ditt og svaret, mens de streames mellom deg og
              modellen. Skrives aldri til disk.
            </li>
            <li>
              En hash av IP-adressen din i inntil ett minutt, for rate
              limiting. Hemmeligheten den hashes med roteres ved omstart og
              finnes bare i prosessminnet.
            </li>
            <li>
              Brukte beregningsbevis (proof-of-work) i inntil fem minutter,
              så samme bevis ikke kan gjenbrukes.
            </li>
            <li>
              Nyutstedte kredittkoder i inntil 15 minutter etter betaling,
              til du har hentet dem. Koblingen slettes i det koden vises.
            </li>
          </ul>
        </Section>

        <Section title="Det du selv lagrer i nettleseren">
          <p>
            Samtalehistorikken, modellvalget, kredittkoden din og sist kjente
            saldo ligger i localStorage i din nettleser. «Slett historikk» i
            chatten fjerner samtalen med ett klikk. Vi kan ikke se noe av
            dette.
          </p>
        </Section>

        <Section title="Hva Anthropic ser">
          <p>
            Spørsmålene besvares av Claude, og sendes derfor til Anthropic.
            Alle kall går fra vår felles bedriftskonto. Anthropic ser
            innholdet i spørsmålet, men ikke hvem som stilte det: ingen navn,
            ingen e-post, ingen IP, ingen kontokobling.
          </p>
          <p>
            Anthropic oppbevarer API-data i en begrenset periode for
            misbruksovervåking i henhold til sine egne retningslinjer, per i
            dag inntil 30 dager. Les detaljene hos Anthropic, og regn med at
            innholdet i et spørsmål kan ligge der i den perioden, uten
            identitet knyttet til det.
          </p>
          <p>
            Websøk: modellen kan søke på nettet for å svare på spørsmål om
            ferske hendelser. Søkene utføres av Anthropic på deres
            infrastruktur, ikke fra din IP, og søkeordene er utledet av
            spørsmålet ditt. Vil du ikke det, kan du skru av websøk med
            bryteren i chatten, per nettleser.
          </p>
        </Section>

        <Section title="Hva betalingsleverandørene ser">
          <p>
            Vipps ser at du kjøpte en kredittkode av oss, med beløp og
            tidspunkt. De ser aldri koden og aldri hva du spør om. Betaler du
            med Bitcoin over Lightning, har vi ikke noe kundeforhold til deg
            i det hele tatt.
          </p>
        </Section>

        <Section title="Ettergå oss">
          <p>
            Kildekoden er åpen, så du kan lese nøyaktig hva serveren gjør med
            hvert kall:{" "}
            <a
              href={GITHUB_URL}
              rel="noopener noreferrer"
              target="_blank"
              className="text-ink underline underline-offset-4"
            >
              GitHub
            </a>
            . Se også{" "}
            <Link
              href="/privacy"
              className="text-ink underline underline-offset-4"
            >
              personvernerklæringen
            </Link>{" "}
            og{" "}
            <Link href="/faq" className="text-ink underline underline-offset-4">
              spørsmål og svar
            </Link>
            .
          </p>
        </Section>
      </main>
      <Footer />
    </>
  );
}
