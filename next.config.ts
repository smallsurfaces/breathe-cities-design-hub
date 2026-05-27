import type { NextConfig } from "next";

// ---------------------------------------------------------------------------
// Security response headers — applied by the Next.js runtime
// ---------------------------------------------------------------------------
// WHY THESE LIVE HERE (and not in netlify.toml):
//   This site deploys to Netlify in Next.js *runtime* (server) mode via
//   @netlify/plugin-nextjs (next.config has no output:'export'; /api/stations
//   is a server route). On that setup, netlify.toml `[[headers]]` only apply to
//   STATIC CDN assets (/_next/static/*) — they do NOT cover SSR/runtime-rendered
//   page responses. Verified live: /direction-2-live-data (an SSR page) was
//   missing CSP / X-Frame-Options / Referrer-Policy while /_next/static/*.js had
//   them. Next's headers() runs inside the runtime, so a catch-all source
//   ('/(.*)') applies the set to ALL routes — SSR pages included. The headers
//   were therefore moved out of netlify.toml [[headers]] into here.
//
// Per-header rationale:
//   Strict-Transport-Security  Force HTTPS for 1 year, including subdomains.
//                              Browser refuses plain-HTTP for the lifetime.
//                              (No `; preload` — opting in to the preload list
//                              is a deliberate, hard-to-reverse step, not done
//                              here.)
//   X-Frame-Options DENY       Block this site from being framed -> clickjacking
//                              defence. (CSP frame-ancestors is the modern
//                              equivalent; XFO kept for older-browser coverage.)
//   X-Content-Type-Options     Stop MIME-sniffing; browser trusts the declared
//     nosniff                  Content-Type only.
//   Referrer-Policy            Send origin only on cross-origin nav, full URL
//                              same-origin -> avoids leaking paths to third
//                              parties (e.g. Mapbox telemetry).
//
// CSP IS REPORT-ONLY (key: Content-Security-Policy-Report-Only). The browser
// reports violations to the console but does NOT block them, so a wrong
// directive cannot break Mapbox GL JS. Flipping to enforced
// (Content-Security-Policy) is a SEPARATE later step, done only once the live
// browser console is verified clean. Do not flip it here.
//
// CSP directives follow Mapbox's official CSP guidance for Mapbox GL JS
// (https://docs.mapbox.com/mapbox-gl-js/guides/browsers-and-testing/#csp-directives):
//   worker-src blob: / child-src blob:  Mapbox GL JS runs its WebGL renderer in
//                                       Web Workers loaded from blob: URLs
//                                       (child-src is the older-browser fallback).
//   img-src 'self' data: blob: + api/tiles hosts
//                                       Sprites, glyphs and tiles are fetched
//                                       from Mapbox and decoded to data:/blob:.
//   connect-src 'self' api.mapbox.com events.mapbox.com (+ tiles)
//                                       Style/tile/glyph fetches + telemetry.
//                                       NOTE: the OpenAQ call is SERVER-side via
//                                       /api/stations, so the browser never
//                                       connects to OpenAQ -> not listed here.
//   script-src 'self'                   mapbox-gl is bundled by Next (an npm
//                                       dependency), not loaded from a CDN, so no
//                                       external script host is required.
//   style-src 'self' 'unsafe-inline'    TECH-DEBT: markers/popups use inline
//                                       style="" attributes; 'unsafe-inline' is an
//                                       accepted prototype trade-off. Remove once
//                                       inline styles are refactored to classes.
// ---------------------------------------------------------------------------

/**
 * Content-Security-Policy value, shipped Report-Only (see block comment above).
 * Extracted to a constant so the long directive string stays readable in the
 * headers() rule below.
 */
const cspReportOnly =
  "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://api.mapbox.com https://*.tiles.mapbox.com; worker-src blob:; child-src blob:; connect-src 'self' https://api.mapbox.com https://events.mapbox.com https://*.tiles.mapbox.com; font-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'";

const nextConfig: NextConfig = {
  // Side effect: registers response headers applied by the Next.js runtime to
  // every route matched by `source`. The catch-all '/(.*)' covers SSR pages,
  // static pages, and API routes alike.
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Content-Security-Policy-Report-Only",
            value: cspReportOnly,
          },
        ],
      },
    ];
  },
};

export default nextConfig;
