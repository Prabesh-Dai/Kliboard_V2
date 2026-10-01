import type { CSSProperties, ReactNode } from "react";
import type { IconNode } from "lucide-react";
import { __iconNode as ellipsisIcon } from "lucide-react/dist/esm/icons/ellipsis-vertical.js";
import { __iconNode as externalLinkIcon } from "lucide-react/dist/esm/icons/external-link.js";
import { __iconNode as fileTextIcon } from "lucide-react/dist/esm/icons/file-text.js";
import { __iconNode as globeIcon } from "lucide-react/dist/esm/icons/globe.js";
import { __iconNode as linkIcon } from "lucide-react/dist/esm/icons/link.js";
import { __iconNode as moonIcon } from "lucide-react/dist/esm/icons/moon.js";
import { __iconNode as notebookPenIcon } from "lucide-react/dist/esm/icons/notebook-pen.js";
import { __iconNode as uploadIcon } from "lucide-react/dist/esm/icons/upload.js";
import { LucideIcon } from "./lucide-icon";

const APP = {
  bg: "#0d0f0f",
  chrome: "#171a1a",
  low: "#111414",
  high: "#1d2020",
  ghost: "rgba(68,73,73,0.38)",
  fg: "#e3e6e6",
  muted: "#a8acab",
  bullet: "#5d6262",
  primary: "#aacfbc",
  primaryDim: "#7ea692",
  onPrimary: "#1a2f23",
};

function Label({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div
      style={{
        display: "flex",
        fontFamily: "Inter",
        fontWeight: 600,
        fontSize: 9,
        letterSpacing: 1.8,
        color: APP.muted,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function LinkChip({ children }: { children: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 8px", borderRadius: 2, background: APP.high }}>
      <LucideIcon node={externalLinkIcon} size={9} color={APP.muted} />
      <Label style={{ letterSpacing: 1 }}>{children}</Label>
    </div>
  );
}

function Bullet({ children, link = false }: { children: string; link?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 9,
        fontSize: 12,
        lineHeight: 1.75,
        color: link ? APP.primary : APP.fg,
      }}
    >
      <div style={{ display: "flex", width: 3.5, height: 3.5, borderRadius: 2, background: APP.bullet }} />
      {children}
    </div>
  );
}

function IconBox({ node, size }: { node: IconNode; size: number }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        borderRadius: size * 0.21,
        background: APP.high,
      }}
    >
      <LucideIcon node={node} size={size * 0.47} color={APP.primary} />
    </div>
  );
}

