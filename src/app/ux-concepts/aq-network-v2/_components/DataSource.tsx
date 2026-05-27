/**
 * DataSource.tsx — a small, reusable data-attribution element for AQ Network.
 *
 * Purpose
 *   Implements a team decision: every data point on the AQ Network surfaces must NAME its
 *   source and offer a path to it. This is the single component that renders that attribution,
 *   so the styling and wording stay consistent everywhere it appears (sensor section, news
 *   strip, health payoff, the homepage collective headline).
 *
 *   It is deliberately QUIET — muted colour, small text, an unobtrusive icon. The data is the
 *   hero; the attribution is present, not loud. It must never compete with the figure it credits.
 *
 * Two variants (controlled by `variant`):
 *   - 'attribution' (default): "Source: <name>" — credits data we DO present here. Optional
 *     `href` turns the name into a link (opens in a new tab) with a small external-link icon.
 *   - 'redirect': a path to data we DON'T host — e.g. "For raw sensor data, see OpenAQ". The
 *     caller supplies the lead-in (`label`, e.g. "For raw sensor data") and the destination
 *     name; `href` is expected here since the whole point is to send the user onward.
 *
 * Honesty role
 *   Pairs with the concept's "claim support, never outcomes" discipline: a figure shown on the
 *   page is only as trustworthy as the source beside it, so the source is always one glance away.
 *
 * Key exports: DataSource (named), DataSourceProps (named type)
 * External dependencies: react (types), lucide-react (ExternalLink, ArrowUpRight). BC tokens only.
 */

import type { ReactElement } from 'react'
import { ExternalLink, ArrowUpRight } from 'lucide-react'

/** Which attribution shape to render — credit data shown here, or redirect to data we don't host. */
type DataSourceVariant = 'attribution' | 'redirect'

/** Props for DataSource. */
export type DataSourceProps = {
  /**
   * Which variant to render.
   *   - 'attribution': "Source: <name>" for data presented on this surface.
   *   - 'redirect': "<label>, see <name>" for data hosted elsewhere (raw sensor data, etc.).
   */
  variant: DataSourceVariant
  /** The source / destination NAME (e.g. "OpenAQ", "Breathe Cities", "AQLI · WHO"). */
  name: string
  /**
   * Optional destination URL. When present the name becomes a link (new tab, rel-safe) with a
   * small icon. For the 'redirect' variant a link is expected (the point is to send the user on);
   * for 'attribution' it is optional (some sources have no single public URL).
   */
  href?: string
  /**
   * The lead-in for the 'redirect' variant only (e.g. "For raw sensor data"). Ignored for the
   * 'attribution' variant, which always leads with the fixed "Source:" label. Explicit (no
   * default) per the project's no-default-parameters rule.
   */
  label?: string
  /** Optional extra classes for spacing in a given context (margins are the caller's concern). */
  className?: string
}

/**
 * The shared muted text + link styling. Centralised so both variants read identically. Uses BC
 * muted-foreground via the Tailwind token; the link hover deepens to the foreground token. No
 * hardcoded colour — all through bc tokens.
 */
const ROOT_CLASS =
  'inline-flex items-center gap-1 text-xs text-muted-foreground'
const LINK_CLASS =
  'inline-flex items-center gap-0.5 font-medium underline decoration-dotted underline-offset-2 transition-colors hover:text-foreground'

/**
 * Render the source NAME — as a quiet dotted-underline link (new tab) when an href is given, or
 * as plain muted text otherwise. The icon differs by variant: an external-link glyph for a plain
 * attribution link, an up-right arrow for a redirect (it reads as "go here instead").
 */
function SourceName({
  name,
  href,
  variant,
}: {
  name: string
  href?: string
  variant: DataSourceVariant
}): ReactElement {
  if (href === undefined) {
    // No URL — just the muted name (honest: some sources have no single public link).
    return <span className="font-medium text-foreground/80">{name}</span>
  }
  const Icon = variant === 'redirect' ? ArrowUpRight : ExternalLink
  return (
    <a
      href={href}
      target="_blank"
      // noopener/noreferrer: external links must not hand the opener reference to the destination.
      rel="noopener noreferrer"
      className={LINK_CLASS}
    >
      {name}
      <Icon className="h-3 w-3" aria-hidden="true" />
    </a>
  )
}

/**
 * The attribution element. 'attribution' leads with the fixed "Source:" label; 'redirect' leads
 * with the caller's `label` (e.g. "For raw sensor data") then ", see <name>". Quiet by design.
 */
export function DataSource({
  variant,
  name,
  href,
  label,
  className,
}: DataSourceProps): ReactElement {
  const rootClass =
    className !== undefined ? `${ROOT_CLASS} ${className}` : ROOT_CLASS

  if (variant === 'redirect') {
    // Redirect: "<label>, see <name>". Fall back to a sensible lead-in if none was supplied so
    // the sentence always reads correctly (explicit check — no default parameter value).
    const leadIn = label !== undefined ? label : 'For the source data'
    return (
      <span className={rootClass}>
        {leadIn}, see <SourceName name={name} href={href} variant={variant} />
      </span>
    )
  }

  // Attribution: the fixed "Source:" prefix then the (optionally linked) name.
  return (
    <span className={rootClass}>
      Source: <SourceName name={name} href={href} variant={variant} />
    </span>
  )
}
