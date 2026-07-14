import { createHash } from "node:crypto";
import { RSABSSA } from "@cloudflare/blindrsa-ts";
import { b64ToU8, u8ToB64 } from "@/lib/b64";
import { prisma } from "@/lib/server/db";

// Privacy Pass via blinde RSA-signaturer (RSABSSA, RFC 9474).
// Serveren signerer blindede meldinger den ikke kan lese, og kan derfor
// aldri koble et token til koden det ble vekslet fra, eller to søk til
// hverandre. Nøklene ligger KUN i miljøvariabler (base64 PKCS8/SPKI).

export const suite = RSABSSA.SHA384.PSS.Randomized();

export function ppConfigured(): boolean {
  return Boolean(process.env.PP_PRIVATE_KEY && process.env.PP_PUBLIC_KEY);
}

export function ppPublicKeyB64(): string {
  return process.env.PP_PUBLIC_KEY!;
}

let privateKeyPromise: Promise<CryptoKey> | null = null;
let publicKeyPromise: Promise<CryptoKey> | null = null;

function privateKey(): Promise<CryptoKey> {
  // extractable må være true: biblioteket eksporterer nøkkelen for å
  // utføre selve blindsigneringen (rå RSA er ikke tilgjengelig i WebCrypto).
  privateKeyPromise ??= crypto.subtle.importKey(
    "pkcs8",
    b64ToU8(process.env.PP_PRIVATE_KEY!),
    { name: "RSA-PSS", hash: "SHA-384" },
    true,
    ["sign"],
  );
  return privateKeyPromise;
}

function publicKey(): Promise<CryptoKey> {
  publicKeyPromise ??= crypto.subtle.importKey(
    "spki",
    b64ToU8(process.env.PP_PUBLIC_KEY!),
    { name: "RSA-PSS", hash: "SHA-384" },
    true,
    ["verify"],
  );
  return publicKeyPromise;
}

/** Signerer en liste blindede meldinger (server ser aldri innholdet). */
export async function blindSignBatch(blindedB64: string[]): Promise<string[]> {
  const key = await privateKey();
  const signatures: string[] = [];
  for (const blinded of blindedB64) {
    const signature = await suite.blindSign(key, b64ToU8(blinded));
    signatures.push(u8ToB64(signature));
  }
  return signatures;
}

/**
 * Verifiserer et token og markerer det som brukt, atomisk.
 * Returnerer false ved ugyldig signatur eller gjenbruk.
 */
export async function spendToken(
  messageB64: string,
  signatureB64: string,
): Promise<boolean> {
  try {
    const valid = await suite.verify(
      await publicKey(),
      b64ToU8(signatureB64),
      b64ToU8(messageB64),
    );
    if (!valid) return false;
  } catch {
    return false;
  }

  const tokenHash = createHash("sha256").update(messageB64).digest("hex");
  try {
    await prisma.spentToken.create({ data: { tokenHash } });
    return true;
  } catch {
    // Unik-brudd: tokenet er allerede brukt.
    return false;
  }
}
