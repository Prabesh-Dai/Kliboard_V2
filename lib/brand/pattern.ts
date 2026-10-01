import { BRAND } from "./colors";

export function dotPattern({
  width,
  height,
  gap,
  cornerRadius = 0,
  fadeCenter = [0.5, 0.45],
  fadeRadius = 0.75,
  opacity = 0.35,
}: {
  width: number;
  height: number;
  gap: number;
  cornerRadius?: number;
  fadeCenter?: [number, number];
  fadeRadius?: number;
  opacity?: number;
}) {
  const dot = gap * 0.18;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><defs><pattern id="p" width="${gap}" height="${gap}" patternUnits="userSpaceOnUse"><circle cx="${gap / 2}" cy="${gap / 2}" r="${dot}" fill="${BRAND.teal}"/></pattern><radialGradient id="g" cx="${fadeCenter[0]}" cy="${fadeCenter[1]}" r="${fadeRadius}"><stop offset="0.25" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff"/></radialGradient><mask id="m"><rect width="${width}" height="${height}" rx="${cornerRadius}" fill="url(#g)"/></mask></defs><rect width="${width}" height="${height}" fill="url(#p)" mask="url(#m)" opacity="${opacity}"/></svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}
