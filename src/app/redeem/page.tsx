import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { RedeemForm } from "@/components/RedeemForm";
import { Topbar } from "@/components/Topbar";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  description:
    "Løs inn en anonym kredittkode og ta i bruk de betalte modellene. Vi vet ikke hvem koden tilhører, og det er hele poenget.",
  alternates: { canonical: `${SITE_URL}/redeem` },
  title: "Løs inn kode",
};

export default function RedeemPage() {
  return (
    <>
      <Topbar />
      <main className="mx-auto w-full max-w-xl flex-1 px-5 py-16">
        <h1 className="text-3xl font-semibold tracking-tighter">
          Løs inn kredittkode
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-dim">
          Lim inn koden du fikk ved kjøp. Vi vet ikke hvem som eier koden, og
          det er hele poenget.
        </p>
        <div className="mt-8">
          <RedeemForm />
        </div>
      </main>
      <Footer />
    </>
  );
}
