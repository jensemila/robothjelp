# Robothjelp — anonyme KI-søk

Anonymiserende mellomledd foran Claude sin API. Ingen konto, ingen lagring av
samtaler, ingen IP-logging. Betaling er frikoblet fra bruk via anonyme
kredittkoder. Se `PLAN.md` for hele byggeplanen og personvernkravene.

## Utvikling

```bash
cp .env.example .env.local   # fyll inn ANTHROPIC_API_KEY m.m.
npm install
npx prisma db push           # oppretter SQLite-basen (prisma/dev.db)
npm run dev                  # http://localhost:3000
```

Utsted en testkode for betalt nivå (Opus):

```bash
npm run gen-code -- 49       # skriver ut f.eks. ROBO-XXXX-XXXX-XXXX-XXXX
```

## Drift på egen server (robothjelp.no)

Bygget er `standalone`, så produksjonsserveren trenger bare Node 20+:

```bash
npm run build
# Kopier til serveren:
#   .next/standalone/   (inkl. server.js)
#   .next/static/    -> .next/standalone/.next/static
#   public/          -> .next/standalone/public
#   prisma/          -> databasefil + schema
# På serveren:
DATABASE_URL="file:/var/lib/robothjelp/prod.db" \
ANTHROPIC_API_KEY=... \
node server.js               # lytter på PORT (default 3000)
```

Sett opp en reverse proxy (Caddy/nginx) foran med TLS for robothjelp.no.

VIKTIG personvernkrav til driften (PLAN.md seksjon 10):

- Ikke logg forespørsler i reverse proxyen (skru av access-log, eller
  fjern IP fra loggformatet). Applikasjonen logger selv ingenting.
- `.env`-filer skal aldri committes; hemmeligheter kun i miljøvariabler.
- Databasen inneholder kun kredittkode-hasher og saldo, og skal ligge
  utenfor webroten.

## Miljøvariabler

Se `.env.example`. Uten `ANTHROPIC_API_KEY` svarer chatten 503; uten
Vipps-/BTCPay-nøkler svarer kjøpsflyten 503. Resten av siden fungerer.
