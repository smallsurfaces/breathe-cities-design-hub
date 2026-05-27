/**
 * LessonSharing.tsx — the peer-network participation strand.
 *
 * Purpose
 *   Lesson sharing is BC's fourth pillar, but it is RELATIONAL (city-to-city) rather than a
 *   city-level support intensity — so it does not belong on the support radar (which plots
 *   the three city-level pillars). This component surfaces it directly: the city's role in
 *   the BC peer network, split into two directions.
 *     - Gave (teacher): the city shared a playbook, mentored/hosted a peer, presented at a
 *       forum.
 *     - Received (learner): the city adopted a peer's approach or joined an exchange.
 *
 *   Framing (consistent with the rest of the concept): city-as-actor — each entry reads as
 *   the city doing the thing, with the peer city named when there is a specific one. This is
 *   the city's network PARTICIPATION, not a score.
 *
 *   HONESTY (load-bearing): an early-learner city with no documented exchanges has an empty
 *   list on one or both sides. We never fabricate a peer claim — an empty side renders a
 *   truthful early-stage state ("Early — building peer connections"). The two-direction
 *   structure is always present so the same component holds a teacher-heavy city later (e.g.
 *   London) and an early learner (Accra) without any shape change.
 *
 * Rendering approach
 *   Two columns (gave / received), each a card with a heading, a direction icon, and either
 *   the entries or the honest empty state. Lesson sharing's pillar colour (BC pillar 4 =
 *   green) tints the accents so the strand reads as part of the same pillar system as the
 *   radar/timeline. Colours are BC tokens only (no hardcoded hex). Light theme. No emoji
 *   (lucide icons only).
 *
 * Key exports: LessonSharing (named)
 * External dependencies: react (types), lucide-react (Handshake, GraduationCap, MapPin),
 *   ../_data/types (LessonSharingEntry).
 */

import type { ReactElement } from 'react'
import { Handshake, GraduationCap, MapPin } from 'lucide-react'
import type { LessonSharingEntry } from '../_data/types'

/**
 * BC pillar-4 (Lesson sharing) colour token — used to tint the strand's accents so it reads
 * as part of the same pillar system as the timeline and radar. Token only (no hardcoded hex).
 */
const LESSON_PILLAR_COLOR = 'var(--bc-color-green)'

/** Static config for one direction column — keeps the two columns symmetrical and data-driven. */
type DirectionColumn = {
  /** Which direction this column renders. */
  direction: LessonSharingEntry['direction']
  /** Column heading. */
  title: string
  /** One-line description of what this direction means. */
  blurb: string
  /** The lucide icon component for this direction. */
  Icon: typeof Handshake
  /** Copy shown when this direction has no entries (honest early-stage state). */
  emptyLabel: string
  emptyNote: string
}

/**
 * The two columns, in display order: Gave (teacher) then Received (learner). Both columns
 * always render — an empty column shows its honest early-stage state rather than disappearing.
 */
const COLUMNS: readonly DirectionColumn[] = [
  {
    direction: 'gave',
    title: 'Shared with peers',
    blurb: 'Where the city has taught — shared a playbook, mentored or hosted a peer, or presented at a forum.',
    Icon: Handshake,
    emptyLabel: 'Early — building peer connections',
    emptyNote:
      'No shared playbooks or peer mentoring documented yet. As the city matures it will have lessons to pass on here.',
  },
  {
    direction: 'received',
    title: 'Learned from peers',
    blurb:
      'Where the city has learned — adopted a peer city’s approach or joined an exchange.',
    Icon: GraduationCap,
    emptyLabel: 'Early — building peer connections',
    emptyNote:
      'No adopted approaches or exchanges documented yet. Early-stage members start by building their own foundations.',
  },
]

/** Props for LessonSharing. */
type LessonSharingProps = {
  /** Display name of the city whose participation this is (city-as-actor copy). */
  cityName: string
  /** The city's lesson-sharing entries (both directions; may be empty). */
  entries: LessonSharingEntry[]
}

/** One entry row within a direction column. */
function EntryRow({ entry }: { entry: LessonSharingEntry }): ReactElement {
  return (
    <li className="rounded-xl border border-border bg-muted/40 p-4">
      <p className="text-sm font-medium text-foreground">{entry.headline}</p>
      {(entry.peerCity !== undefined || entry.date !== undefined) && (
        <p className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-muted-foreground">
          {entry.peerCity !== undefined && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3" aria-hidden="true" />
              {entry.peerCity}
            </span>
          )}
          {entry.peerCity !== undefined && entry.date !== undefined && (
            <span aria-hidden="true">·</span>
          )}
          {entry.date !== undefined && <span>{entry.date}</span>}
        </p>
      )}
    </li>
  )
}

/** The honest early-stage state shown when a direction has no documented entries. */
function EmptyState({
  label,
  note,
}: {
  label: string
  note: string
}): ReactElement {
  return (
    <div
      className="rounded-xl border border-dashed border-border p-4"
      // Faint pillar-tinted wash so the empty state still reads as part of the strand.
      style={{
        backgroundColor: `color-mix(in srgb, ${LESSON_PILLAR_COLOR} 6%, var(--bc-color-white))`,
      }}
    >
      <p className="text-sm font-medium text-foreground">{label}</p>
      <p className="mt-1 text-xs text-muted-foreground">{note}</p>
    </div>
  )
}

/**
 * The participation strand. Renders both direction columns (gave / received). Each column
 * filters the city's entries by its direction and shows them, or the honest early-stage
 * empty state when there are none.
 */
export function LessonSharing({
  cityName,
  entries,
}: LessonSharingProps): ReactElement {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {COLUMNS.map((column) => {
        const columnEntries = entries.filter(
          (entry) => entry.direction === column.direction,
        )
        const Icon = column.Icon
        return (
          <div
            key={column.direction}
            className="rounded-2xl border border-border bg-background p-5"
          >
            <div className="flex items-start gap-3">
              <span
                aria-hidden="true"
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full"
                style={{
                  backgroundColor: `color-mix(in srgb, ${LESSON_PILLAR_COLOR} 14%, var(--bc-color-white))`,
                  color: LESSON_PILLAR_COLOR,
                }}
              >
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-foreground">
                  {column.title}
                </h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {column.blurb}
                </p>
              </div>
            </div>

            <div className="mt-4">
              {columnEntries.length > 0 ? (
                <ul className="space-y-2">
                  {columnEntries.map((entry) => (
                    <EntryRow key={entry.id} entry={entry} />
                  ))}
                </ul>
              ) : (
                <EmptyState label={column.emptyLabel} note={column.emptyNote} />
              )}
            </div>

            <p className="mt-3 text-[11px] text-muted-foreground">
              {cityName}&rsquo;s participation in the Breathe Cities peer network.
            </p>
          </div>
        )
      })}
    </div>
  )
}
