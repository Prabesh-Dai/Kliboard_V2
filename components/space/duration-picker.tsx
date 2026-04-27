"use client";

import { Lock } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
} from "@/components/ui/select";
import {
  DURATION_OPTIONS,
  ADMIN_DURATION_OPTIONS,
  MAX_ANON_DURATION_MINUTES,
} from "@/lib/constants";
import { AnimatedClock } from "@/components/space/animated-clock";

interface DurationPickerProps {
  value: number;
  onChange: (value: number) => void;
  compact?: boolean;
  iconOnly?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  isAdmin?: boolean;
  isAnon?: boolean;
}

export function DurationPicker({
  value,
  onChange,
  compact,
  iconOnly,
  open,
  onOpenChange,
  isAdmin: isAdminUser,
  isAnon,
}: DurationPickerProps) {
  const options = isAdminUser ? ADMIN_DURATION_OPTIONS : DURATION_OPTIONS;
  const selectedLabel =
    options.find((o) => o.value === value)?.label ?? "Expiration";

  return (
    <Select
      value={String(value)}
      onValueChange={(v) => onChange(Number(v))}
      open={open}
      onOpenChange={onOpenChange}
    >
      <SelectTrigger
        className={
          iconOnly
            ? "flex w-9 cursor-pointer items-center justify-center self-center rounded-md border-0 bg-transparent p-0 text-primary shadow-none transition-colors hover:text-primary/80 [&>svg:last-child]:hidden" : compact
              ? "h-8 w-32.5 gap-1 rounded-md border-0 bg-surface-container-high px-3 text-sm"
              : "w-45"
        }
        size="sm"
      >
        {iconOnly ? (
          <AnimatedClock className="size-7" />
        ) : (
          <span>{selectedLabel}</span>
        )}
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false}>
        {(() => {
          const activeOptions = isAnon
            ? options.filter((o) => o.value <= MAX_ANON_DURATION_MINUTES)
            : options;
          const lockedOptions = isAnon
            ? options.filter((o) => o.value > MAX_ANON_DURATION_MINUTES)
            : [];
          return (
            <>
              {activeOptions.map((option) => (
                <SelectItem key={option.value} value={String(option.value)}>
                  <span className="flex flex-1 items-center">
                    {option.label}
                  </span>
                </SelectItem>
              ))}
              {lockedOptions.length > 0 && <SelectSeparator />}
              {lockedOptions.map((option) => (
                <SelectItem
                  key={option.value}
                  value={String(option.value)}
                  disabled
                >
                  <span className="flex flex-1 items-center justify-between gap-3">
                    <span>{option.label}</span>
                    <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                      <Lock />
                      Sign in
                    </span>
                  </span>
                </SelectItem>
              ))}
            </>
          );
        })()}
      </SelectContent>
    </Select>
  );
}
