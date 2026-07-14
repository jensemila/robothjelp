// Dev-verktøy: utsted en kredittkode manuelt.
// Bruk: npm run gen-code -- <beløp i kr>   (f.eks. npm run gen-code -- 49)

import { issueCode } from "../src/lib/server/issue";

async function main() {
  const kroner = Number(process.argv[2]);
  if (!Number.isFinite(kroner) || kroner <= 0) {
    console.error("Bruk: npm run gen-code -- <beløp i kr>");
    process.exit(1);
  }
  const code = await issueCode(Math.round(kroner * 100));
  console.log(code);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
