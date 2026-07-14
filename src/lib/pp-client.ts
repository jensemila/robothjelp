"use client";

import { RSABSSA } from "@cloudflare/blindrsa-ts";
import { b64ToU8, u8ToB64 } from "@/lib/b64";

// Privacy Pass i nettleseren: blinder tilfeldige meldinger, får dem
// blindsignert av serveren, og lagrer ferdige tokens i localStorage.
// Hvert token er ett betalt svar, og kan ikke kobles til koden det kom fra.

export const PP_TOKENS_KEY = "robothjelp:pp_tokens";

export type PpToken = { message: string; signature: string };

const suite = RSABSSA.SHA384.PSS.Randomized();

export function loadTokens(): PpToken[] {
  try {
    const raw = localStorage.getItem(PP_TOKENS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveTokens(tokens: PpToken[]) {
  try {
    localStorage.setItem(PP_TOKENS_KEY, JSON.stringify(tokens));
  } catch {
    // Ikke kritisk.
  }
}

export function popToken(): PpToken | null {
  const tokens = loadTokens();
  const token = tokens.pop() ?? null;
  if (token) saveTokens(tokens);
  return token;
}

export function tokenCount(): number {
  return loadTokens().length;
}

/** Er Privacy Pass aktivert på serveren? */
export async function ppEnabled(): Promise<boolean> {
  try {
    const response = await fetch("/api/pp/key");
    const data = await response.json();
    return Boolean(data?.enabled);
  } catch {
    return false;
  }
}

/**
 * Veksler `count` svar fra kredittkoden inn i anonyme tokens.
 * Returnerer nytt totalt antall tokens i nettleseren.
 */
export async function exchangeCodeForTokens(
  code: string,
  count: number,
): Promise<number> {
  const keyResponse = await fetch("/api/pp/key");
  const keyData = await keyResponse.json();
  if (!keyData?.enabled || typeof keyData.publicKey !== "string") {
    throw new Error("Privacy Pass er ikke aktivert på serveren.");
  }
  const publicKey = await crypto.subtle.importKey(
    "spki",
    b64ToU8(keyData.publicKey),
    { name: "RSA-PSS", hash: "SHA-384" },
    true,
    ["verify"],
  );

  // Blind tilfeldige meldinger.
  const prepared: Uint8Array[] = [];
  const invs: Uint8Array[] = [];
  const blinded: string[] = [];
  for (let i = 0; i < count; i++) {
    const nonce = crypto.getRandomValues(new Uint8Array(32));
    const preparedMsg = suite.prepare(nonce);
    const { blindedMsg, inv } = await suite.blind(publicKey, preparedMsg);
    prepared.push(preparedMsg);
    invs.push(inv);
    blinded.push(u8ToB64(blindedMsg));
  }

  const response = await fetch("/api/pp/exchange", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, blinded }),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok || !Array.isArray(data?.signatures)) {
    throw new Error(data?.error ?? "Klarte ikke å veksle inn tokens.");
  }

  // Avblind og verifiser hvert token før lagring.
  const tokens = loadTokens();
  for (let i = 0; i < count; i++) {
    const signature = await suite.finalize(
      publicKey,
      prepared[i],
      b64ToU8(String(data.signatures[i])),
      invs[i],
    );
    const valid = await suite.verify(publicKey, signature, prepared[i]);
    if (!valid) throw new Error("Fikk ugyldig signatur fra serveren.");
    tokens.push({
      message: u8ToB64(prepared[i]),
      signature: u8ToB64(signature),
    });
  }
  saveTokens(tokens);
  return tokens.length;
}
