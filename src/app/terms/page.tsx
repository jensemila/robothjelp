import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/Footer";
import { Topbar } from "@/components/Topbar";
import { CONTACT_EMAIL, SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Salgsvilkår",
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

export default function TermsPage() {
  return (
    <>
      <Topbar />
      <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-16">
        <h1 className="text-3xl font-semibold tracking-tighter">
          Salgsvilkår
        </h1>
        <p className="mt-3 font-mono text-[12px] text-ink-faint">
          Sist oppdatert 14. juli 2026
        </p>

        <Section title="1. Hvem vi er">
          <p>
            Disse vilkårene gjelder kjøp av kredittkoder fra {SITE_NAME} på{" "}
            {SITE_URL}. Selger er [SELSKAPSNAVN], organisasjonsnummer
            [ORG.NR], [ADRESSE]. Henvendelser rettes til {CONTACT_EMAIL}.
          </p>
          <p>
            Vilkårene gjelder sammen med angrerettloven, forbrukerkjøpsloven
            og annen ufravikelig norsk forbrukerlovgivning. Ingenting i disse
            vilkårene begrenser rettigheter du har etter loven.
          </p>
        </Section>

        <Section title="2. Hva du kjøper">
          <p>
            Du kjøper en anonym kredittkode med en forhåndsbetalt saldo.
            Koden gir tilgang til tjenestens betalte modellnivå, der saldoen
            trekkes per svar. Gjeldende pris per svar oppgis på kjøpssiden
            før du betaler.
          </p>
          <p>
            Koden er ikke knyttet til navn, konto eller betalingsmåte. Det er
            en bevisst egenskap ved tjenesten: vi kan ikke se hvem som eier
            en kode, og koblingen mellom betalingen og koden slettes i det
            koden utleveres.
          </p>
        </Section>

        <Section title="3. Pris og betaling">
          <p>
            Kredittkoder selges i faste valører som oppgis på kjøpssiden.
            Alle priser er i norske kroner og inkluderer eventuell
            merverdiavgift. Betaling skjer med Vipps eller med Bitcoin over
            Lightning. Kjøpet belastes i sin helhet når betalingen
            gjennomføres.
          </p>
        </Section>

        <Section title="4. Levering">
          <p>
            Koden leveres digitalt og vises på skjermen umiddelbart etter
            gjennomført betaling. Den vises kun én gang. Skriv den ned eller
            lagre den et trygt sted, for eksempel i en passordhåndterer, før
            du lukker siden.
          </p>
          <p>
            Blir koden ikke vist på grunn av teknisk feil hos oss, kontakt
            oss med betalingsreferansen din, så løser vi det. Se punkt 7.
          </p>
        </Section>

        <Section title="5. Koden er et ihendehaverbevis">
          <p>
            Kredittkoden fungerer som kontanter. Den som har koden, kan bruke
            saldoen. Mister du koden, eller deler du den med andre, kan vi
            ikke sperre, gjenopprette eller erstatte den, for vi vet ikke
            hvem den tilhører. Dette er prisen for at heller ingen andre kan
            koble koden til deg. Oppbevar den deretter.
          </p>
          <p>Saldoen har ingen utløpsdato.</p>
        </Section>

        <Section title="6. Angrerett">
          <p>
            Kjøp av kredittkode er levering av digitalt innhold som ikke
            leveres på et fysisk medium. Ved å gjennomføre kjøpet samtykker
            du uttrykkelig til at leveringen starter umiddelbart, og du
            erkjenner samtidig at angreretten dermed går tapt, jf.
            angrerettloven § 22 bokstav n.
          </p>
          <p>
            Frem til du har startet betalingen kan du selvsagt avbryte
            kjøpet uten kostnad.
          </p>
        </Section>

        <Section title="7. Reklamasjon">
          <p>
            Er det en feil ved koden, for eksempel at en ubrukt kode ikke lar
            seg aktivere, har du krav på retting etter forbrukerkjøpsloven.
            Kontakt oss på {CONTACT_EMAIL} og oppgi koden eller
            betalingsreferansen. Fordi tjenesten er anonym, kan vi verifisere
            kodens tilstand uten å vite hvem du er. Ved dokumentert feil
            utsteder vi ny kode med tilsvarende saldo, eller refunderer
            kjøpet der det er praktisk mulig.
          </p>
          <p>
            Reklamasjon må skje innen rimelig tid etter at feilen ble
            oppdaget, og senest innen fristene i forbrukerkjøpsloven.
          </p>
        </Section>

        <Section title="8. Bruk av tjenesten">
          <p>
            Svarene i tjenesten genereres av en KI-modell og kan inneholde
            feil eller unøyaktigheter. De er generell informasjon, ikke
            profesjonell rådgivning, og bør ikke være eneste grunnlag for
            viktige beslutninger.
          </p>
          <p>
            Tjenesten skal brukes innenfor norsk lov. Modellen svarer ikke på
            alt, og følger de samme reglene som annen KI, uavhengig av
            anonymiteten. Misbruk som rammes av tekniske mottiltak, for
            eksempel automatisert massetrafikk, kan avvises uten at det gir
            rett til refusjon av forbrukt saldo.
          </p>
        </Section>

        <Section title="9. Ansvar og tilgjengelighet">
          <p>
            Vi tilstreber stabil drift, men garanterer ikke uavbrutt
            tilgjengelighet. Ved lengre nedetid som hindrer bruk av betalt
            saldo, kan du kreve tilsvarende saldo kompensert. Vårt samlede
            ansvar ved kjøp av en kredittkode er begrenset til kodens
            kjøpesum, med mindre annet følger av ufravikelig lov.
          </p>
        </Section>

        <Section title="10. Personvern">
          <p>
            Tjenesten er bygget for å lagre minst mulig: ingen konto, ingen
            lagring av samtaler, ingen IP-logging. Les{" "}
            <Link
              href="/privacy"
              className="text-ink underline underline-offset-4"
            >
              personvernerklæringen
            </Link>{" "}
            og{" "}
            <Link
              href="/openness"
              className="text-ink underline underline-offset-4"
            >
              åpenhetssiden
            </Link>{" "}
            for en uttømmende oversikt over hva som lagres.
          </p>
        </Section>

        <Section title="11. Endringer i vilkårene">
          <p>
            Vi kan endre disse vilkårene. Endringer gjelder kun for kjøp som
            gjennomføres etter at de oppdaterte vilkårene er publisert på
            denne siden. Kjøp reguleres av vilkårene slik de var på
            kjøpstidspunktet.
          </p>
        </Section>

        <Section title="12. Lovvalg og tvister">
          <p>
            Vilkårene reguleres av norsk rett. Er du misfornøyd med noe, ta
            først kontakt med oss, så forsøker vi å løse saken. Du kan også
            klage til Forbrukertilsynet eller bringe saken inn for
            Forbrukerklageutvalget. Tvister kan uansett bringes inn for de
            ordinære domstolene.
          </p>
        </Section>
      </main>
      <Footer />
    </>
  );
}
