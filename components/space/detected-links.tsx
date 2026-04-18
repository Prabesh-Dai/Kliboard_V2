"use client";

import { useMemo } from "react";
import { ExternalLink, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

const URL_REGEX = /https?:\/\/[^\s<>'")\]]+/g;

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function dedupeUrls(urls: string[]): string[] {
  const seen = new Set<string>();
  return urls.filter((url) => {
    if (seen.has(url)) return false;
    seen.add(url);
    return true;
  });
}

interface DetectedLinksProps {
  content: string;
}

export function DetectedLinks({ content }: DetectedLinksProps) {
  const urls = useMemo(() => dedupeUrls(content.match(URL_REGEX) ?? []), [content]);

  if (urls.length === 0) return null;

  const visible = urls.slice(0, 2);
  const overflow = urls.slice(2);

  const chipClass =
    "flex items-center gap-1.5 rounded-sm bg-surface-container-high px-2.5 py-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground transition-colors hover:bg-surface-container-highest hover:text-foreground";

  return (
    <div className="absolute bottom-0 left-0 flex items-center gap-1.5">
      {/* Desktop: inline chips for first 2 links */}
      {visible.map((url) => (
        <a
          key={url}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className={`hidden sm:flex ${chipClass}`}
        >
          <ExternalLink className="h-3 w-3 shrink-0" />
          <span className="max-w-32 truncate">{extractDomain(url)}</span>
        </a>
      ))}

      {/* Desktop: overflow dropdown (only when >2 links) */}
      {overflow.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger className={`hidden cursor-pointer sm:flex ${chipClass}`}>
            +{overflow.length} more
            <ChevronDown className="h-3 w-3" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="top" sideOffset={6} className="w-max max-w-40">
            {overflow.map((url) => (
              <DropdownMenuItem
                key={url}
                className="cursor-pointer"
                onSelect={() => window.open(url, "_blank", "noopener,noreferrer")}
              >
                <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="truncate">{extractDomain(url)}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Mobile: single dropdown with all links */}
      <DropdownMenu>
        <DropdownMenuTrigger className={`cursor-pointer sm:hidden ${chipClass}`}>
          <ExternalLink className="h-3 w-3 shrink-0" />
          {urls.length} {urls.length === 1 ? "link" : "links"}
          <ChevronDown className="h-3 w-3" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" side="top" sideOffset={6} className="w-max max-w-40">
          {urls.map((url) => (
            <DropdownMenuItem
              key={url}
              className="cursor-pointer"
              onSelect={() => window.open(url, "_blank", "noopener,noreferrer")}
            >
              <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="truncate">{extractDomain(url)}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
