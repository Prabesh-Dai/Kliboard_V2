"use client";

import { useEffect, useRef } from "react";
import { Moon, Sun } from "lucide-react";
import { useThemeStore } from "@/stores/theme-store";

function applyTheme(theme: "light" | "dark" | "system") {
  const root = document.documentElement;
  if (theme === "system") {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    root.classList.toggle("dark", prefersDark);
  } else {
    root.classList.toggle("dark", theme === "dark");
  }
}

function isDark() {
  return document.documentElement.classList.contains("dark");
}

export function ThemeToggle() {
  const { theme, setTheme } = useThemeStore();
  const buttonRef = useRef<HTMLButtonElement>(null);

  function toggle(e: React.MouseEvent) {
    const next = isDark() ? "light" : "dark";
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!document.startViewTransition || prefersReduced) {
      setTheme(next);
      return;
    }

    const { clientX: x, clientY: y } = e;
    const maxRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );
    document.documentElement.style.setProperty("--theme-tx", `${x}px`);
    document.documentElement.style.setProperty("--theme-ty", `${y}px`);
    document.documentElement.style.setProperty("--theme-tr", `${maxRadius}px`);

    const transition = document.startViewTransition(() => {
      setTheme(next);
    });
    transition.finished.then(() => {
      document.documentElement.style.removeProperty("--theme-tx");
      document.documentElement.style.removeProperty("--theme-ty");
      document.documentElement.style.removeProperty("--theme-tr");
    });
  }

  useEffect(() => {
    applyTheme(theme);

    if (theme === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = () => applyTheme("system");
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    }
  }, [theme]);

  return (
    <button
      ref={buttonRef}
      onClick={toggle}
      className="relative flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground"
      aria-label="Toggle theme"
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </button>
  );
}
