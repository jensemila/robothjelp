import { QA } from "@/lib/faq";
import {
  CONTACT_EMAIL,
  LEGAL_NAME,
  ORG_NR,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
} from "@/lib/site";

// Strukturert data (schema.org / JSON-LD). Dette er det som gjør at både
// Google og LLM-baserte søkemotorer forstår hva tjenesten er, hva den koster,
// og kan sitere spørsmål og svar direkte. Én ærlig kilde: tallene her speiler
// modellprisene og FAQ-teksten ellers i appen.

// Fjerner sitattegn fra FAQ-spørsmålene så schema-teksten blir ren.
function cleanQuestion(q: string): string {
  return q.replace(/[«»"]/g, "").trim();
}

export function organizationLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    legalName: LEGAL_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    email: CONTACT_EMAIL,
    identifier: `NO ${ORG_NR}`,
    areaServed: "NO",
    sameAs: ["https://github.com/jensemila/robothjelp"],
  };
}

export function websiteLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    inLanguage: "nb-NO",
    description: SITE_DESCRIPTION,
  };
}

// Tjenesten med prisnivåene. Gjør at pris kan vises i søkeresultater og leses
// av KI som spør «hva koster det».
export function serviceLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: `${SITE_NAME} – anonyme KI-søk`,
    serviceType: "Anonym KI-assistent",
    provider: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
    areaServed: "NO",
    description: SITE_DESCRIPTION,
    offers: [
      {
        "@type": "Offer",
        name: "Gratis (Haiku-modellen)",
        price: "0",
        priceCurrency: "NOK",
        description: "Ubegrenset anonym bruk uten registrering.",
      },
      {
        "@type": "Offer",
        name: "Sonnet",
        price: "1",
        priceCurrency: "NOK",
        description: "Per svar. Nær Opus i kvalitet.",
      },
      {
        "@type": "Offer",
        name: "Opus",
        price: "2",
        priceCurrency: "NOK",
        description: "Per svar. Markedets beste modell for de fleste oppgaver.",
      },
      {
        "@type": "Offer",
        name: "Fable",
        price: "5",
        priceCurrency: "NOK",
        description: "Per svar. Den mest kapable modellen som finnes.",
      },
    ],
  };
}

// FAQPage fra den samme Q&A-teksten som vises på siden. Dette er kronjuvelen
// for KI-søk: hvert spørsmål og svar blir maskinlesbart og siterbart.
export function faqLd() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: QA.map((item) => ({
      "@type": "Question",
      name: cleanQuestion(item.question),
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer.join(" "),
      },
    })),
  };
}

/** Renderer ett eller flere JSON-LD-objekter som script-tagger. */
export function JsonLd({ data }: { data: object | object[] }) {
  const items = Array.isArray(data) ? data : [data];
  return (
    <>
      {items.map((item, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(item) }}
        />
      ))}
    </>
  );
}
