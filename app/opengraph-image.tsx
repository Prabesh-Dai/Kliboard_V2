import { ImageResponse } from "next/og";
import { BRAND } from "@/lib/brand/colors";
import { APP_FONTS, BRAND_FONTS } from "@/lib/brand/fonts";
import { IconTile } from "@/lib/brand/icon-tile";
import { dotPattern } from "@/lib/brand/pattern";
import { SpacePageMock } from "@/lib/brand/space-page-mock";

export const alt = "Kliboard: paste, share, expire. Temporary spaces for text and files.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const host = new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.kliboard.online").host.replace(
  /^www\./,
  ""
);
const TEXT = { body: "#D9D9CB", muted: "#9A9A8E", faint: "#6E6E66" };

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background: BRAND.charcoal,
          fontFamily: "Nunito Sans",
          color: BRAND.cream,
        }}
      >
        <img
          src={dotPattern({
            width: size.width,
            height: size.height,
            gap: 26,
            fadeCenter: [0.2, 0.5],
            fadeRadius: 1.05,
            opacity: 0.16,
          })}
          alt=""
          width={size.width}
          height={size.height}
          style={{ position: "absolute", top: 0, left: 0 }}
        />

        <SpacePageMock host={host} style={{ position: "absolute", top: 92, right: 64, width: 572, height: 620 }} />

        <div
          style={{
            position: "relative",
            width: 520,
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "56px 0 56px 64px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <IconTile size={44} />
            <div style={{ display: "flex", fontFamily: "Gloock", fontSize: 32, letterSpacing: "-0.02em", lineHeight: 1 }}>
              kliboard
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: 23, color: TEXT.muted, marginBottom: 18 }}>
              Need it on another device?
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                fontFamily: "Gloock",
                fontSize: 76,
                lineHeight: 1.04,
                letterSpacing: "-0.025em",
              }}
            >
              <div style={{ display: "flex" }}>Paste. Share.</div>
              <div style={{ display: "flex", color: BRAND.teal }}>Expire.</div>
            </div>
            <div style={{ display: "flex", fontSize: 22, lineHeight: 1.45, color: TEXT.body, marginTop: 24, maxWidth: 440 }}>
              Named spaces for text and files. No signup, and it all deletes itself on time.
            </div>
          </div>

          <div style={{ display: "flex", fontSize: 19, letterSpacing: 1, color: TEXT.faint }}>{host}</div>
        </div>
      </div>
    ),
    { ...size, fonts: [...BRAND_FONTS, ...APP_FONTS] }
  );
}
