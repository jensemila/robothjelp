// Lager kredittkoder for utdeling, UTEN å skrive til noen database.
// Skriver ut «kode<TAB>hash» per linje: koden gir du bort, hashen er det
// eneste serveren skal få se.
//
// Bruk: npm run mint-codes -- <beløp i kr> <antall>
//   f.eks. npm run mint-codes -- 50 10

import { generateCode, hashCode, normalizeCode } from "../src/lib/server/codes";

function main() {
  const kroner = Number(process.argv[2]);
  const count = Number(process.argv[3] ?? 1);

  if (!Number.isFinite(kroner) || kroner <= 0) {
    console.error("Bruk: npm run mint-codes -- <beløp i kr> <antall>");
    process.exit(1);
  }
  if (!Number.isInteger(count) || count <= 0 || count > 1000) {
    console.error("Antall må være et heltall mellom 1 og 1000.");
    process.exit(1);
  }

  const saldoOre = Math.round(kroner * 100);
  const seen = new Set<string>();

  while (seen.size < count) {
    const code = generateCode();
    const normalized = normalizeCode(code);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    process.stdout.write(`${code}\t${hashCode(normalized)}\t${saldoOre}\n`);
  }
}

main();
