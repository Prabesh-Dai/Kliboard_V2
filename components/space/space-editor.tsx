"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { SPACE_NAME_MIN, SPACE_NAME_MAX, RESERVED_NAMES } from "@/lib/constants";
import { errorVariants, baseTransition } from "@/lib/animations";
import { CircleAlert } from "lucide-react";

const SPACE_NAME_REGEX = /^[a-zA-Z][a-zA-Z-]*[a-zA-Z]$/;

function validateSpaceName(value: string): string {
  if (value.length < SPACE_NAME_MIN) return `Name must be at least ${SPACE_NAME_MIN} characters`;
  if (value.length > SPACE_NAME_MAX) return `Name must be at most ${SPACE_NAME_MAX} characters`;
  if (!SPACE_NAME_REGEX.test(value)) return "Only letters and hyphens allowed";
  if (RESERVED_NAMES.includes(value.toLowerCase())) return "This name is reserved";
  return "";
}

export function SpaceEditor() {
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState("");
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const error = validateSpaceName(name);
    if (error) {
      setNameError(error);
      return;
    }
    router.push(`/space/${name.toLowerCase()}`);
  }

  return (
    <div className="w-full max-w-lg">
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 rounded-lg bg-surface-container-high p-2 pl-4 ring-1 ring-ghost-border transition-colors focus-within:ring-primary/30"
      >
        <Input
          placeholder="Or enter an existing one..."
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (e.target.value) setNameError(validateSpaceName(e.target.value));
          }}
          className="h-10 border-0 font-heading bg-transparent text-sm shadow-none placeholder:text-muted-foreground focus-visible:ring-0"
        />
        <button
          type="submit"
          className="h-10 shrink-0 rounded-md bg-linear-to-br from-primary to-primary-container px-6 text-xs font-medium uppercase tracking-widest text-primary-foreground transition-opacity hover:opacity-90"
        >
          enter space
        </button>
      </form>
      <div className="mt-2 h-3.5">
        <AnimatePresence initial={false}>
          {nameError && (
            <motion.p
              key={nameError}
              variants={errorVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={baseTransition}
              className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.15em] text-destructive"
            >
              <CircleAlert className="h-3 w-3 shrink-0" />
              {nameError}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
