import type { Metadata } from "next";

type Props = {
  params: Promise<{ name: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { name } = await params;

  const description = `View, edit, or share the "${name}" space on Kliboard — a temporary clipboard for text and files that auto-deletes after a set duration. No signup required.`;

  return {
    title: `${name} — Shared Clipboard Space`,
    description,
    openGraph: {
      title: `${name} — Shared Clipboard Space on Kliboard`,
      description,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${name} — Shared Clipboard Space on Kliboard`,
      description,
    },
  };
}

export default function SpaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
