import type { Metadata } from "next";
import { HomeHero } from "@/components/shared/home-hero";
import { HomeStructuredData } from "@/components/shared/structured-data";

export const metadata: Metadata = {
  title: { absolute: "Kliboard: temporary online clipboard" },
  description:
    "Paste text or files into a named space and share the link. It deletes itself when time's up. No account needed.",
};

export default function Home() {
  return (
    <>
      <HomeStructuredData />
      <h1 className="sr-only">
        Kliboard: temporary online clipboard
      </h1>
      <HomeHero />
    </>
  );
}
