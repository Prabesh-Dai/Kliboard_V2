import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "About",
  description:
    "Kliboard is a free temporary online clipboard — paste text or files into a named space and share the link, no signup required. Learn what it is and how it works.",
};

const faqs = [
  {
    q: "What is Kliboard?",
    a: "Kliboard is a free temporary online clipboard. You create a named space, paste text or files into it, and share the link — no account needed. Each space deletes itself automatically after the duration you choose.",
  },
  {
    q: "What is an online clipboard?",
    a: "An online clipboard lets you store text or files in your browser and reach them from any other device through a link. Kliboard is an online clipboard built for quick, throwaway sharing rather than permanent storage.",
  },
  {
    q: "How do I share text between my phone and computer?",
    a: "Open Kliboard on one device, paste your text into a new space, and reopen that space's link on the other device. Because each space lives at a simple URL, you can also type the space name straight into any browser to pull the content up.",
  },
  {
    q: "Do I need an account to use Kliboard?",
    a: "No. Creating spaces, pasting text, uploading files, and sharing links all work without signing up. An optional account just lets you keep track of the spaces you have made.",
  },
  {
    q: "How long does a space last, and is it private?",
    a: "You choose how long a space lives — from 5 minutes up to about 10 days — and it deletes itself when the time is up. You can also lock a space with a password so only people you share it with can open it.",
  },
];

const faqStructuredData = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.q,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.a,
    },
  })),
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
  {
    name: "Overwatch rank tracker",
    description: "Track your Overwatch competitive rank over time.",
    href: "https://overwatch-rank-tracker.vercel.app/",
  },
];

export default function AboutPage() {
  return (
    <div className="mx-auto flex min-h-full max-w-3xl flex-col px-6 pt-24 pb-16 sm:pt-32">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }}
      />
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
          questions
        </h2>
        <dl className="mt-6 flex flex-col gap-2">
          {faqs.map((faq) => (
            <div
              key={faq.q}
              className="rounded-sm bg-surface-container-low px-5 py-4"
            >
              <dt className="font-heading text-base font-medium tracking-tight">
                {faq.q}
              </dt>
              <dd className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {faq.a}
              </dd>
            </div>
          ))}
        </dl>
      </section>

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
                <ExternalLink className="mt-1 size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
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
            <ExternalLink className="size-3.5 text-muted-foreground transition-colors group-hover:text-foreground" />
          </a>
          <a
            href="https://www.linkedin.com/in/prabesh-sharma-767977232/"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-2 rounded-sm bg-surface-container-low px-4 py-2 text-sm transition-colors hover:bg-surface-container"
          >
            linkedin
            <ExternalLink className="size-3.5 text-muted-foreground transition-colors group-hover:text-foreground" />
          </a>
        </div>
      </section>

      <section className="mt-16">
        <Link
          href="/space/prabesh"
          className="group inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <span>visit my page</span>
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </section>
    </div>
  );
}
