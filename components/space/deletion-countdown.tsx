"use client";

import { useEffect, useRef, useState } from "react";
import { DurationPicker } from "@/components/space/duration-picker";
import { DURATION_OPTIONS, ADMIN_DURATION_OPTIONS } from "@/lib/constants";

interface DeletionCountdownProps {
  countdown: string;
  isSaved: boolean;
  duration: number;
  onDurationChange?: (value: number) => void;
  isAdmin?: boolean;
  isAnon?: boolean;
}

export function DeletionCountdown({
  countdown,
  isSaved,
  duration,
  onDurationChange,
  isAdmin: isAdminUser,
  isAnon,
}: DeletionCountdownProps) {
  const options = isAdminUser ? ADMIN_DURATION_OPTIONS : DURATION_OPTIONS;
  const durationLabel =
    options.find((o) => o.value === duration)?.label ?? "";

  const [showFlash, setShowFlash] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const flashTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (!isSaved) return;
    setShowFlash(true);
    clearTimeout(flashTimeout.current);
    flashTimeout.current = setTimeout(() => setShowFlash(false), 2000);
    return () => clearTimeout(flashTimeout.current);
  }, [duration, isSaved]);

  const isUnlimited = duration === 0;
  const showDuration = !isSaved || showFlash;

  const interactive = Boolean(onDurationChange);

  return (
    <div
      className={`flex items-stretch gap-2 px-4 py-2 transition-colors ${interactive ? "cursor-pointer hover:bg-surface-container-high/50" : ""}`}
      onClick={() => interactive && setPickerOpen((v) => !v)}
    >
      <div className="flex flex-col">
        {isUnlimited && isSaved ? (
          <>
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              duration
            </p>
            <p className="font-heading text-lg font-medium text-primary">
              Unlimited
            </p>
          </>
        ) : (
          <>
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground transition-opacity duration-300">
              {showDuration ? (
                <><span className="sm:hidden">duration</span><span className="hidden sm:inline">selected duration</span></>
              ) : (
                <><span className="sm:hidden">expires in</span><span className="hidden sm:inline">time until deletion</span></>
              )}
            </p>
            <div className="grid h-7 overflow-hidden">
              <p
                className={`col-start-1 row-start-1 font-heading text-lg font-medium text-primary transition-transform duration-300 ease-out ${showDuration ? "-translate-y-full" : "translate-y-0"}`}
              >
                {countdown}
              </p>
              <p
                className={`col-start-1 row-start-1 font-heading text-lg font-medium text-primary transition-transform duration-300 ease-out ${showDuration ? "translate-y-0" : "translate-y-full"}`}
              >
                {durationLabel}
              </p>
            </div>
          </>
        )}
      </div>
      {onDurationChange && (
        <div className="flex items-stretch gap-2" onClick={(e) => e.stopPropagation()}>
          <span className="w-px bg-ghost-border" />
          <DurationPicker
            value={duration}
            onChange={onDurationChange}
            open={pickerOpen}
            onOpenChange={setPickerOpen}
            iconOnly
            isAdmin={isAdminUser}
            isAnon={isAnon}
          />
        </div>
      )}
    </div>
  );
}
