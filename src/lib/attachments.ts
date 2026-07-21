// Vedlegg i chatten: bilder og PDF. Filen leses i nettleseren, base64-kodes og
// sendes med meldingen. Serveren streamer den gjennom til modellen uten å
// lagre noe, akkurat som teksten.

export const ALLOWED_ATTACHMENT_TYPES: Record<string, "image" | "document"> = {
  "image/png": "image",
  "image/jpeg": "image",
  "image/gif": "image",
  "image/webp": "image",
  "application/pdf": "document",
};

export const MAX_FILES = 5;
export const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB

export type Attachment = {
  name: string;
  kind: "image" | "document";
  mediaType: string;
  data: string; // base64 uten data:-prefiks. Tom etter reload (kun metadata).
};

/** API-innholdsblokk slik Anthropic forventer den. */
export type ApiBlock =
  | { type: "text"; text: string }
  | {
      type: "image" | "document";
      source: { type: "base64"; media_type: string; data: string };
    };

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  attachments?: Attachment[];
};

/** Leser en fil til base64 (uten data:-prefiks). Kaster ved for stor/ugyldig. */
export function readFileAsAttachment(file: File): Promise<Attachment> {
  const kind = ALLOWED_ATTACHMENT_TYPES[file.type];
  if (!kind) {
    return Promise.reject(new Error("Filtypen støttes ikke."));
  }
  if (file.size > MAX_FILE_BYTES) {
    return Promise.reject(new Error("Filen er for stor (maks 5 MB)."));
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Klarte ikke å lese filen."));
    reader.onload = () => {
      const result = String(reader.result);
      const comma = result.indexOf(",");
      resolve({
        name: file.name,
        kind,
        mediaType: file.type,
        data: comma >= 0 ? result.slice(comma + 1) : result,
      });
    };
    reader.readAsDataURL(file);
  });
}

/** Bygger API-innhold for én melding: vedlegg først, så teksten. */
export function toApiContent(msg: ChatMessage): string | ApiBlock[] {
  const usable = (msg.attachments ?? []).filter((a) => a.data.length > 0);
  if (usable.length === 0) return msg.content;

  const blocks: ApiBlock[] = usable.map((a) => ({
    type: a.kind,
    source: { type: "base64", media_type: a.mediaType, data: a.data },
  }));
  if (msg.content.length > 0) {
    blocks.push({ type: "text", text: msg.content });
  }
  return blocks;
}

/** Fjerner base64-data før lagring i localStorage, så kvoten ikke sprenges. */
export function stripAttachmentData(messages: ChatMessage[]): ChatMessage[] {
  return messages.map((m) =>
    m.attachments && m.attachments.length > 0
      ? { ...m, attachments: m.attachments.map((a) => ({ ...a, data: "" })) }
      : m,
  );
}
