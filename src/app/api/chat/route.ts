import Anthropic from "@anthropic-ai/sdk";
import {
  MODEL_TIERS,
  isModelTier,
  isPaidTier,
  priceOre,
  tokensFor,
} from "@/lib/models";
import { consumeFreeAnswer } from "@/lib/server/budget";
import { hashCode, normalizeCode } from "@/lib/server/codes";
import { prisma } from "@/lib/server/db";
import { verifySolution } from "@/lib/server/pow";
import { ppConfigured, spendTokens } from "@/lib/server/privacypass";
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

const MAX_B64_LENGTH = 1024;
const MAX_TOKENS_PER_ANSWER = 20;

/** Returnerer tokens hvis lista er velformet, ellers null (= ikke oppgitt). */
function validateTokens(
  value: unknown,
): { message: string; signature: string }[] | null {
  if (
    !Array.isArray(value) ||
    value.length === 0 ||
    value.length > MAX_TOKENS_PER_ANSWER
  ) {
    return null;
  }
  const tokens: { message: string; signature: string }[] = [];
  for (const item of value) {
    if (
      typeof item !== "object" ||
      item === null ||
      typeof item.message !== "string" ||
      typeof item.signature !== "string" ||
      item.message.length === 0 ||
      item.signature.length === 0 ||
      item.message.length > MAX_B64_LENGTH ||
      item.signature.length > MAX_B64_LENGTH
    ) {
      return null;
    }
    tokens.push({ message: item.message, signature: item.signature });
  }
  return tokens;
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
    pp_tokens: rawPpTokens,
    web_search: rawWebSearch,
    pow_challenge: powChallenge,
    pow_solution: powSolution,
  } = body as {
    messages?: unknown;
    model?: unknown;
    code?: unknown;
    pp_tokens?: unknown;
    web_search?: unknown;
    pow_challenge?: unknown;
    pow_solution?: unknown;
  };

  // Websøk er på med mindre brukeren har skrudd det av.
  const webSearch = rawWebSearch !== false;

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
  //  1) Privacy Pass-tokens: serveren verifiserer at de er ekte, men kan ikke
  //     koble dem til kode, kjøp eller andre søk. Et svar koster like mange
  //     tokens som modellen koster kroner.
  //  2) Kredittkode (MVP): saldo trekkes atomisk FØR svaret genereres.
  //     Koden lagres aldri i klartekst; kun hashen brukes til oppslag.
  const costOre = priceOre(tier);
  let remainingOre: number | null = null;
  let paidCodeHash: string | null = null;

  if (isPaidTier(tier)) {
    const ppTokens = validateTokens(rawPpTokens);

    if (ppTokens) {
      if (!ppConfigured()) {
        return jsonError(503, "Privacy Pass er ikke aktivert på serveren.");
      }
      const needed = tokensFor(tier);
      if (ppTokens.length !== needed) {
        return jsonError(
          402,
          `${MODEL_TIERS[tier].label} koster ${needed} ${
            needed === 1 ? "token" : "tokens"
          } per svar.`,
        );
      }
      if (!(await spendTokens(ppTokens))) {
        return jsonError(
          402,
          "Ugyldige eller allerede brukte tokens. Veksle inn flere fra koden din.",
        );
      }
    } else {
      const normalized =
        typeof rawCode === "string" ? normalizeCode(rawCode) : null;
      if (!normalized) {
        return jsonError(
          402,
          `${MODEL_TIERS[tier].label} krever kreditt. Løs inn en kode først.`,
        );
      }
      const codeHash = hashCode(normalized);
      const deducted = await prisma.creditCode.updateMany({
        where: { codeHash, saldoOre: { gte: costOre } },
        data: { saldoOre: { decrement: costOre } },
      });
      if (deducted.count === 0) {
        return jsonError(
          402,
          "Ikke nok saldo på koden. Kjøp en ny kode, eller velg en rimeligere modell.",
        );
      }
      paidCodeHash = codeHash;
      const entry = await prisma.creditCode.findUnique({
        where: { codeHash },
        select: { saldoOre: true },
      });
      remainingOre = entry?.saldoOre ?? null;
    }
  } else if (!consumeFreeAnswer()) {
    // Gratisnivået har et globalt dagsbudsjett som beskytter regningen mot
    // vedvarende misbruk. Trekkes etter at betaling er avklart, så et betalt
    // svar aldri blokkeres av gratis-taket.
    return jsonError(
      429,
      "Gratisnivået er brukt opp for i dag. Prøv igjen i morgen, eller bruk kreditt for å fortsette nå.",
    );
  }

  const client = new Anthropic({ apiKey });

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };
      // Refunderer et betalt svar som ikke ble levert. Gjelder kun
      // kredittkode: brukte tokens kan ikke gis tilbake uten å gjøre dem
      // sporbare, som er hele poenget med dem.
      const refund = async () => {
        if (!paidCodeHash) return;
        try {
          const entry = await prisma.creditCode.update({
            where: { codeHash: paidCodeHash },
            data: { saldoOre: { increment: costOre } },
            select: { saldoOre: true },
          });
          remainingOre = entry.saldoOre;
        } catch {
          // Refusjon er beste forsøk.
        }
      };

      try {
        // Websøk kjøres av Anthropic på serversiden. Søkene utføres uten
        // identitet, akkurat som resten av kallet.
        const tools = webSearch
          ? [
              {
                type: MODEL_TIERS[tier].webSearchTool,
                name: "web_search" as const,
                max_uses: MODEL_TIERS[tier].webSearchMaxUses,
              } as Anthropic.WebSearchTool20250305,
            ]
          : undefined;

        // Server-verktøy kan pause turen (stop_reason "pause_turn") midt i
        // et søk. Da sendes samtalen inn igjen med den delvise assistent-
        // turen, og modellen fortsetter der den slapp.
        let turnMessages: Anthropic.MessageParam[] = [...messages];
        let final: Anthropic.Message;
        for (let round = 0; ; round++) {
          const anthropicStream = client.messages.stream({
            model: MODEL_TIERS[tier].id,
            max_tokens: MODEL_TIERS[tier].maxTokens,
            system: SYSTEM_PROMPT,
            messages: turnMessages,
            ...(tools ? { tools } : {}),
          });
          for await (const event of anthropicStream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              send({ type: "text", text: event.delta.text });
            }
          }
          final = await anthropicStream.finalMessage();
          if (final.stop_reason !== "pause_turn" || round >= 3) break;
          turnMessages = [
            ...turnMessages,
            { role: "assistant", content: final.content },
          ];
        }

        // Sikkerhetsklassifiserere kan avvise en forespørsel. Da kommer det
        // ingen tekst, så svaret skal ikke betales for.
        if (final.stop_reason === "refusal") {
          await refund();
          send({
            type: "error",
            message:
              "Modellen kunne ikke svare på dette. Du er ikke belastet.",
            ...(remainingOre !== null ? { saldo_ore: remainingOre } : {}),
          });
          return;
        }

        send({
          type: "done",
          stopReason: final.stop_reason,
          ...(remainingOre !== null ? { saldo_ore: remainingOre } : {}),
        });
      } catch {
        // Ingen detaljer logges eller videresendes; klienten får en generisk feil.
        await refund();
        send({
          type: "error",
          message: "Noe gikk galt. Prøv igjen.",
          ...(remainingOre !== null ? { saldo_ore: remainingOre } : {}),
        });
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
