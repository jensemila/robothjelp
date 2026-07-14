import Anthropic from "@anthropic-ai/sdk";
import { MODEL_TIERS, isModelTier } from "@/lib/models";
import {
  PRICE_PER_ANSWER_ORE,
  hashCode,
  normalizeCode,
} from "@/lib/server/codes";
import { prisma } from "@/lib/server/db";
import { verifySolution } from "@/lib/server/pow";
import { ppConfigured, spendToken } from "@/lib/server/privacypass";
import { allowRequest } from "@/lib/server/ratelimit";

// Personvernkrav (PLAN.md seksjon 10): denne handleren logger ALDRI IP,
// brukeragent eller samtaleinnhold. Ingen console.log av request-data,
// ingenting skrives til disk. Feil returneres til klienten uten innhold.

export const runtime = "nodejs";

const MAX_MESSAGES = 40;
const MAX_MESSAGE_CHARS = 20_000;
const MAX_TOTAL_CHARS = 100_000;

const SYSTEM_PROMPT =
  "Du er en hjelpsom assistent i en anonym søketjeneste. " +
  "Svar på språket brukeren skriver. Vær presis og nøktern.";

type IncomingMessage = { role: "user" | "assistant"; content: string };

function validateMessages(value: unknown): IncomingMessage[] | null {
  if (!Array.isArray(value) || value.length === 0 || value.length > MAX_MESSAGES) {
    return null;
  }
  let total = 0;
  const messages: IncomingMessage[] = [];
  for (const item of value) {
    if (
      typeof item !== "object" ||
      item === null ||
      (item.role !== "user" && item.role !== "assistant") ||
      typeof item.content !== "string" ||
      item.content.length === 0 ||
      item.content.length > MAX_MESSAGE_CHARS
    ) {
      return null;
    }
    total += item.content.length;
    messages.push({ role: item.role, content: item.content });
  }
  if (total > MAX_TOTAL_CHARS || messages[0].role !== "user") {
    return null;
  }
  return messages;
}

function jsonError(status: number, message: string) {
  return Response.json({ error: message }, { status });
}

export async function POST(request: Request) {
  if (!allowRequest(request)) {
    return jsonError(429, "For mange forespørsler. Vent litt og prøv igjen.");
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, "Ugyldig forespørsel.");
  }

  const {
    messages: rawMessages,
    model: rawModel,
    code: rawCode,
    pp_message: ppMessage,
    pp_signature: ppSignature,
    pow_challenge: powChallenge,
    pow_solution: powSolution,
  } = body as {
    messages?: unknown;
    model?: unknown;
    code?: unknown;
    pp_message?: unknown;
    pp_signature?: unknown;
    pow_challenge?: unknown;
    pow_solution?: unknown;
  };

  if (!verifySolution(powChallenge, powSolution)) {
    return jsonError(403, "Ugyldig eller utløpt beregningsbevis. Prøv igjen.");
  }

  const tier = isModelTier(rawModel) ? rawModel : "haiku";
  const messages = validateMessages(rawMessages);
  if (!messages) {
    return jsonError(400, "Ugyldig forespørsel.");
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return jsonError(503, "Tjenesten er ikke konfigurert ennå.");
  }

  // Betalt nivå. To veier:
  //  1) Privacy Pass-token: serveren kan verifisere at tokenet er ekte,
  //     men ikke koble det til kode, kjøp eller andre søk.
  //  2) Kredittkode (MVP): saldo trekkes atomisk FØR svaret genereres.
  //     Koden lagres aldri i klartekst; kun hashen brukes til oppslag.
  let remainingOre: number | null = null;
  let paidCodeHash: string | null = null;
  if (
    MODEL_TIERS[tier].paid &&
    typeof ppMessage === "string" &&
    typeof ppSignature === "string"
  ) {
    if (!ppConfigured()) {
      return jsonError(503, "Privacy Pass er ikke aktivert på serveren.");
    }
    if (
      ppMessage.length > 1024 ||
      ppSignature.length > 1024 ||
      !(await spendToken(ppMessage, ppSignature))
    ) {
      return jsonError(
        402,
        "Ugyldig eller allerede brukt token. Veksle inn flere fra koden din.",
      );
    }
  } else if (MODEL_TIERS[tier].paid) {
    const normalized =
      typeof rawCode === "string" ? normalizeCode(rawCode) : null;
    if (!normalized) {
      return jsonError(402, "Opus krever kreditt. Løs inn en kode først.");
    }
    const codeHash = hashCode(normalized);
    const deducted = await prisma.creditCode.updateMany({
      where: { codeHash, saldoOre: { gte: PRICE_PER_ANSWER_ORE } },
      data: { saldoOre: { decrement: PRICE_PER_ANSWER_ORE } },
    });
    if (deducted.count === 0) {
      return jsonError(
        402,
        "Ikke nok saldo på koden. Kjøp en ny kode for å fortsette.",
      );
    }
    paidCodeHash = codeHash;
    const entry = await prisma.creditCode.findUnique({
      where: { codeHash },
      select: { saldoOre: true },
    });
    remainingOre = entry?.saldoOre ?? null;
  }

  const client = new Anthropic({ apiKey });

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };
      try {
        const anthropicStream = client.messages.stream({
          model: MODEL_TIERS[tier].id,
          max_tokens: MODEL_TIERS[tier].maxTokens,
          system: SYSTEM_PROMPT,
          messages,
        });
        for await (const event of anthropicStream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            send({ type: "text", text: event.delta.text });
          }
        }
        const final = await anthropicStream.finalMessage();
        send({
          type: "done",
          stopReason: final.stop_reason,
          ...(remainingOre !== null ? { saldo_ore: remainingOre } : {}),
        });
      } catch {
        // Ingen detaljer logges eller videresendes; klienten får en generisk feil.
        // Feilet betalt svar refunderes.
        if (paidCodeHash) {
          try {
            await prisma.creditCode.update({
              where: { codeHash: paidCodeHash },
              data: { saldoOre: { increment: PRICE_PER_ANSWER_ORE } },
            });
          } catch {
            // Refusjon er beste forsøk.
          }
        }
        send({ type: "error", message: "Noe gikk galt. Prøv igjen." });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-store",
      Connection: "keep-alive",
    },
  });
}
