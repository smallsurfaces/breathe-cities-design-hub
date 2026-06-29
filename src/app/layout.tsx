import type { Metadata } from "next";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";
import ConfidentialFooter from "./_components/ConfidentialFooter";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

/**
 * Root metadata.
 *
 * `title` here is the DEFAULT — per-page `generateMetadata` exports override it on every
 * route. Reviewers in multi-tab review need distinguishable tab titles, so the landing
 * sets a distinctive title and each concept top page reads its canonical name from the
 * concept registry. The base "Breathe Cities" string remains as the SSR fallback for any
 * route that has not declared its own title.
 *
 * `robots: noindex/nofollow` is the metadata-level half of the confidentiality discipline.
 * The other two layers are the `X-Robots-Tag` header in next.config.ts (strongest signal,
 * applies to every response) and the static /robots.txt in /public (disallow-all for
 * polite crawlers). All three are deliberately layered — confidentiality at this stage of
 * review is worth the belt-and-braces.
 */
export const metadata: Metadata = {
  title: "Breathe Cities — Concept Prototype for Review",
  description: "Air quality monitoring and insights for cities",
  robots: {
    index: false,
    follow: false,
  },
};

/**
 * Root layout. Mounts the global font + tooltip provider for every route AND a persistent
 * <ConfidentialFooter/> strip so the "confidential client review" framing is visible on every
 * surface (landing, the four concept routes, and any dynamic sub-routes).
 *
 * `pb-10` on <body> reserves a strip of bottom padding so page content scrolls ABOVE the
 * fixed ConfidentialFooter rather than under it. Paired with the footer being a solid
 * opaque strip (no backdrop blur) and z-50, so the framing is always legible while the
 * AnnotationLayer's pins (z-101) and cards (z-110) can still render over the strip when
 * a reviewer drops an annotation near the viewport bottom.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <head>
        {/*
          noindex / nofollow META — the metadata-level half of the confidentiality
          discipline (the `metadata.robots` export above sets this declaratively, this
          inline tag is the duplicate-by-design belt). Confirmed by both the
          `metadata` API and a literal meta tag so any crawler that reads either path
          honours the directive.
        */}
        <meta name="robots" content="noindex, nofollow" />
      </head>
      <body className="pb-10">
        <TooltipProvider>{children}</TooltipProvider>
        <ConfidentialFooter />
      </body>
    </html>
  );
}
