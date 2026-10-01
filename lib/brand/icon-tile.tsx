import type { CSSProperties } from "react";
import { BRAND } from "./colors";
import { dotPattern } from "./pattern";

export type TileVariant = "rounded" | "square" | "maskable" | "favicon";

const VARIANTS: Record<TileVariant, { glyph: number; radius: number; pattern: boolean }> = {
  rounded: { glyph: 0.66, radius: 0.225, pattern: true },
  square: { glyph: 0.66, radius: 0, pattern: true },
  maskable: { glyph: 0.56, radius: 0, pattern: true },
  favicon: { glyph: 0.9, radius: 0.2, pattern: false },
};

const CAST_SHADOW = { x: 0.11, y: 0.14, blur: 0.08, opacity: 0.7 };
const CONTACT_SHADOW = { x: 0.01, y: 0.016, blur: 0.012, opacity: 0.75 };

export function tileRadius(size: number, variant: TileVariant = "rounded") {
  return size * VARIANTS[variant].radius;
}

export function tileShadow(size: number) {
  return `0 ${size * 0.05}px ${size * 0.14}px rgba(0,0,0,0.3)`;
}

export function IconTile({
  size,
  variant = "rounded",
  elevated = false,
}: {
  size: number;
  variant?: TileVariant;
  elevated?: boolean;
}) {
  const { glyph, pattern } = VARIANTS[variant];
  const borderRadius = tileRadius(size, variant);

  const letter = (style: CSSProperties) => (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        paddingRight: size * 0.03,
        paddingBottom: size * 0.04,
        fontFamily: "Gloock",
        fontSize: size * glyph,
        lineHeight: 1,
        ...style,
      }}
    >
      k
    </div>
  );

  const shadow = ({ x, y, blur, opacity }: typeof CAST_SHADOW) =>
    letter({
      color: "#000",
      opacity,
      transform: `translate(${size * x}px, ${size * y}px)`,
      filter: `blur(${size * blur}px)`,
    });

  return (
    <div
      style={{
        width: size,
        height: size,
        display: "flex",
        position: "relative",
        overflow: "hidden",
        borderRadius,
        backgroundImage: `linear-gradient(135deg, ${BRAND.tileFrom} 0%, ${BRAND.tileTo} 100%)`,
        ...(elevated && { boxShadow: tileShadow(size) }),
      }}
    >
      {pattern && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={dotPattern({ width: size, height: size, gap: size * 0.05, cornerRadius: borderRadius })}
          alt=""
          width={size}
          height={size}
          style={{ position: "absolute", top: 0, left: 0 }}
        />
      )}
      {shadow(CAST_SHADOW)}
      {shadow(CONTACT_SHADOW)}
      {letter({ color: BRAND.cream })}
    </div>
  );
}
