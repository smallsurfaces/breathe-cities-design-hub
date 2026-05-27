/**
 * InfoTooltip.tsx — a small "i" info affordance that reveals provenance/methodology copy on
 *   hover or focus.
 *
 * Purpose
 *   Concept pages were carrying load-bearing data-provenance lines (e.g. "Sensor positions and
 *   type are real OpenAQ data, captured once…", "Source: OpenAQ") inline as muted paragraphs.
 *   The housekeeping pass HIDES the purely descriptive copy but must KEEP this provenance copy —
 *   it is load-bearing for the data-attribution-traceability decision. This component is how that
 *   copy is kept without it sitting as visible body text: a quiet inline "i" icon that surfaces
 *   the provenance behind a tooltip, one glance away but out of the page flow.
 *
 *   It is deliberately unobtrusive — a muted icon button sized to sit inline beside a heading or
 *   at the end of a section. The content is plain text/nodes passed by the caller.
 *
 * Accessibility
 *   The trigger is a real <button> with an aria-label, so the tooltip is reachable by keyboard
 *   (focus) as well as pointer (hover) — Base UI's Tooltip opens on both. The icon itself is
 *   aria-hidden (the button's label carries the meaning).
 *
 * Placement
 *   Lives in src/components/concept/ — the shared concept composition layer (alongside ConceptHero,
 *   ConceptCard, ConceptSectionHeader). It was previously app-local at src/app/_components/ as a
 *   flagged-for-promotion file; the ds-tidy pass promoted it once the four concept-page callers
 *   confirmed it is shared concept chrome, not single-page furniture.
 *
 * Tokens
 *   shadcn-bridged semantic classes only (text-muted-foreground, hover:text-foreground,
 *   border-border) — these map to --bc-* tokens in globals.css, so no hardcoded hex. Light mode.
 *   No emoji (the icon is a lucide glyph).
 *
 * Key exports: InfoTooltip (named).
 * External dependencies: react (ReactNode), lucide-react (Info), @/components/ui/tooltip
 *   (Tooltip, TooltipTrigger, TooltipContent, TooltipProvider).
 */

import type { ReactNode } from 'react'
import { Info } from 'lucide-react'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@/components/ui/tooltip'

/** Props for InfoTooltip. */
type InfoTooltipProps = {
  /** The provenance/methodology content revealed on hover or focus. */
  children: ReactNode
  /**
   * Accessible label for the trigger button (what this "i" is about), e.g.
   * "Data sources and methodology". Explicit — no default (project no-default-param convention).
   */
  label: string
  /** Optional extra classes for spacing in a given context (the caller owns margins). */
  className?: string
}

/**
 * The info affordance. Renders a muted inline "i" button; on hover/focus a tooltip reveals the
 * provenance copy. Wrapped in its own TooltipProvider so callers can drop it anywhere without
 * needing a provider in their tree.
 */
export function InfoTooltip({
  children,
  label,
  className,
}: InfoTooltipProps) {
  const triggerClass =
    'inline-flex h-5 w-5 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:text-foreground hover:border-foreground/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
  const rootClass =
    className !== undefined ? `inline-flex ${className}` : 'inline-flex'

  return (
    <span className={rootClass}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger
            type="button"
            aria-label={label}
            className={triggerClass}
          >
            <Info className="h-3.5 w-3.5" aria-hidden="true" />
          </TooltipTrigger>
          {/* Wider, left-aligned content — provenance lines are sentences, not labels. */}
          <TooltipContent className="max-w-xs text-left leading-relaxed">
            {children}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </span>
  )
}
