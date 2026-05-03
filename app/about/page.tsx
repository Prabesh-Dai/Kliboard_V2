import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "About",
  description: "About Kliboard and its creator.",
};

const projects = [
  {
    name: "Game spec checker",
    description: "Check whether your machine meets a game's requirements.",
    href: "https://do-i-need-to-upgrade.vercel.app/",
  },
  {
    name: "Kliboard v1",
    description: "The original prototype that this app grew out of.",
    href: "https://bababubudev.github.io/Kliboard/",
  },
  {
    name: "Advanced calculator",
    description: "A calculator with a few more tricks than the default.",
    href: "https://calculab.pareki.xyz/",
  },
];

export default function AboutPage() {
  return (
    <div className="mx-auto flex min-h-full max-w-3xl flex-col px-6 pt-24 pb-16 sm:pt-32">
      <header>
        <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
          about
        </p>
        <h1 className="mt-3 font-heading text-4xl font-medium tracking-tight sm:text-5xl">
          a temporary online clipboard
        </h1>
        <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground">
          Kliboard is a temporary text clipboard for the web. Create a named
          space, paste something into it, share the link. It disappears when
          you said it should. No account required.
        </p>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
          This is a solo hobby project. If
          something breaks or surprises you, please don&apos;t store anything
          irreplaceable here.
        </p>
      </header>

      <section className="mt-16">
        <h2 className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
          other things i&apos;ve built
        </h2>
        <ul className="mt-6 flex flex-col gap-2">
          {projects.map((project) => (
            <li key={project.href}>
              <a
                href={project.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start justify-between gap-6 rounded-sm bg-surface-container-low px-5 py-4 transition-colors hover:bg-surface-container"
              >
                <div className="min-w-0">
                  <p className="font-heading text-base font-medium tracking-tight">
                    {project.name}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {project.description}
                  </p>
                </div>
                <ExternalLink className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-16">
        <h2 className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
          find me
        </h2>
        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href="https://github.com/bababubudev"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-2 rounded-sm bg-surface-container-low px-4 py-2 text-sm transition-colors hover:bg-surface-container"
          >
            github
            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground transition-colors group-hover:text-foreground" />
          </a>
          <a
            href="https://www.linkedin.com/in/prabesh-sharma-767977232/"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-2 rounded-sm bg-surface-container-low px-4 py-2 text-sm transition-colors hover:bg-surface-container"
          >
            linkedin
            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground transition-colors group-hover:text-foreground" />
          </a>
        </div>
      </section>

      <section className="mt-16">
        <Link
          href="/space/prabesh"
          className="group inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <span>visit my page</span>
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </section>
    </div>
  );
}
