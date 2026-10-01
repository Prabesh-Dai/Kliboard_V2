import { ImageResponse } from "next/og";
import { BRAND_FONTS } from "@/lib/brand/fonts";
import { IconTile, type TileVariant } from "@/lib/brand/icon-tile";

export const dynamic = "force-static";
export const dynamicParams = false;

const ICONS: { file: string; size: number; variant: TileVariant }[] = [
  { file: "favicon-32.png", size: 32, variant: "favicon" },
  { file: "icon-192.png", size: 192, variant: "rounded" },
  { file: "icon-512.png", size: 512, variant: "rounded" },
  { file: "icon-maskable-192.png", size: 192, variant: "maskable" },
  { file: "icon-maskable-512.png", size: 512, variant: "maskable" },
  { file: "apple-touch-icon.png", size: 180, variant: "square" },
];

export function generateStaticParams() {
  return ICONS.map(({ file }) => ({ file }));
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ file: string }> }
) {
  const { file } = await params;
  const icon = ICONS.find((i) => i.file === file);
  if (!icon) return new Response("Not found", { status: 404 });

  return new ImageResponse(<IconTile size={icon.size} variant={icon.variant} />, {
    width: icon.size,
    height: icon.size,
    fonts: BRAND_FONTS,
  });
}
