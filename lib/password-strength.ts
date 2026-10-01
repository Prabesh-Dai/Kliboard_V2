import { MIN_SPACE_PASSWORD_LENGTH } from "@/lib/constants";

const WEAK_PATTERNS = [
  "password",
  "letmein",
  "qwerty",
  "111111",
  "123456",
  "abc123",
  "iloveyou",
  "admin",
  "welcome",
  "monkey",
  "dragon",
  "kliboard",
];

export interface PasswordStrength {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
  hint: string;
  acceptable: boolean;
}

export function scorePassword(password: string): PasswordStrength {
  if (!password) {
    return { score: 0, label: "", hint: "", acceptable: false };
  }

  const lower = password.toLowerCase();
  const tooShort = password.length < MIN_SPACE_PASSWORD_LENGTH;
  const isWeakPattern = WEAK_PATTERNS.some((weak) => lower.includes(weak));
  const isRepetitive = /^(.)\1+$/.test(password) || /^(..)\1+$/.test(password);

  if (tooShort) {
    return {
      score: 0,
      label: "Too short",
      hint: `Use at least ${MIN_SPACE_PASSWORD_LENGTH} characters`,
      acceptable: false,
    };
  }

  if (isWeakPattern || isRepetitive) {
    return {
      score: 1,
      label: "Guessable",
      hint: "Avoid common words and repeated patterns",
      acceptable: false,
    };
  }

  const classes = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^a-zA-Z0-9]/].filter((re) =>
    re.test(password)
  ).length;
  const lengthBonus =
    password.length >= 20 ? 2 : password.length >= 16 ? 1 : 0;
  const raw = classes + lengthBonus;

  if (raw >= 5) {
    return { score: 4, label: "Strong", hint: "", acceptable: true };
  }
  if (raw >= 3) {
    return { score: 3, label: "Good", hint: "", acceptable: true };
  }
  return {
    score: 2,
    label: "Fair",
    hint: "Longer passphrases beat short complex ones",
    acceptable: true,
  };
}

export function generatePassphrase(): string {
  const alphabet =
    "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  let out = "";
  for (let i = 0; i < bytes.length; i++) {
    if (i > 0 && i % 6 === 0) out += "-";
    out += alphabet[bytes[i] % alphabet.length];
  }
  return out;
}
