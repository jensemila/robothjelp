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

export type PpToken = { message: string; signature: string };

/**
 * Verifiserer og bruker opp flere tokens i én operasjon, alt-eller-ingenting.
 *
 * Rekkefølgen er viktig: ALLE signaturer verifiseres før noe skrives, og
 * innskrivingen skjer i én transaksjon. Ellers ville et svar til fem tokens
 * brent de fire første før det femte viste seg å være ugyldig.
 *
 * Returnerer false ved ugyldig signatur, gjenbruk, eller samme token oppgitt
 * flere ganger i samme forespørsel.
 */
export async function spendTokens(tokens: PpToken[]): Promise<boolean> {
  if (tokens.length === 0) return false;

  // 1) Verifiser alle signaturer. Ingen skriving her.
  try {
    const key = await publicKey();
    for (const token of tokens) {
      const valid = await suite.verify(
        key,
        b64ToU8(token.signature),
        b64ToU8(token.message),
      );
      if (!valid) return false;
    }
  } catch {
    return false;
  }

  // 2) Avvis samme token oppgitt flere ganger i samme forespørsel.
  const hashes = tokens.map((token) =>
    createHash("sha256").update(token.message).digest("hex"),
  );
  if (new Set(hashes).size !== hashes.length) return false;

  // 3) Brenn alle i én transaksjon. Er ett brukt fra før, rulles alt tilbake.
  try {
    await prisma.$transaction(
      hashes.map((tokenHash) => prisma.spentToken.create({ data: { tokenHash } })),
    );
    return true;
  } catch {
    return false;
  }
}
