import type { QaItem } from "@/lib/faq";

// Native details/summary: fungerer uten JavaScript, og gir tastatur- og
// skjermleserstøtte gratis.
export function FaqAccordion({ items }: { items: QaItem[] }) {
  return (
    <div className="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface">
      {items.map((item) => (
        <details key={item.question} className="group">
          <summary className="flex cursor-pointer list-none items-start justify-between gap-4 p-5 text-[15px] font-medium hover:bg-surface-2 focus-visible:bg-surface-2 [&::-webkit-details-marker]:hidden">
            <span>{item.question}</span>
            <span
              aria-hidden
              className="mt-0.5 shrink-0 text-ink-faint transition-transform group-open:rotate-45"
            >
              +
            </span>
          </summary>
          <div className="space-y-3 px-5 pb-5 text-[14px] leading-relaxed text-ink-dim">
            {item.answer.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        </details>
      ))}
    </div>
  );
}
