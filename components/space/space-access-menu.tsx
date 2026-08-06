"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ChevronDown,
  Globe,
  KeyRound,
  Loader2,
  Lock,
  LockOpen,
  RotateCcwKey,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { iconSwap, DURATION, EASE_OUT } from "@/lib/animations";

interface SpaceAccessMenuProps {
  isPrivate: boolean;
  isLocked: boolean;
  spaceExists: boolean;
  showLockState: boolean;
  canSetVisibility: boolean;
  canToggleLock: boolean;
  visibilityPending?: boolean;
  lockPending?: boolean;
  onVisibilityChange: (isPrivate: boolean) => void;
  onToggleLock: () => void;
  onRotatePassword: () => void;
}

const LABEL_CLASS =
  "flex items-center gap-1.5 whitespace-nowrap text-[10px] uppercase tracking-[0.2em] text-muted-foreground";

function SwapIcon({ swapKey, children }: { swapKey: string; children: React.ReactNode }) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.span
        key={swapKey}
        variants={iconSwap}
        initial="hidden"
        animate="visible"
        exit="exit"
        transition={{ duration: DURATION.fast, ease: EASE_OUT }}
        className="inline-flex"
      >
        {children}
      </motion.span>
    </AnimatePresence>
  );
}

export function SpaceAccessMenu({
  isPrivate,
  isLocked,
  spaceExists,
  showLockState,
  canSetVisibility,
  canToggleLock,
  visibilityPending,
  lockPending,
  onVisibilityChange,
  onToggleLock,
  onRotatePassword,
}: SpaceAccessMenuProps) {
  const [open, setOpen] = useState(false);

  const summary = (
    <>
      <span className="inline-flex items-center gap-1">
        <SwapIcon swapKey={`read-${visibilityPending ? "pending" : isPrivate ? "private" : "public"}`}>
          {visibilityPending ? (
            <Loader2 className="size-2.5 animate-spin" />
          ) : isPrivate ? (
            <KeyRound className="size-2.5" />
          ) : (
            <Globe className="size-2.5" />
          )}
        </SwapIcon>
        {isPrivate ? "Private" : "Public"}
      </span>
      {showLockState && (
        <>
          <span aria-hidden className="text-muted-foreground/40">
            &middot;
          </span>
          <span className="inline-flex items-center gap-1">
            <SwapIcon swapKey={`write-${lockPending ? "pending" : isLocked ? "locked" : "unlocked"}`}>
              {lockPending ? (
                <Loader2 className="size-2.5 animate-spin" />
              ) : isLocked ? (
                <Lock className="size-2.5" />
              ) : (
                <LockOpen className="size-2.5" />
              )}
            </SwapIcon>
            {isLocked ? "Locked" : "Unlocked"}
          </span>
        </>
      )}
    </>
  );

  if (!canSetVisibility && !canToggleLock) {
    return <p className={LABEL_CLASS}>{spaceExists ? summary : "Space"}</p>;
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        className={`${LABEL_CLASS} cursor-pointer rounded-sm outline-none transition-colors hover:text-foreground focus-visible:text-foreground`}
      >
        {summary}
        <ChevronDown
          className={`size-2.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-52">
        <DropdownMenuRadioGroup
          value={isPrivate ? "private" : "public"}
          onValueChange={(value) => onVisibilityChange(value === "private")}
        >
          <DropdownMenuRadioItem value="public" closeOnClick disabled={visibilityPending}>
            {visibilityPending && !isPrivate ? (
              <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
            ) : (
              <Globe className="size-3.5 text-muted-foreground" />
            )}
            <span className="text-xs font-medium">Public</span>
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="private" closeOnClick disabled={visibilityPending}>
            {visibilityPending && isPrivate ? (
              <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
            ) : (
              <KeyRound className="size-3.5 text-muted-foreground" />
            )}
            <span className="text-xs font-medium">Private</span>
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>

        <DropdownMenuSeparator />

        {spaceExists ? (
          <DropdownMenuCheckboxItem
            checked={!isLocked}
            onCheckedChange={onToggleLock}
            disabled={!canToggleLock || lockPending}
          >
            {lockPending ? (
              <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
            ) : isLocked ? (
              <Lock className="size-3.5 text-muted-foreground" />
            ) : (
              <LockOpen className="size-3.5 text-muted-foreground" />
            )}
            <span className="text-xs font-medium">Let others edit</span>
          </DropdownMenuCheckboxItem>
        ) : (
          <DropdownMenuItem disabled>
            <Lock className="size-3.5 text-muted-foreground" />
            <span className="text-xs font-medium">Let others edit</span>
          </DropdownMenuItem>
        )}

        {isPrivate && spaceExists && (
          <DropdownMenuItem onClick={onRotatePassword} disabled={visibilityPending}>
            <RotateCcwKey className="size-3.5 text-muted-foreground" />
            <span className="text-xs font-medium">Change password</span>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
