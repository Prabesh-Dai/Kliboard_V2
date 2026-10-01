export const BRAND = {
  charcoal: "#111111",
  cream: "#FEFED5",
  teal: "#35D0BA",
  tileFrom: "#2A2B2B",
  tileTo: "#141515",
} as const;

export const SCHEMES = {
  light: { bg: "#f5f5f4", wordmark: "#1c1c1c", tagline: "#11806f" },
  dark: { bg: "#0d0f0f", wordmark: BRAND.cream, tagline: BRAND.teal },
} as const;

export type Scheme = keyof typeof SCHEMES;
