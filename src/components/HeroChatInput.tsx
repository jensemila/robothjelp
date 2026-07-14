"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { DRAFT_KEY } from "@/lib/draft";

export function HeroChatInput() {
  const router = useRouter();
  const [value, setValue] = useState("");

  function submit() {
    const question = value.trim();
    if (question.length > 0) {
      try {
        sessionStorage.setItem(DRAFT_KEY, question);
      } catch {
        // Uten sessionStorage går brukeren bare til tom chat.
      }
    }
    router.push("/chat");
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="mx-auto w-full max-w-2xl"
    >
      <div className="flex items-end gap-2 rounded-card border border-line-strong bg-surface p-2 focus-within:border-accent">
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          rows={2}
          placeholder="Skriv spørsmålet ditt her"
          aria-label="Spørsmål"
          className="max-h-40 min-h-14 w-full resize-none bg-transparent px-3 py-2 text-[15px] leading-relaxed placeholder:text-ink-faint focus:outline-none"
        />
        <button
          type="submit"
          className="shrink-0 rounded-(--radius-ctl) bg-accent px-4 py-2.5 text-[14px] font-medium text-accent-ink transition active:scale-[0.98] hover:bg-accent-strong"
        >
          Spør
        </button>
      </div>
      <p className="mt-3 text-center font-mono text-[12px] text-ink-faint">
        Gratis med Haiku-modellen, helt uten registrering
      </p>
    </form>
  );
}
