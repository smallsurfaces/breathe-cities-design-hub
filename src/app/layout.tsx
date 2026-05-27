import type { Metadata } from "next";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";
import ConfidentialFooter from "./_components/ConfidentialFooter";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Breathe Cities",
  description: "Air quality monitoring and insights for cities",
};

/**
 * Root layout. Mounts the global font + tooltip provider for every route AND a persistent
 * <ConfidentialFooter/> strip so the "confidential client review" framing is visible on every
 * surface (landing, the four concept routes, and any dynamic sub-routes). The footer is
 * fixed-position so it does not need page-level padding to render correctly.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <head>
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script src="https://mcp.figma.com/mcp/html-to-design/capture.js" async></script>
      </head>
      <body>
        <TooltipProvider>{children}</TooltipProvider>
        <ConfidentialFooter />
      </body>
    </html>
  );
}
