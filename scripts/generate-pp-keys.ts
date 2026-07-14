// Genererer nøkkelpar for Privacy Pass (blind RSA).
// Bruk: npm run gen-pp-keys  → lim inn utskriften i .env.local

import { RSABSSA } from "@cloudflare/blindrsa-ts";

function u8ToB64(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("base64");
}

async function main() {
  const suite = RSABSSA.SHA384.PSS.Randomized();
  const { privateKey, publicKey } = await suite.generateKey({
    publicExponent: Uint8Array.from([1, 0, 1]),
    modulusLength: 2048,
  });
  const pkcs8 = new Uint8Array(
    await crypto.subtle.exportKey("pkcs8", privateKey),
  );
  const spki = new Uint8Array(await crypto.subtle.exportKey("spki", publicKey));
  console.log(`PP_PRIVATE_KEY=${u8ToB64(pkcs8)}`);
  console.log(`PP_PUBLIC_KEY=${u8ToB64(spki)}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
