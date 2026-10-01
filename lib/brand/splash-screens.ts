import type { Scheme } from "./colors";

// iOS ignores the manifest for launch screens: it needs one image per device
// resolution, matched by media query. Android builds its splash from the manifest.
type Device = { width: number; height: number; dpr: number; tablet?: boolean };

const DEVICES: Device[] = [
  { width: 440, height: 956, dpr: 3 }, // iPhone 16/17 Pro Max
  { width: 430, height: 932, dpr: 3 }, // iPhone 14 Pro Max, 15/15 Pro Max, 15/16 Plus
  { width: 428, height: 926, dpr: 3 }, // iPhone 12/13 Pro Max, 14 Plus
  { width: 420, height: 912, dpr: 3 }, // iPhone Air
  { width: 414, height: 896, dpr: 3 }, // iPhone XS Max, 11 Pro Max
  { width: 414, height: 896, dpr: 2 }, // iPhone XR, 11
  { width: 414, height: 736, dpr: 3 }, // iPhone 6/7/8 Plus
  { width: 402, height: 874, dpr: 3 }, // iPhone 16 Pro, 17, 17 Pro
  { width: 393, height: 852, dpr: 3 }, // iPhone 14 Pro, 15, 15 Pro, 16
  { width: 390, height: 844, dpr: 3 }, // iPhone 12, 13, 14, 16e
  { width: 375, height: 812, dpr: 3 }, // iPhone X, XS, 11 Pro, 12/13 mini
  { width: 375, height: 667, dpr: 2 }, // iPhone 6/7/8, SE 2nd/3rd gen
  { width: 320, height: 568, dpr: 2 }, // iPhone SE 1st gen
  { width: 1032, height: 1376, dpr: 2, tablet: true }, // iPad Pro 13" (M4)
  { width: 1024, height: 1366, dpr: 2, tablet: true }, // iPad Pro 12.9"
  { width: 834, height: 1210, dpr: 2, tablet: true }, // iPad Pro 11" (M4)
  { width: 834, height: 1194, dpr: 2, tablet: true }, // iPad Pro 11"
  { width: 820, height: 1180, dpr: 2, tablet: true }, // iPad Air 10.9", iPad 10th gen
  { width: 834, height: 1112, dpr: 2, tablet: true }, // iPad Air 10.5", Pro 10.5"
  { width: 810, height: 1080, dpr: 2, tablet: true }, // iPad 10.2"
  { width: 768, height: 1024, dpr: 2, tablet: true }, // iPad mini 5, iPad 9.7"
  { width: 744, height: 1133, dpr: 2, tablet: true }, // iPad mini 6+
];

export type SplashScreen = {
  file: string;
  width: number;
  height: number;
  scheme: Scheme;
  media: string;
};

export const SPLASH_SCREENS: SplashScreen[] = DEVICES.flatMap(({ width, height, dpr, tablet }) => {
  const orientations = tablet ? (["portrait", "landscape"] as const) : (["portrait"] as const);
  return orientations.flatMap((orientation) => {
    const [pw, ph] =
      orientation === "portrait" ? [width * dpr, height * dpr] : [height * dpr, width * dpr];
    return (["light", "dark"] as const).map((scheme) => ({
      file: `${pw}x${ph}-${scheme}.png`,
      width: pw,
      height: ph,
      scheme,
      media: `(device-width: ${width}px) and (device-height: ${height}px) and (-webkit-device-pixel-ratio: ${dpr}) and (orientation: ${orientation}) and (prefers-color-scheme: ${scheme})`,
    }));
  });
});
