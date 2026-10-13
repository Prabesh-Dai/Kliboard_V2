import type { Metadata } from "next";

type Props = {
  params: Promise<{ name: string }>;
};

const SHARE_IMAGE = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: "Kliboard: paste, share, expire. Temporary spaces for text and files.",
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { name } = await params;

  const description = `Open "${name}" on Kliboard, a temporary clipboard for text and files.`;
  const shareTitle = `${name} on Kliboard`;

  return {
    title: name,
    description,
    openGraph: {
      title: shareTitle,
      description,
      url: `/space/${name}`,
      siteName: "Kliboard",
      type: "website",
      images: [SHARE_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: shareTitle,
      description,
      images: [SHARE_IMAGE],
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
