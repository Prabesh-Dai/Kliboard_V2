"use client";

const URL_REGEX = /https?:\/\/[^\s<>'")\]]+/g;

interface LinkDetectorProps {
  text: string;
}

export function LinkDetector({ text }: LinkDetectorProps) {
  const parts: (string | { url: string; key: number })[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let keyCounter = 0;

  const regex = new RegExp(URL_REGEX);
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    parts.push({ url: match[0], key: keyCounter++ });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return (
    <>
      {parts.map((part) =>
        typeof part === "string" ? (
          part
        ) : (
          <a
            key={part.key}
            href={part.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline underline-offset-2 hover:text-primary/80"
          >
            {part.url}
          </a>
        )
      )}
    </>
  );
}