export function SpacePageMock({ host, style }: { host: string; style?: CSSProperties }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        borderRadius: 12,
        overflow: "hidden",
        background: APP.bg,
        border: "1px solid rgba(227,230,230,0.09)",
        boxShadow: "0 40px 100px -20px rgba(0,0,0,0.85)",
        fontFamily: "Inter",
        color: APP.fg,
        ...style,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", height: 36, padding: "0 14px", background: APP.chrome }}>
        <div style={{ display: "flex", gap: 6, width: 80 }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ display: "flex", width: 9, height: 9, borderRadius: 5, background: "#3a3f3f" }} />
          ))}
        </div>
        <div style={{ display: "flex", flex: 1, justifyContent: "center" }}>
          <div style={{ display: "flex", padding: "5px 14px", borderRadius: 6, background: APP.low, fontSize: 11, color: APP.muted }}>
            {`${host}/space/standup-notes`}
          </div>
        </div>
        <div style={{ display: "flex", width: 80 }} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", padding: "16px 26px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", fontFamily: "Space Grotesk", fontSize: 14, fontWeight: 500 }}>kliboard 2.0</div>
          <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 12, color: APP.muted }}>
            sign in
            <LucideIcon node={moonIcon} size={13} color={APP.muted} />
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginTop: 26 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, paddingTop: 4 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <LucideIcon node={globeIcon} size={10} color={APP.muted} />
              <Label>PUBLIC</Label>
            </div>
            <div
              style={{
                display: "flex",
                fontFamily: "Space Grotesk",
                fontWeight: 500,
                fontSize: 29,
                letterSpacing: "-0.02em",
                lineHeight: 1,
              }}
            >
              standup-notes
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, padding: "9px 14px", borderRadius: 8, background: APP.low }}>
            <Label style={{ fontSize: 8, letterSpacing: 1.6 }}>TIME UNTIL DELETION</Label>
            <div style={{ display: "flex", fontFamily: "Space Grotesk", fontWeight: 500, fontSize: 17, color: APP.primary }}>
              4h 12m
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, marginTop: 22 }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              padding: "12px 16px 14px",
              borderRadius: 8,
              background: APP.low,
              border: `1px solid ${APP.ghost}`,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <LucideIcon node={notebookPenIcon} size={12} color={APP.muted} />
                <div style={{ display: "flex", fontFamily: "Space Grotesk", fontWeight: 500, fontSize: 12.5 }}>Add Note</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Label style={{ fontSize: 8.5, letterSpacing: 1 }}>PREVIEW</Label>
                <LucideIcon node={linkIcon} size={12} color={APP.muted} />
                <LucideIcon node={ellipsisIcon} size={12} color={APP.muted} />
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", marginTop: 14 }}>
              <div style={{ display: "flex", fontFamily: "Space Grotesk", fontWeight: 500, fontSize: 15, letterSpacing: "-0.01em" }}>
                Thursday standup
              </div>
              <div style={{ display: "flex", fontSize: 12, marginTop: 6 }}>Notes for the team. Gone by tonight.</div>
              <div style={{ display: "flex", height: 1, background: APP.ghost, margin: "11px 0 7px" }} />
              <Bullet>Ship the new splash screens</Bullet>
              <Bullet>Fix the upload progress bar</Bullet>
              <Bullet link>github.com/kliboard/pull/42</Bullet>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 16 }}>
              <div style={{ display: "flex", gap: 6 }}>
                <LinkChip>GITHUB.COM</LinkChip>
                <LinkChip>FIGMA.COM</LinkChip>
              </div>
              <div
                style={{
                  display: "flex",
                  padding: "7px 12px",
                  borderRadius: 2,
                  backgroundImage: `linear-gradient(135deg, ${APP.primary}, ${APP.primaryDim})`,
                  fontWeight: 600,
                  fontSize: 9,
                  letterSpacing: 1.4,
                  color: APP.onPrimary,
                }}
              >
                SAVE NOTE
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              width: 140,
              borderRadius: 8,
              background: APP.low,
              border: `1px solid ${APP.ghost}`,
            }}
          >
            <IconBox node={uploadIcon} size={32} />
            <div style={{ display: "flex", fontFamily: "Space Grotesk", fontWeight: 500, fontSize: 12 }}>Upload files</div>
            <div style={{ display: "flex", fontSize: 9.5, color: APP.muted }}>Drag & drop or browse</div>
          </div>
        </div>

        <Label style={{ marginTop: 24, letterSpacing: 2.4 }}>STORED ITEMS</Label>
        <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
          <div style={{ display: "flex", flexDirection: "column", width: 150, borderRadius: 8, overflow: "hidden", background: APP.low }}>
            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                height: 96,
                padding: 7,
                backgroundImage:
                  "radial-gradient(circle at 70% 30%, #4f8a76 0%, rgba(79,138,118,0) 55%), radial-gradient(circle at 20% 90%, #2c5a4d 0%, rgba(44,90,77,0) 60%), linear-gradient(135deg, #1b2b27, #0f1716)",
              }}
            >
              <div style={{ display: "flex", padding: "2px 5px", borderRadius: 2, background: "rgba(0,0,0,0.45)", fontSize: 8 }}>
                1.2 MB
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 3, padding: "8px 10px" }}>
              <div style={{ display: "flex", fontSize: 11 }}>mockup.png</div>
              <Label style={{ fontSize: 7.5, letterSpacing: 1.2, fontWeight: 400 }}>2 MINS AGO</Label>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, width: 150, padding: 12, borderRadius: 8, background: APP.low }}>
            <IconBox node={fileTextIcon} size={30} />
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <div style={{ display: "flex", fontSize: 11 }}>brief.pdf</div>
              <Label style={{ fontSize: 7.5, letterSpacing: 1.2, fontWeight: 400 }}>4.8 MB</Label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
