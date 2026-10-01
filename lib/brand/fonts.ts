import { readFileSync } from "node:fs";
import path from "node:path";

const dir = path.join(process.cwd(), "lib", "brand", "fonts");

function font(name: string, file: string, weight: 400 | 500 | 600) {
  return { name, data: readFileSync(path.join(dir, file)), weight, style: "normal" as const };
}

export const BRAND_FONTS = [
  font("Gloock", "Gloock-Regular.ttf", 400),
  font("Nunito Sans", "NunitoSans-Medium.ttf", 500),
];

export const APP_FONTS = [
  font("Inter", "Inter-Regular.ttf", 400),
  font("Inter", "Inter-SemiBold.ttf", 600),
  font("Space Grotesk", "SpaceGrotesk-Medium.ttf", 500),
];
