import { ImageResponse } from "next/og";
import { SCHEMES } from "@/lib/brand/colors";
import { BRAND_FONTS } from "@/lib/brand/fonts";
import { IconTile } from "@/lib/brand/icon-tile";
import { SPLASH_SCREENS } from "@/lib/brand/splash-screens";
import { Wordmark } from "@/lib/brand/wordmark";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return SPLASH_SCREENS.map(({ file }) => ({ file }));
}

// Satori applies the tile's blur and shadow filters across the whole canvas, which made
// each large splash take seconds. Rendering the tile on its own small canvas keeps it cheap.
async function tileImage(size: number) {
  const pad = Math.ceil(size * 0.25);
  const outer = size + pad * 2;
  const res = new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <IconTile size={size} elevated />
      </div>
    ),
    { width: outer, height: outer, fonts: BRAND_FONTS }
  );
  const src = `data:image/png;base64,${Buffer.from(await res.arrayBuffer()).toString("base64")}`;
  return { src, pad, outer };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ file: string }> }
) {
  const { file } = await params;
  const screen = SPLASH_SCREENS.find((s) => s.file === file);
  if (!screen) return new Response("Not found", { status: 404 });

  const { width, height, scheme } = screen;
  const unit = Math.min(width, height);
  const tileSize = Math.round(unit * 0.28);
  const tile = await tileImage(tileSize);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: Math.round(unit * 0.09),
          background: SCHEMES[scheme].bg,
        }}
      >
        <div style={{ display: "flex", position: "relative", width: tileSize, height: tileSize }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={tile.src}
            alt=""
            width={tile.outer}
            height={tile.outer}
            style={{ position: "absolute", top: -tile.pad, left: -tile.pad }}
          />
        </div>
        <Wordmark size={Math.round(unit * 0.11)} scheme={scheme} />
      </div>
    ),
    { width, height, fonts: BRAND_FONTS }
  );
}
