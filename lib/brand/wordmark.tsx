import { SCHEMES, type Scheme } from "./colors";

export const TAGLINE = "PASTE. SHARE. EXPIRE.";

export function Wordmark({ size, scheme = "dark" }: { size: number; scheme?: Scheme }) {
  const colors = SCHEMES[scheme];
  const taglineSize = size * 0.19;
  const tracking = taglineSize * 0.22;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
      <div
        style={{
          display: "flex",
          fontFamily: "Gloock",
          fontSize: size,
          lineHeight: 1,
          letterSpacing: "-0.03em",
          color: colors.wordmark,
        }}
      >
        kliboard
      </div>
      <div
        style={{
          display: "flex",
          fontFamily: "Nunito Sans",
          fontWeight: 500,
          fontSize: taglineSize,
          lineHeight: 1,
          letterSpacing: tracking,
          marginRight: -tracking,
          marginTop: size * 0.1,
          color: colors.tagline,
        }}
      >
        {TAGLINE}
      </div>
    </div>
  );
}
