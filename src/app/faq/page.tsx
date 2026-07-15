import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { Topbar } from "@/components/Topbar";
import { QA } from "@/lib/faq";

export const metadata: Metadata = {
  title: "Spørsmål og svar",
};
export default function FaqPage() {
  return (
    <>
      <Topbar />
      <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-16">
        <h1 className="text-3xl font-semibold tracking-tighter">
          Spørsmål og svar
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-dim">
          De vanligste innvendingene, besvart så ærlig vi klarer.
        </p>
        <div className="mt-10 space-y-10">
          {QA.map((item) => (
            <section key={item.question}>
              <h2 className="text-[17px] font-semibold tracking-tight">
                {item.question}
              </h2>
              {item.answer.map((paragraph, index) => (
                <p
                  key={index}
                  className="mt-3 text-[15px] leading-relaxed text-ink-dim"
                >
                  {paragraph}
                </p>
              ))}
            </section>
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
