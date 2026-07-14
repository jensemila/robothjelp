import type { Metadata } from "next";
import { Suspense } from "react";
import { ClaimCode } from "@/components/ClaimCode";
import { Footer } from "@/components/Footer";
import { Topbar } from "@/components/Topbar";

export const metadata: Metadata = {
  title: "Hent koden din",
};

export default function BuyCompletePage() {
  return (
    <>
      <Topbar />
      <main className="mx-auto w-full max-w-xl flex-1 px-5 py-16">
        <h1 className="text-3xl font-semibold tracking-tighter">
          Hent koden din
        </h1>
        <div className="mt-8">
          <Suspense fallback={null}>
            <ClaimCode />
          </Suspense>
        </div>
      </main>
      <Footer />
    </>
  );
}
