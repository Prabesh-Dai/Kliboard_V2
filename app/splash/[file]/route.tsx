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

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ file: string }> }
) {
  const { file } = await params;
  const screen = SPLASH_SCREENS.find((s) => s.file === file);
  if (!screen) return new Response("Not found", { status: 404 });

  const { width, height, scheme } = screen;
  const unit = Math.min(width, height);

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
        <IconTile size={Math.round(unit * 0.28)} elevated />
        <Wordmark size={Math.round(unit * 0.11)} scheme={scheme} />
      </div>
    ),
    { width, height, fonts: BRAND_FONTS }
  );
}
