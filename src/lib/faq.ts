// Spørsmål og svar. Teksten er hentet ordrett fra PLAN.md seksjon 6.
// Delt mellom forsiden (trekkspill) og /faq (utfoldet).

export type QaItem = { question: string; answer: string[] };

export const QA: QaItem[] = [
  {
    question: "«Dere er bare et mellomledd. Anthropic ser jo alt uansett.»",
    answer: [
      "Riktig, og vi skjuler det ikke. Spørsmålene sendes videre til Anthropic for å bli besvart. Forskjellen er hva de ser: hos oss kommer alle spørsmål fra én og samme bedriftskonto, uten navn, e-post, telefonnummer eller IP knyttet til deg. Anthropic ser at noen spurte om noe. De kan ikke se at du gjorde det. Bruker du en vanlig KI-tjeneste med egen konto, er hvert spørsmål koblet til identiteten din. Det er den koblingen vi fjerner.",
    ],
  },
  {
    question: "«Hvordan kan jeg vite at dere faktisk ikke logger noe?»",
    answer: [
      "Det kan du strengt tatt ikke, og derfor ber vi deg ikke om å tro på oss. Tre ting kan du ettergå selv: koden vår er åpen på GitHub, så du kan lese nøyaktig hva serveren gjør med hvert kall. Personvernerklæringen lister uttømmende hva som lagres (saldo per kredittkode, ingenting annet). Og vi har innrettet oss slik at logging ville vært verdiløst for oss selv: ingen kontoer betyr at det ikke finnes noe å koble en logg til.",
    ],
  },
  {
    question:
      "«Er ikke dette bare en tjeneste for folk som har noe å skjule?»",
    answer: [
      "Alle har noe de ikke vil ha i en database. Spørsmål om egen økonomi, jus, samliv eller jobbkonflikter er helt lovlige, men det er også helt rimelig å ikke ville at de skal ligge lagret med navn i årevis, hos selskaper som kan bli hacket, kjøpt opp eller pålagt utlevering. Privatliv er ikke mistenkelig. Det er standarden alt annet burde måles mot. Tjenesten følger for øvrig samme regler som all annen KI: modellen svarer ikke på ting den ikke skal svare på, uansett hvor anonym du er.",
    ],
  },
  {
    question: "«Vipps vet jo hvem jeg er, da er anonymiteten borte.»",
    answer: [
      "Vipps ser at du kjøpte en kredittkode av oss. Det er alt. Koden aktiveres uten kobling til kjøpet, og vi lagrer ikke hvilken kode som gikk til hvilken betaling etter utstedelse. Så selv med full innsikt i betalingen finnes det ingen vei fra «Ola betalte 49 kr» til «dette spurte Ola om». Vil du ikke at noen skal vite at du er kunde hos oss i det hele tatt, bruker du Lightning.",
      "Men da skal vi være presise, for her er det lett å overselge: en norsk bitcoin-børs krever legitimasjon og vet hvem du er. Betaler du rett fra børsen til oss, sitter børsen igjen med en logg over at du betalte nettopp oss, og den kan kreves utlevert. Skal Lightning faktisk gi deg anonymitet, må du ta bitcoin ut til din egen lommebok først og betale derfra. Da vet børsen at du kjøpte bitcoin, men ikke hva du brukte den til. Vi har skrevet en oppskrift på det.",
    ],
  },
  {
    question: "«Hva skjer når politiet banker på døra?»",
    answer: [
      "Vi er en norsk tjeneste og følger norsk lov. Får vi et rettslig pålegg, etterkommer vi det. Men vi kan bare utlevere det vi har, og det vi har er en liste over anonyme kredittkoder med saldo. Ingen samtaler, ingen IP-logger, ingen kundenavn. Det er ikke fordi vi gjemmer noe. Det er fordi arkitekturen er bygget slik at dataene aldri oppstår. Det som ikke finnes, kan verken lekke eller kreves utlevert.",
    ],
  },
  {
    question:
      "«DuckDuckGo og Proton tilbyr dette gratis. Hvorfor betale dere?»",
    answer: [
      "Gjør det! Helt seriøst, de er gode tjenester, og trenger du bare grunnleggende anonym KI, er de et fint valg. Det du får hos oss er tilgang til de beste modellene på markedet (gratistjenestene kjører mellomklassemodeller), en norsk aktør underlagt GDPR og norsk tilsyn, og betaling uten kontoopprettelse. Du betaler for kvalitet, ikke for anonymiteten. Den er gratis hos oss også.",
    ],
  },
  {
    question:
      "«Dette er ikke ekte anonymitet. Bare en lokal modell er det.»",
    answer: [
      "Her har du rett i noe viktig, så la oss være presise. En modell som kjører på din egen maskin er den eneste måten å oppnå at ingen andre ser innholdet i det hele tatt. Det gir vi deg ikke, og vi har aldri påstått det heller. Anthropic ser spørsmålene dine.",
      "Men anonymitet og konfidensialitet er to forskjellige ting. Konfidensialitet er om noen ser innholdet overhodet. Anonymitet er om innholdet kan kobles til deg. Hos en vanlig KI-tjeneste med konto har du ingen av delene: de ser hva du spør om, og de vet at det var du. Hos oss ser Anthropic hva noen spurte om, men ingen vet at det var du. Med en lokal modell har du begge deler. Det er tre forskjellige nivåer, ikke to.",
      "Og et poeng som fortjener å innrømmes: innholdet kan avsløre deg uansett hvordan vi bygger dette. Skriver du navnet ditt, arbeidsgiveren din og hjemstedet ditt inn i spørsmålet, hjelper det ingenting at det ikke finnes noen konto. Ingen mellomledd kan beskytte deg mot at du identifiserer deg selv i teksten. Bare en lokal modell kan det.",
      "Så er lokalt bedre? For ren konfidensialitet, ja, utvilsomt. Kan du sette opp en lokal modell og er fornøyd med kvaliteten den gir, bør du gjøre det. Men det krever maskinvare og teknisk kompetanse, og modellene du får kjørt hjemme er merkbart svakere enn de beste. Vi prøver ikke å slå en lokal modell på personvern. Vi finnes for dem som vil ha markedets beste modeller uten at navnet henger ved, og som ikke kommer til å sette opp noe på egen maskin uansett.",
    ],
  },
  {
    question:
      "«Anonym kreditt betyr at dere kan stjele pengene mine. Mister jeg koden, er pengene borte.»",
    answer: [
      "Ja, en kredittkode er som kontanter: mister du den, er den borte, og vi kan ikke hjelpe deg, for vi vet ikke hvem den tilhørte. Det er prisen for at ingen andre kan koble den til deg heller. Derfor selger vi små valører (fra 49 kr), så eksponeringen din er begrenset. Og fordi koden er ihendehaverbevis, kan du oppbevare den i din egen passordhåndterer, akkurat som et gavekort.",
    ],
  },
  {
    question: "«Hva hvis dere blir hacket?»",
    answer: [
      "Da får angriperen det samme som politiet ville fått: en liste med anonyme koder og saldoer. Det er hele poenget med arkitekturen. Vanlige tjenester sitter på millioner av samtaler koblet til navn, og hvert innbrudd er en katastrofe for brukerne. Vårt verste tenkelige innbrudd avslører at noen har 34 kr igjen på en tilfeldig tallrekke.",
    ],
  },
  {
    question: "«IP-adressen min avslører meg uansett.»",
    answer: [
      "Vi lagrer den ikke, men den passerer nødvendigvis serveren vår i sanntid, og internettleverandøren din ser at du besøkte domenet (ikke innholdet, som er kryptert). Er trusselmodellen din at ingen skal vite at du bruker tjenesten, anbefaler vi Tor eller VPN oppå. Vi blokkerer ikke Tor-trafikk.",
    ],
  },
  {
    question:
      "«Men kan man ikke koble kredittkoden til søkene hvis alt lekker?»",
    answer: [
      "La oss dele det i to. Lekkasje av lagrede data: Nei. Søkene lagres aldri, så det finnes ingen database der kode og søk ligger side om side. Det som kan lekke er listen over koder og saldoer, og en saldo forteller ingenting om hva du spurte om. Siden koblingen mellom betalingen og koden slettes når koden utstedes, kan ikke engang koden føres tilbake til deg.",
      "Sanntidskompromittering: Her skal vi være helt ærlige. I selve øyeblikket du søker, må serveren vite hvilken kode saldoen skal trekkes fra (med mindre du bruker Privacy Pass, se under). En angriper som har full kontroll over serveren mens du bruker den, kan i teorien se søk og kode samtidig, slik enhver tjeneste på internett kan kompromitteres i sanntid. Men koden er fortsatt ikke knyttet til noe navn, og angriperen får kun det som skjer fremover i tid, aldri historikken din, for den finnes ikke. Derfor er koden vår åpen: du kan verifisere at serveren ikke logger i det skjulte. Med Privacy Pass aktivert kan heller ikke serveren i sanntid koble to søk til hverandre.",
    ],
  },
];
