import { HomeHero } from "@/components/shared/home-hero";
import { HomeStructuredData } from "@/components/shared/structured-data";

export default function Home() {
  return (
    <>
      <HomeStructuredData />
      <h1 className="sr-only">
        Kliboard — Temporary Text Clipboard with Auto-Expiring Notes
      </h1>
      <HomeHero />
    </>
  );
}
