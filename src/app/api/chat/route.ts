import Anthropic from "@anthropic-ai/sdk";
import { MODEL_TIERS, isModelTier } from "@/lib/models";

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
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return jsonError(503, "Tjenesten er ikke konfigurert ennå.");
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, "Ugyldig forespørsel.");
  }

  const { messages: rawMessages, model: rawModel } = body as {
    messages?: unknown;
    model?: unknown;
  };

  const tier = isModelTier(rawModel) ? rawModel : "haiku";
  const messages = validateMessages(rawMessages);
  if (!messages) {
    return jsonError(400, "Ugyldig forespørsel.");
  }

  if (MODEL_TIERS[tier].paid) {
    // Betalt nivå kobles på i kredittsystem-bolken.
    return jsonError(402, "Opus krever kreditt. Løs inn en kode først.");
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
        send({ type: "done", stopReason: final.stop_reason });
      } catch {
        // Ingen detaljer logges eller videresendes; klienten får en generisk feil.
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
