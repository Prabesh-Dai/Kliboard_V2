"use client";

import { Globe, Lock } from "lucide-react";

interface VisibilityToggleProps {
  isPrivate: boolean;
  onChange: (isPrivate: boolean) => void;
}

export function VisibilityToggle({
  isPrivate,
  onChange,
}: VisibilityToggleProps) {
  return (
    <div className="flex items-center self-stretch px-3">
      <div className="flex items-center rounded-md bg-surface-container-high p-0.5">
        <button
          type="button"
          onClick={() => onChange(false)}
          className={`flex size-7 items-center justify-center rounded-sm transition-all ${
            !isPrivate
              ? "bg-surface-container text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Globe className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onChange(true)}
          className={`flex size-7 items-center justify-center rounded-sm transition-all ${
            isPrivate
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Lock className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
