// Dev-verktøy: utsted en kredittkode i den LOKALE utviklingsdatabasen.
// Bruk: npm run gen-code -- <beløp i kr>   (f.eks. npm run gen-code -- 49)
//
// MERK: denne skriver dit DATABASE_URL peker, som lokalt er prisma/dev.db.
// Koder herfra virker KUN på localhost, aldri på robothjelp.no. Skal du lage
// koder til ekte utdeling, bruk «npm run mint-codes» og legg hashene inn i
// produksjonsdatabasen.

import { issueCode } from "../src/lib/server/issue";

async function main() {
  const kroner = Number(process.argv[2]);
  if (!Number.isFinite(kroner) || kroner <= 0) {
    console.error("Bruk: npm run gen-code -- <beløp i kr>");
    process.exit(1);
  }

  const target = process.env.DATABASE_URL ?? "(DATABASE_URL ikke satt)";
  const code = await issueCode(Math.round(kroner * 100));

  console.log(code);
  console.error(`\nSkrevet til: ${target}`);
  if (!target.includes("prod")) {
    console.error(
      "Dette er utviklingsdatabasen. Koden virker kun lokalt, ikke på robothjelp.no.",
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
