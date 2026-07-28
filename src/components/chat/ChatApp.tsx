"use client";

import Link from "next/link";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useCallback, useEffect, useRef, useState } from "react";
import { BALANCE_KEY, CODE_KEY, TIER_KEY, formatOre } from "@/lib/credit";
import { DRAFT_KEY } from "@/lib/draft";
import {
  MODEL_ORDER,
  MODEL_TIERS,
  type ModelTier,
  TOKEN_VALUE_ORE,
  isModelTier,
  isPaidTier,
  tokensFor,
} from "@/lib/models";
import { fetchAndSolvePow } from "@/lib/pow-client";
import {
  type PpToken,
  loadTokens,
  popTokens,
  returnTokens,
  tokenCount,
} from "@/lib/pp-client";
import {
  ALLOWED_ATTACHMENT_TYPES,
  type Attachment,
  type ChatMessage,
  MAX_FILES,
  readFileAsAttachment,
  stripAttachmentData,
  toApiContent,
} from "@/lib/attachments";
import { SITE_NAME } from "@/lib/site";
import { UpgradeHint } from "./UpgradeHint";

// All historikk ligger KUN i nettleseren (localStorage), aldri på serveren.
const HISTORY_KEY = "robothjelp:history";
const WEB_SEARCH_KEY = "robothjelp:websok";

function webSearchEnabled(): boolean {
  try {
    return localStorage.getItem(WEB_SEARCH_KEY) !== "av";
  } catch {
    return true;
  }
}

