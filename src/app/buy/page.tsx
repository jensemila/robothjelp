import type { Metadata } from "next";
import { BuyForm } from "@/components/BuyForm";
import { Footer } from "@/components/Footer";
import { Topbar } from "@/components/Topbar";

export const metadata: Metadata = {
  title: "Kjøp kreditt",
};

export default function BuyPage() {
  return (
    <>
      <Topbar />
      <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-16">
        <h1 className="text-3xl font-semibold tracking-tighter">
          Kjøp kreditt
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-dim">
          Kreditt gir tilgang til de betalte modellene. Du velger selv hvilken
          du vil bruke, og saldoen trekkes per svar: Sonnet 1 kr, Opus 2 kr,
          Fable 5 kr. Haiku er alltid gratis.
        </p>
        <div className="mt-10">
          <BuyForm />
        </div>
      </main>
      <Footer />
    </>
  );
}
