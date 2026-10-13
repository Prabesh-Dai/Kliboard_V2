const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://kliboard.online";

const graph = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: "Kliboard",
      url: siteUrl,
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl}/icons/icon-512.png`,
        width: 512,
        height: 512,
      },
      sameAs: [
        "https://github.com/bababubudev",
        "https://www.linkedin.com/in/prabesh-sharma-767977232/",
        "https://bababubudev.github.io/Kliboard/",
      ],
    },
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      url: siteUrl,
      name: "Kliboard",
      description:
        "Paste text or files into a named space and share the link. It deletes itself when time's up. No account needed.",
      publisher: { "@id": `${siteUrl}/#organization` },
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${siteUrl}/space/{space_name}`,
        },
        "query-input": "required name=space_name",
      },
    },
    {
      "@type": "WebApplication",
      "@id": `${siteUrl}/#app`,
      name: "Kliboard",
      url: siteUrl,
      applicationCategory: "ProductivityApplication",
      operatingSystem: "Web",
      browserRequirements: "Requires JavaScript and a modern browser.",
      description:
        "Paste text or files into a named space and share the link. It deletes itself when time's up. No account needed.",
      publisher: { "@id": `${siteUrl}/#organization` },
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
    },
  ],
};

export function HomeStructuredData() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
    />
  );
}
