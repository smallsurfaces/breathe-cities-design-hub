/**
 * CoverageStrip.tsx
 *
 * Purpose: Compact horizontal strip showing which of the 11 domains a city
 * has acted in. Used on city detail pages as a visual summary. Each dot is
 * filled (active) or empty (not yet), with a tooltip showing the domain name.
 *
 * Key exports: CoverageStrip
 * External dependencies: shadcn Tooltip, roadmap-data
 */

"use client";

import Link from "next/link";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { DOMAINS, COVERAGE_MATRIX } from "@/data/roadmap-data";

interface CoverageStripProps {
  citySlug: string;
}

/** Horizontal row of 11 dots showing domain coverage for a single city */
export function CoverageStrip({ citySlug }: CoverageStripProps) {
  const coverage = COVERAGE_MATRIX[citySlug] ?? [];

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {DOMAINS.map((domain, idx) => {
        const active = coverage[idx] ?? false;
        return (
          <Tooltip key={domain.id}>
            {active ? (
              <TooltipTrigger
                render={
                  <Link
                    href={`/ux-concepts/best-practice-roadmap-v2/domain/${domain.slug}#${citySlug}`}
                    className="inline-flex items-center justify-center"
                  />
                }
              >
                <span className="inline-block w-5 h-5 rounded-full bg-foreground/70 hover:bg-foreground transition-colors" />
              </TooltipTrigger>
            ) : (
              <TooltipTrigger className="cursor-default">
                <span className="inline-block w-5 h-5 rounded-full bg-muted" />
              </TooltipTrigger>
            )}
            <TooltipContent side="top">
              <span>
                {domain.shortName}
                {active ? "" : " — not yet"}
              </span>
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}
