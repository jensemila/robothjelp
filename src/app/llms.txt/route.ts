import { SITE_URL } from "@/lib/site";

// llms.txt: en kuratert oversikt for KI-baserte søkemotorer og agenter
// (ChatGPT, Perplexity, Claude m.fl.). Formatet er en gryende standard som
// gir crawlere en ren, faktabasert inngang til det viktigste innholdet.

export const dynamic = "force-static";

const BODY = `# Robothjelp

> Anonyme KI-søk. En norsk tjeneste som lar deg bruke de beste KI-modellene
> uten konto, uten lagring av samtaler og uten IP-logging. Betaling er
> frikoblet fra bruk via anonyme kredittkoder.

Robothjelp er et anonymiserende mellomledd foran Claude (Anthropic). Alle kall
går fra én felles bedriftskonto uten brukeridentitet, så modell-leverandøren
ser at noen spurte om noe, men aldri hvem. Tjenesten drives av Klarlinje Asp,
et norsk enkeltpersonforetak, og er underlagt norsk lov og GDPR.

## Hva som gjør tjenesten anonym
- Ingen konto: ingen e-post, telefon eller innlogging.
- Samtaler lagres aldri på serveren; historikk finnes kun i brukerens nettleser.
- IP-adressen logges aldri til disk.
- Betaling er frikoblet fra bruk: man kjøper anonyme kredittkoder, og koblingen
  mellom betaling og kode slettes ved utstedelse.
- Privacy Pass (blinde signaturer) lar betalte søk ikke kobles til hverandre.

## Hva tjenesten ikke lover
- Anthropic ser innholdet i spørsmålene (uten identitet).
- Tjenesten er ikke immun mot rettslige pålegg, men kan bare utlevere det den
  har: en liste anonyme kredittkoder med saldo.
- Full konfidensialitet krever en lokal modell; det gir Robothjelp ikke.

## Modeller og priser
- Haiku: gratis, ubegrenset, uten registrering.
- Sonnet: 1 kr per svar.
- Opus: 2 kr per svar.
- Fable: 5 kr per svar.
Kredittkoder kjøpes fra 20 kr med bitcoin eller 49 kr med Vipps.

## Sider
- [Forside](${SITE_URL}/): hva tjenesten er og hvordan den virker.
- [Spørsmål og svar](${SITE_URL}/faq): de vanligste innvendingene, besvart ærlig.
- [Åpenhet](${SITE_URL}/openness): uttømmende liste over hva som lagres.
- [Slik kjøper du anonymt](${SITE_URL}/anonymt): kjøp uten å avsløre identitet.
- [Personvern](${SITE_URL}/privacy)
- [Salgsvilkår](${SITE_URL}/terms)
- [Kildekode på GitHub](https://github.com/jensemila/robothjelp)
`;

export function GET() {
  return new Response(BODY, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
