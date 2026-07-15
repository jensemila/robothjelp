# Robothjelp

Anonyme KI-søk. Ingen konto, ingen lagring av samtaler, ingen IP-logging.
Betaling er frikoblet fra bruk via anonyme kredittkoder.

Live på [robothjelp.no](https://robothjelp.no).

Koden er åpen av én grunn: du skal slippe å tro på oss. Alt vi påstår på
nettsiden kan ettergås her.

## Ettergå påstandene selv

| Påstand | Hvor du sjekker |
|---|---|
| Samtaler lagres aldri | [`src/app/api/chat/route.ts`](src/app/api/chat/route.ts) streamer mot Anthropic og skriver ingenting til disk |
| IP-adressen logges aldri | [`src/lib/server/ratelimit.ts`](src/lib/server/ratelimit.ts) HMAC-hasher IP-en med en nøkkel som kun finnes i minnet og roteres ved omstart |
| Vi lagrer kun kode og saldo | [`prisma/schema.prisma`](prisma/schema.prisma) er hele databasen, tre tabeller |
| Koder lagres aldri i klartekst | [`src/lib/server/codes.ts`](src/lib/server/codes.ts) lagrer kun SHA-256-hashen |
| Kjøp kobles ikke til kode | [`src/lib/server/claims.ts`](src/lib/server/claims.ts) holder koblingen i minnet i maks 15 minutter og sletter den ved henting |
| Betalte søk kan ikke kobles sammen | [`src/lib/server/privacypass.ts`](src/lib/server/privacypass.ts) implementerer blinde RSA-signaturer |
| Historikk finnes kun i nettleseren | [`src/components/chat/ChatApp.tsx`](src/components/chat/ChatApp.tsx) bruker localStorage |

Finner du avvik mellom [åpenhetssiden](https://robothjelp.no/openness) og
koden, er det en feil vi vil vite om.

## Hva vi ikke lover

- **Anthropic ser innholdet.** Spørsmål besvares av Claude. Alle kall går fra
  én felles bedriftskonto uten identitet, så de ser at noen spurte, ikke at
  du gjorde det.
- **Vi er ikke immune mot rettslige pålegg.** Vi følger norsk lov, men kan
  bare utlevere det vi har: en liste anonyme koder med saldo.
- **IP-en passerer serveren i sanntid.** Den logges ikke, men er
  trusselmodellen din at ingen skal vite at du bruker tjenesten, bruk Tor
  eller VPN. Vi blokkerer ikke Tor.

## Arkitektur

```
Nettleser  ──POST /api/chat──►  Next.js route handler  ──►  Anthropic API
    ▲                           (streamer, intet til disk)       │
    └─────────────── SSE ────────────────────────────────────────┘

SQLite (Prisma), hele databasen:
  credit_codes(code_hash, saldo_ore, opprettet_at)
  claimed_payments(reference_hash, claimed_at)
  spent_tokens(token_hash, brukt_at)
```

Anti-misbruk er proof-of-work i nettleseren pluss rate limiting per IP, begge
uten lagring. Se [`src/lib/server/pow.ts`](src/lib/server/pow.ts).

## Kjøre lokalt

Krever Node 20+.

```bash
npm install
cp .env.example .env.local     # fyll inn ANTHROPIC_API_KEY
npm run gen-pp-keys            # skriver ut PP-nøklene, legg dem i .env.local
npx prisma db push             # oppretter prisma/dev.db
npm run dev                    # http://localhost:3000
```

Gratisnivået (Haiku) fungerer med bare `ANTHROPIC_API_KEY`. Betalt nivå
krever en kredittkode:

```bash
npm run gen-code -- 49         # skriver ut ROBO-XXXX-XXXX-XXXX-XXXX
```

Vipps og BTCPay er valgfrie. Uten nøkler svarer kjøpsflyten «ikke konfigurert»
(503), og resten av tjenesten fungerer som normalt.

## Miljøvariabler

Alle hemmeligheter leses fra miljøet og ligger aldri i repoet. Se
[`.env.example`](.env.example) for hele listen. I produksjon ligger de i
`/etc/robothjelp/env` (chmod 600), lest av systemd-tjenesten i
[`deploy/`](deploy/).

## Drift

```bash
./deploy/deploy.sh
```

Bygger standalone-pakken, rsyncer til serveren og restarter tjenesten.
Caddy-config og systemd-enhet ligger i [`deploy/`](deploy/).

Personvernkrav til driften:

- Reverse proxyen skal ikke logge forespørsler. Applikasjonen logger ingenting
  selv.
- `.env`-filer committes aldri. Hemmeligheter kun i miljøvariabler.
- Databasen ligger utenfor webroten.

## Lisens

TODO: velg lisens før publisering.
