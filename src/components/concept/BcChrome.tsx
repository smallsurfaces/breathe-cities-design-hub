/**
 * BcChrome.tsx — shared, config-driven recreation of Breathe Cities' site chrome.
 *
 * Purpose
 *   ONE reusable header + footer that recreates breathecities.org's chrome for any concept
 *   prototype, so a concept's pages can be shown embedded in BC's real site IA and, more
 *   importantly, so the prototype is NAVIGABLE between the concept home, its sub-pages, and
 *   (in later waves) sibling concepts. NOT pixel-perfect — an approximation of BC's look: brand
 *   blue/teal, clean sans, airy whitespace. Placeholder logos only; we never reproduce BC's
 *   real assets.
 *
 *   This is the consolidation target for the four near-identical per-concept BcChrome copies that
 *   previously lived under each concept folder. The only thing that differed between them — which
 *   nav items are LIVE and where the brand mark points — is now passed in as a `BcChromeConfig`
 *   (see bc-chrome.config.ts). BcHeader takes that config; BcFooter is static content and takes
 *   no props.
 *
 *   Live vs inert: a nav item is LIVE when `href !== '#'` (a real route in the prototype) and
 *   inert otherwise (a real BC label the prototype does not implement) — inert items are shown
 *   but not clickable, so the chrome reads as BC's real IA with no dead-end navigation.
 *
 *   Back-to-hub is NOT rendered here — the standard PrototypeHeader (rendered ABOVE BcHeader in
 *   each concept's layout) owns the sole back-to-hub + comment tooling. BcChrome is the SITE nav;
 *   PrototypeHeader is the TOOLING bar. Both coexist: PrototypeHeader on top, BcHeader below.
 *
 * Behaviour preserved verbatim from the AQ Network source copy:
 *   - sticky, backdrop-blurred header,
 *   - mobile hamburger that opens a full-screen dark-navy overlay nav,
 *   - body-scroll-lock while the overlay is open (and cleaned up on unmount).
 *
 * Styling
 *   Layout via Tailwind utilities + bridged shadcn semantics (`bg-background`, `border-border`,
 *   `text-foreground`, `text-muted-foreground`, `bg-muted`). All BC BRAND colours are applied via
 *   inline `style` with `var(--bc-*)` tokens (the robust mechanism in this Tailwind v4 config) —
 *   no `text-bc-*`/`bg-bc-*`/`border-bc-*` utility classes, no hardcoded hex. The live nav links'
 *   hover colour uses the bridged `hover:text-primary` (which resolves to brand blue), keeping the
 *   hover pure-CSS rather than a `*-bc-*` utility or a JS handler. Light mode.
 *
 * Key exports: BcHeader, BcFooter
 * External dependencies: next/link, react (useState, useEffect), ./bc-chrome.config (types).
 */

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { BcChromeConfig } from './bc-chrome.config'

/**
 * One live desktop nav link. Reads as foreground at rest and brand blue on hover/focus. The hover
 * colour uses the shadcn-bridged `primary` token (globals.css maps --primary → --bc-semantic-brand
 * = brand blue), so it is brand blue via a bridged semantic — NOT a `*-bc-*` utility and NOT a JS
 * handler (so this works whether the host page is a server or client component).
 */
function NavLink({
  label,
  href,
  onNavigate,
}: {
  label: string
  href: string
  onNavigate: () => void
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className="text-sm font-medium text-foreground transition-colors hover:text-primary"
    >
      {label}
    </Link>
  )
}

/**
 * The site header — brand mark (left) → primary nav → "Join us" CTA, with a mobile hamburger that
 * opens a full-screen overlay. Driven entirely by `config`: the logo links to `config.logoHref`,
 * and each `config.nav` item renders live (a NavLink) or inert (a non-clickable muted span) based
 * on `href !== '#'`. No prototype/disclaimer bar is rendered here — the single GENERIC wireframe
 * disclaimer is owned by the PrototypeHeader above this in the concept layout (which also owns the
 * sole back-to-hub), so the prototype shows exactly one disclaimer row. BcHeader is the SITE nav only.
 */
