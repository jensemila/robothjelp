// Løser proof-of-work-utfordringen i nettleseren før hvert søk.
// Ved ~15 bits vanskelighetsgrad tar dette normalt under et halvt sekund.

function hasLeadingZeroBits(hash: Uint8Array, bits: number): boolean {
  let remaining = bits;
  for (const byte of hash) {
    if (remaining >= 8) {
      if (byte !== 0) return false;
      remaining -= 8;
    } else if (remaining > 0) {
      return byte >> (8 - remaining) === 0;
    } else {
      return true;
    }
  }
  return remaining <= 0;
}

export async function fetchAndSolvePow(): Promise<{
  pow_challenge: string;
  pow_solution: string;
}> {
  const response = await fetch("/api/pow");
  if (!response.ok) throw new Error("pow_unavailable");
  const { challenge, difficulty } = (await response.json()) as {
    challenge: string;
    difficulty: number;
  };

  const encoder = new TextEncoder();
  for (let nonce = 0; ; nonce++) {
    const data = encoder.encode(`${challenge}.${nonce}`);
    const hash = new Uint8Array(await crypto.subtle.digest("SHA-256", data));
    if (hasLeadingZeroBits(hash, difficulty)) {
      return { pow_challenge: challenge, pow_solution: String(nonce) };
    }
  }
}