function loadHistory(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function ChatApp() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [tier, setTier] = useState<ModelTier>("haiku");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [ppCount, setPpCount] = useState(0);
  const [pending, setPending] = useState<Attachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [webSearch, setWebSearch] = useState(true);

  // Har du noe å betale med? Da skal Opus være det åpenbare valget.
  const hasCredit = ppCount > 0 || (balance !== null && balance > 0);

  // Tips om betalte modeller er bare relevant for den som faktisk chatter
  // gratis uten kreditt. Har du kreditt, eller ikke har spurt om noe, er det
  // bare i veien.
  const [ready, setReady] = useState(false);
  const showUpgradeHint =
    ready && !hasCredit && tier === "haiku" && messages.length > 0;
  const bottomRef = useRef<HTMLDivElement>(null);
  const sentDraft = useRef(false);

  const send = useCallback(
    async (
      question: string,
      attachments: Attachment[],
      history: ChatMessage[],
      activeTier: ModelTier,
    ) => {
      const userMessage: ChatMessage = {
        role: "user",
        content: question,
        ...(attachments.length > 0 ? { attachments } : {}),
      };
      const outgoing = [...history, userMessage];
      setMessages([...outgoing, { role: "assistant", content: "" }]);
      setBusy(true);
      setError(null);

      let assistantText = "";
      const commit = () => {
        setMessages([
          ...outgoing,
          { role: "assistant", content: assistantText },
        ]);
      };

      // Mynter tatt ut for dette svaret. Går kallet galt, legges de tilbake.
      let spentTokens: PpToken[] | null = null;

      try {
        const pow = await fetchAndSolvePow();
        // Betalt nivå: bruk Privacy Pass-mynter hvis vi har nok, ellers koden.
        let code: string | null = null;
        if (isPaidTier(activeTier)) {
          spentTokens = popTokens(tokensFor(activeTier));
          setPpCount(tokenCount());
          if (!spentTokens) {
            try {
              code = localStorage.getItem(CODE_KEY);
            } catch {
              code = null;
            }
          }
        }
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: outgoing.map((m) => ({
              role: m.role,
              content: toApiContent(m),
            })),
            model: activeTier,
            web_search: webSearchEnabled(),
            ...(spentTokens
              ? { pp_tokens: spentTokens }
              : code
                ? { code }
                : {}),
            ...pow,
          }),
        });

        if (!response.ok || !response.body) {
          const data = await response.json().catch(() => null);
          // Serveren avviste før den brukte myntene: ta dem tilbake.
          if (spentTokens) {
            returnTokens(spentTokens);
            spentTokens = null;
            setPpCount(tokenCount());
          }
          setMessages(outgoing);
          setError(data?.error ?? "Noe gikk galt. Prøv igjen.");
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            let event: {
              type: string;
              text?: string;
              message?: string;
              saldo_ore?: number;
            };
            try {
              event = JSON.parse(line.slice(6));
            } catch {
              continue;
            }
            // Saldoen kan følge med både «done» og «error» (refusjon).
            if (typeof event.saldo_ore === "number") {
              setBalance(event.saldo_ore);
              try {
                localStorage.setItem(BALANCE_KEY, String(event.saldo_ore));
              } catch {
                // Ikke kritisk.
              }
            }
            if (event.type === "text" && event.text) {
              assistantText += event.text;
              commit();
            } else if (event.type === "error") {
              setError(event.message ?? "Noe gikk galt. Prøv igjen.");
            }
          }
        }
        if (assistantText.length === 0) {
          setMessages(outgoing);
        } else {
          commit();
          try {
            // Base64-data strippes: kun tekst og vedleggsnavn lagres, så
            // localStorage-kvoten ikke sprenges av bilder.
            localStorage.setItem(
              HISTORY_KEY,
              JSON.stringify(
                stripAttachmentData([
                  ...outgoing,
                  { role: "assistant", content: assistantText },
                ]),
              ),
            );
          } catch {
            // Full localStorage skal ikke stoppe samtalen.
          }
        }
      } catch {
        // Nettverket sviktet, så myntene ble aldri brukt. Ta dem tilbake.
        if (spentTokens) {
          returnTokens(spentTokens);
          setPpCount(tokenCount());
        }
        setMessages(outgoing);
        setError("Fikk ikke kontakt med serveren. Prøv igjen.");
      } finally {
        setBusy(false);
      }
    },
    [],
  );

  // localStorage finnes ikke ved SSR, så historikken må lastes i en effekt
  // etter hydrering. Lazy useState-init ville gitt hydration-mismatch.
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- hydrering fra localStorage */
    const history = loadHistory();
    setMessages(history);
    const storedTier = localStorage.getItem(TIER_KEY);
    const activeTier: ModelTier = isModelTier(storedTier) ? storedTier : "haiku";
    setTier(activeTier);
    const storedBalance = localStorage.getItem(BALANCE_KEY);
    if (storedBalance !== null && !Number.isNaN(Number(storedBalance))) {
      setBalance(Number(storedBalance));
    }
    setPpCount(loadTokens().length);
    setWebSearch(webSearchEnabled());
    setReady(true);
    /* eslint-enable react-hooks/set-state-in-effect */

    // Utkast fra forsiden sendes automatisk (én gang).
    if (!sentDraft.current) {
      sentDraft.current = true;
      let draft: string | null = null;
      try {
        draft = sessionStorage.getItem(DRAFT_KEY);
        sessionStorage.removeItem(DRAFT_KEY);
      } catch {
        draft = null;
      }
      if (draft && draft.trim().length > 0) {
        void send(draft.trim(), [], history, activeTier);
      }
    }
  }, [send]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSubmit() {
    const question = input.trim();
    if ((question.length === 0 && pending.length === 0) || busy) return;
    setInput("");
    setPending([]);
    void send(question, pending, messages, tier);
  }

  async function addFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    const room = MAX_FILES - pending.length;
    if (room <= 0) {
      setError(`Maks ${MAX_FILES} vedlegg om gangen.`);
      return;
    }
    const chosen = Array.from(files).slice(0, room);
    for (const file of chosen) {
      if (!ALLOWED_ATTACHMENT_TYPES[file.type]) {
        setError("Bare bilder (PNG, JPG, GIF, WebP) og PDF støttes.");
        continue;
      }
      try {
        const attachment = await readFileAsAttachment(file);
        setPending((prev) => [...prev, attachment]);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Klarte ikke å legge til filen.",
        );
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removePending(index: number) {
    setPending((prev) => prev.filter((_, i) => i !== index));
  }

  // Vedlegg følger de betalte modellene. Prøver du på gratisnivået, blir det
  // en oppfordring til å velge en betalt modell i stedet for en tom knapp.
  function requestFiles() {
    if (!isPaidTier(tier)) {
      setError(
        "Å lese dokumenter og bilder følger de betalte modellene. Bytt til Sonnet, Opus eller Fable over, fra 1 kr per svar.",
      );
      return;
    }
    setError(null);
    fileInputRef.current?.click();
  }

  function selectTier(next: ModelTier) {
    setTier(next);
    try {
      localStorage.setItem(TIER_KEY, next);
    } catch {
      // Ikke kritisk.
    }
    // Vedlegg virker ikke på gratisnivået; rydd dem hvis man bytter dit.
    if (!isPaidTier(next) && pending.length > 0) {
      setPending([]);
    }
  }

  function toggleWebSearch() {
    const next = !webSearch;
    setWebSearch(next);
    try {
      localStorage.setItem(WEB_SEARCH_KEY, next ? "pa" : "av");
    } catch {
      // Ikke kritisk.
    }
  }

  function clearHistory() {
    setMessages([]);
    setError(null);
    try {
      localStorage.removeItem(HISTORY_KEY);
    } catch {
      // Ikke kritisk.
    }
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 border-b border-line bg-bg/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between gap-3 px-5">
          <Link href="/" className="text-[15px] font-semibold tracking-tight">
            {SITE_NAME}
          </Link>
          <div className="flex items-center gap-2">
            <div
              role="group"
              aria-label="Modellvalg"
              className="flex rounded-(--radius-ctl) border border-line p-0.5 text-[13px]"
            >
              {MODEL_ORDER.map((key) => {
                const model = MODEL_TIERS[key];
                const active = tier === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => selectTier(key)}
                    aria-pressed={active}
                    title={`${model.description} ${
                      model.priceOre === 0
                        ? "Gratis."
                        : `${formatOre(model.priceOre)} per svar.`
                    }`}
                    className={`rounded-[7px] px-2.5 py-1 leading-tight transition ${
                      active
                        ? "bg-surface-2 text-ink"
                        : "text-ink-faint hover:text-ink-dim"
                    }`}
                  >
                    {model.label}
                    <span
                      className={`ml-1.5 hidden font-mono text-[10px] sm:inline ${
                        active ? "text-accent-strong" : "text-ink-faint"
                      }`}
                    >
                      {model.priceOre === 0
                        ? "gratis"
                        : formatOre(model.priceOre)}
                    </span>
                  </button>
                );
              })}
            </div>
            <span className="hidden font-mono text-[12px] text-ink-faint sm:inline">
              {ppCount > 0
                ? `${formatOre(ppCount * TOKEN_VALUE_ORE)} igjen`
                : balance === null
                  ? "Ingen kreditt"
                  : `${formatOre(balance)} igjen`}
            </span>
            <Link
              href="/redeem"
              className="rounded-(--radius-ctl) border border-line-strong px-3 py-1.5 text-[13px] hover:border-accent hover:text-accent-strong"
            >
              Løs inn kode
            </Link>
            <button
              type="button"
              onClick={clearHistory}
              className="rounded-(--radius-ctl) px-3 py-1.5 text-[13px] text-ink-faint hover:bg-surface-2 hover:text-danger"
            >
              Slett historikk
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-5">
        {ready && messages.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4">
            <p className="max-w-sm text-center text-[14px] leading-relaxed text-ink-faint">
              Still et spørsmål. Samtalen lagres kun i din nettleser og kan
              slettes når som helst.
            </p>
            {hasCredit && tier === "haiku" && (
              <button
                type="button"
                onClick={() => selectTier("opus")}
                className="rounded-(--radius-ctl) border border-accent/40 px-4 py-2 text-[13px] text-accent-strong transition active:scale-[0.98] hover:bg-surface"
              >
                Du har kreditt. Bytt til Opus for merkbart bedre svar.
              </button>
            )}
            {isPaidTier(tier) && (
              <p className="font-mono text-[11px] text-ink-faint">
                {MODEL_TIERS[tier].label} koster{" "}
                {formatOre(MODEL_TIERS[tier].priceOre)} per svar
                {ppCount > 0 && ` (${tokensFor(tier)} mynter)`}
              </p>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-5 py-8">
            {messages.map((message, index) =>
              message.role === "user" ? (
                <div
                  key={index}
                  className="self-end max-w-[85%] rounded-card bg-surface-2 px-4 py-3"
                >
                  {message.attachments && message.attachments.length > 0 && (
                    <div className="mb-2 flex flex-wrap gap-2">
                      {message.attachments.map((att, i) =>
                        att.kind === "image" && att.data ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            key={i}
                            src={`data:${att.mediaType};base64,${att.data}`}
                            alt={att.name}
                            className="h-20 w-20 rounded-(--radius-ctl) border border-line object-cover"
                          />
                        ) : (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1.5 rounded-(--radius-ctl) border border-line bg-bg px-2.5 py-1.5 font-mono text-[12px] text-ink-dim"
                          >
                            {att.kind === "document" ? "PDF" : "Bilde"} ·{" "}
                            {att.name}
                          </span>
                        ),
                      )}
                    </div>
                  )}
                  {message.content && (
                    <div className="text-[15px] leading-relaxed whitespace-pre-wrap">
                      {message.content}
                    </div>
                  )}
                </div>
              ) : (
                <div key={index} className="md-body text-[15px] leading-relaxed">
                  {message.content ? (
                    <Markdown remarkPlugins={[remarkGfm]}>
                      {message.content}
                    </Markdown>
                  ) : busy && index === messages.length - 1 ? (
                    <span
                      className="thinking-dots"
                      role="status"
                      aria-label="Skriver svar"
                    >
                      <span />
                      <span />
                      <span />
                    </span>
                  ) : null}
                </div>
              ),
            )}
            <div ref={bottomRef} />
          </div>
        )}
        {error && (
          <p className="pb-3 text-[13px] text-danger" role="alert">
            {error}
          </p>
        )}
      </main>

      <div className="sticky bottom-0 border-t border-line bg-bg">
        {isPaidTier(tier) && (
          <div className="mx-auto max-w-3xl px-5 pt-2">
            <p className="font-mono text-[11px] text-ink-faint">
              {MODEL_TIERS[tier].label} · {formatOre(MODEL_TIERS[tier].priceOre)}{" "}
              per svar
              {ppCount > 0
                ? ` · ${formatOre(ppCount * TOKEN_VALUE_ORE)} igjen`
                : balance !== null
                  ? ` · ${formatOre(balance)} igjen`
                  : ""}
            </p>
          </div>
        )}
        {pending.length > 0 && (
          <div className="mx-auto flex max-w-3xl flex-wrap gap-2 px-5 pt-3">
            {pending.map((att, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-2 rounded-(--radius-ctl) border border-line bg-surface px-2.5 py-1.5 text-[12px] text-ink-dim"
              >
                {att.kind === "image" && att.data ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`data:${att.mediaType};base64,${att.data}`}
                    alt=""
                    className="h-6 w-6 rounded object-cover"
                  />
                ) : (
                  <span className="font-mono text-ink-faint">PDF</span>
                )}
                <span className="max-w-40 truncate">{att.name}</span>
                <button
                  type="button"
                  onClick={() => removePending(i)}
                  aria-label={`Fjern ${att.name}`}
                  className="text-ink-faint hover:text-danger"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          className="mx-auto flex max-w-3xl items-end gap-2 px-5 py-4"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/gif,image/webp,application/pdf"
            multiple
            onChange={(e) => void addFiles(e.target.files)}
            className="hidden"
          />
          <button
            type="button"
            onClick={requestFiles}
            aria-label="Legg ved bilde eller PDF"
            title={
              isPaidTier(tier)
                ? "Legg ved bilde eller PDF"
                : "Vedlegg følger de betalte modellene"
            }
            className={`shrink-0 rounded-(--radius-ctl) border px-3 py-2.5 text-[15px] transition ${
              isPaidTier(tier)
                ? "border-line-strong text-ink-dim hover:border-accent hover:text-accent-strong"
                : "border-line text-ink-faint"
            }`}
          >
            +
          </button>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            rows={1}
            placeholder="Skriv spørsmålet ditt her"
            aria-label="Spørsmål"
            className="max-h-40 min-h-11 w-full resize-none rounded-(--radius-ctl) border border-line-strong bg-surface px-3 py-2.5 text-[15px] leading-relaxed placeholder:text-ink-faint focus:border-accent focus:outline-none"
          />
          <button
            type="button"
            onClick={toggleWebSearch}
            aria-pressed={webSearch}
            title={
              webSearch
                ? "Websøk er på: modellen kan søke på nettet når den trenger fersk informasjon. Søkene gjøres av Anthropic, uten identitet."
                : "Websøk er av: modellen svarer kun fra det den kan fra før."
            }
            className={`shrink-0 rounded-(--radius-ctl) border px-3 py-2.5 font-mono text-[12px] transition ${
              webSearch
                ? "border-accent/40 text-accent-strong"
                : "border-line text-ink-faint hover:text-ink-dim"
            }`}
          >
            {webSearch ? "Websøk på" : "Websøk av"}
          </button>
          <button
            type="submit"
            disabled={
              busy || (input.trim().length === 0 && pending.length === 0)
            }
            className="shrink-0 rounded-(--radius-ctl) bg-accent px-4 py-2.5 text-[14px] font-medium text-accent-ink transition active:scale-[0.98] hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-50"
          >
            Spør
          </button>
        </form>
      </div>

      <UpgradeHint active={showUpgradeHint} />
    </div>
  );
}
