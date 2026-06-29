import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-auto bg-surface-dim pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 p-6">
        <p
          suppressHydrationWarning
          className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground"
        >
          kliboard &copy; {new Date().getFullYear()}
        </p>
        <div className="flex items-center gap-6">
          <Link
            href="/about"
            className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground"
          >
            about
          </Link>
        </div>
      </div>
    </footer>
  );
}
