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
          Kreditt gir tilgang til Opus, den beste modellen på markedet.
          Saldoen trekkes per svar, for tiden 2 kr per svar.
        </p>
        <div className="mt-10">
          <BuyForm />
        </div>
      </main>
      <Footer />
    </>
  );
}