export function BcHeader({ config }: { config: BcChromeConfig }) {
  const [menuOpen, setMenuOpen] = useState(false)

  /* Prevent body scroll while the mobile overlay is open. */
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  return (
    <>
      {/* No prototype/disclaimer bar here. The wireframe framing is single-sourced in the
          PrototypeHeader above (the GENERIC "Concept wireframe…" line), so BcHeader renders only
          BC's recreated site chrome — exactly one disclaimer row across the whole prototype. */}

      {/* BC-style header — sticky + backdrop blur (preserved from the source). */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          {/* Logo (left) → concept home */}
          <Link href={config.logoHref} className="flex items-center gap-2">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold"
              style={{
                backgroundColor: 'var(--bc-semantic-brand)',
                color: 'var(--bc-color-white)',
              }}
            >
              BC
            </span>
            <span className="hidden text-base font-bold tracking-tight text-foreground sm:inline">
              Breathe Cities
            </span>
          </Link>

          {/* Primary nav — live items link with a hover swap; inert items are muted, non-clickable. */}
          <nav className="hidden flex-wrap items-center gap-x-5 gap-y-1 md:flex">
            {config.nav.map((item) => {
              const live = item.href !== '#'
              return live ? (
                <NavLink
                  key={item.label}
                  label={item.label}
                  href={item.href}
                  onNavigate={() => undefined}
                />
              ) : (
                <span
                  key={item.label}
                  aria-disabled="true"
                  className="cursor-default text-sm font-medium text-muted-foreground/70"
                >
                  {item.label}
                </span>
              )
            })}
          </nav>

          {/* Right cluster: Join us CTA + hamburger (mobile) */}
          <div className="flex items-center gap-3">
            {/* Join us CTA */}
            <span
              className="inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold"
              style={{
                backgroundColor: 'var(--bc-semantic-brand)',
                color: 'var(--bc-color-white)',
              }}
            >
              Join us
            </span>

            {/* Hamburger button — mobile only */}
            <button
              type="button"
              aria-label="Open navigation menu"
              className="flex h-10 w-10 items-center justify-center md:hidden"
              onClick={() => setMenuOpen(true)}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                className="text-foreground"
              >
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile nav overlay — full-screen, dark navy background (preserved from the source). */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-50 flex flex-col"
          style={{ backgroundColor: 'var(--bc-color-dark-blue)' }}
        >
          {/* Overlay header — logo left, close button right */}
          <div className="flex items-center justify-between px-4 py-4">
            <Link
              href={config.logoHref}
              className="flex items-center gap-2"
              onClick={() => setMenuOpen(false)}
            >
              <span
                className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold"
                style={{
                  backgroundColor: 'var(--bc-semantic-brand)',
                  color: 'var(--bc-color-white)',
                }}
              >
                BC
              </span>
            </Link>

            <button
              type="button"
              aria-label="Close navigation menu"
              className="flex h-10 w-10 items-center justify-center"
              onClick={() => setMenuOpen(false)}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--bc-color-white)"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <line x1="6" y1="6" x2="18" y2="18" />
                <line x1="6" y1="18" x2="18" y2="6" />
              </svg>
            </button>
          </div>

          {/* Nav links — vertically centred, large text. Live = teal, inert = steel. */}
          <nav className="flex flex-1 flex-col items-center justify-center gap-6 px-4">
            {config.nav.map((item) => {
              const live = item.href !== '#'
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  aria-disabled={!live}
                  onClick={() => {
                    if (live) setMenuOpen(false)
                  }}
                  className="text-2xl font-semibold transition-colors"
                  style={{
                    color: live
                      ? 'var(--bc-color-teal)'
                      : 'var(--bc-color-steel)',
                    cursor: live ? 'pointer' : 'default',
                  }}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>
      )}
    </>
  )
}

/** Partner logos as neutral placeholder marks — we never reproduce real assets. */
function PartnerLogos() {
  const partners = ['Clean Air Fund', 'C40', 'Bloomberg Philanthropies']
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
      {partners.map((name) => (
        <span
          key={name}
          className="text-sm font-semibold tracking-wide text-muted-foreground"
        >
          {name}
        </span>
      ))}
    </div>
  )
}

/**
 * The site footer — email signup band, partner logos, and a foot strip. Static content (no
 * per-concept variation), so it takes no props. Mirrors BC's real footer structure (signup +
 * partners) in a light, token-styled form. BC brand colours via inline `style` var(--bc-*).
 */
export function BcFooter() {
  return (
    <footer className="mt-16">
      {/* Email signup band — teal-tinted, airy */}
      <section
        className="px-4 py-14"
        style={{ backgroundColor: 'var(--bc-color-light-teal)' }}
      >
        <div className="mx-auto max-w-2xl space-y-4 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Stay in the loop
          </h2>
          <p
            className="text-sm"
            style={{
              color: 'color-mix(in srgb, var(--bc-color-dark-blue) 80%, transparent)',
            }}
          >
            Get clean-air news and city stories from the Breathe Cities network.
          </p>
          <div className="mx-auto flex max-w-md flex-col gap-2 sm:flex-row">
            <span
              className="flex-1 rounded-full px-4 py-2.5 text-left text-sm text-muted-foreground"
              style={{
                backgroundColor: 'var(--bc-color-white)',
                border:
                  '1px solid color-mix(in srgb, var(--bc-color-dark-blue) 15%, transparent)',
              }}
            >
              your@email.com
            </span>
            <span
              className="inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold"
              style={{
                backgroundColor: 'var(--bc-semantic-brand)',
                color: 'var(--bc-color-white)',
              }}
            >
              Sign up
            </span>
          </div>
        </div>
      </section>

      {/* Partner logos */}
      <section className="border-t border-border px-4 py-10">
        <div className="mx-auto max-w-4xl space-y-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            In partnership with
          </p>
          <PartnerLogos />
        </div>
      </section>

      {/* Foot strip */}
      <div className="border-t border-border bg-muted/40 px-4 py-6">
        <div className="mx-auto flex max-w-6xl items-center justify-center text-center text-xs text-muted-foreground">
          <span>Breathe Cities — 30% cleaner air by 2030.</span>
        </div>
      </div>
    </footer>
  )
}
