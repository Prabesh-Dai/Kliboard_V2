import type { Metadata } from "next";
import { HomeHero } from "@/components/shared/home-hero";
import { HomeStructuredData } from "@/components/shared/structured-data";

export const metadata: Metadata = {
  title: "Kliboard: Temporary Text Clipboard with Auto-Expiring Notes",
  description:
    "Create a named space, paste any text or files, and share the link instantly. Everything auto-deletes after your chosen duration. No signup, no tracking.",
};

export default function Home() {
  return (
    <>
      <HomeStructuredData />
      <h1 className="sr-only">
        Kliboard: Temporary Text Clipboard with Auto-Expiring Notes
      </h1>
      <HomeHero />
    </>
  );
}
