# Design System Audit — breathecities.org

**Extracted:** 2026-03-13
**Source:** https://breathecities.org
**Stack:** WordPress + Flynt theme + Tailwind CSS + CSS custom properties

---

## Colours

### Global Palette

| Token | Hex | Usage |
|---|---|---|
| `color/white` | `#ffffff` | Page background |
| `color/darkBlue` | `#003574` | Primary text, headers, accent sections |
| `color/blue` | `#0071c7` | Brand buttons, links |
| `color/lightBlue` | `#23bced` | Hover states |
| `color/teal` | `#2BCDB0` | Secondary accent |
| `color/lightTeal` | `#BAF0E6` | Subtle backgrounds, highlights |
| `color/green` | `#03ab3d` | Success states |
| `color/tangerine` | `#f55200` | Error states, CTAs |
| `color/yellow` | `#e8f000` | Highlight accent |
| `color/lightGrey` | `#f3f8fe` | Borders, subtle backgrounds |
| `color/steel` | `#b2c2d5` | Muted elements |
| `color/darkBlueDim` | `#002a5b` | Deep backgrounds |

### Semantic Aliases (CSS vars on the site)

| Alias | References | Original CSS var |
|---|---|---|
| `--bgColor` | white | `#ffffff` |
| `--textColor` | darkBlue | `#003574` |
| `--brandColor` | blue | `#0071c7` |
| `--accentColor` | darkBlue | `#003574` |
| `--hoverColor` | lightBlue | `#23bced` |
| `--borderColor` | lightGrey | `#f3f8fe` |
| `--errorColor` | tangerine | `#f55200` |
| `--successColor` | green | `#03ab3d` |

---

## Typography

### Fonts

| Role | Family | Weights | Hosting |
|---|---|---|---|
| Primary | Söhne | 300 (Buch), 500 (Halbfett), 700 (Kraftig) | Self-hosted .woff2 |
| Monospace | Aeonik Mono | regular | Self-hosted |
| Fallback | ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial | — | System |

### Type Scale (responsive)

| Token | Mobile | 780px | 1600px | Line Height |
|---|---|---|---|---|
| `titleLarge` | 4rem | — | 5.25rem | 1.09 |
| `titleMedium` | 2.125rem | — | 2.875rem | 1.09–1.33 |
| `titleSmall` | 1.25rem | 1.5rem | 2.125rem | 1.25 |
| `titleSub` | 1.125rem | 1.375rem | 1.625rem | 1.33 |
| `body` | 1rem | 1.125rem | 1.25rem | 1.44–1.5 |
| `bodySmall` | 1rem | — | 1.125rem | 1.5 |
| `bodySmaller` | 0.875rem | — | 1rem | 1.5 |
| `caption` | 0.938rem | — | 1.125rem | 1.44 |
| `linkSmall` | 0.75rem | 1rem | — | — |

Letter spacing: `0.5px` on some headings.

---

## Spacing

Base unit: **10px**

| Token | Value | Usage |
|---|---|---|
| `spacing/xs` | 10px | Tight padding, icon gaps |
| `spacing/sm` | 20px | Component padding |
| `spacing/md` | 40px | Section padding |
| `spacing/lg` | 60px | Section gaps |
| `spacing/xl` | 80px | Major sections |
| `spacing/2xl` | 120px | Page-level spacing |
| `spacing/3xl` | 148px | Hero and large gaps |

Container padding: `clamp(1rem, 2.5vw + 0.25rem, 2.25rem)` (fluid)

---

## Border Radius

| Token | Value | Usage |
|---|---|---|
| `none` | 0 | Sharp corners |
| `sm` | 4px | Tags, badges |
| `md` | 10px | Cards, inputs |
| `circle` | 50% | Avatars |
| `pill` | 9999px | Buttons |

---

## Shadows

Flat design — minimal shadows used.

| Token | Value |
|---|---|
| `shadow/none` | none |
| `shadow/sm` | `0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)` |
| `shadow/lg` | `0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)` |

---

## Transitions

| Token | Value | Usage |
|---|---|---|
| `fast` | 200ms ease-in-out | Button hover, colour changes |
| `medium` | 300ms ease-in-out | Border, opacity |
| `slow` | 450ms cubic-bezier(0.19,1,0.22,1) | Scroll animations, carousels |

---

## Layout & Grid

| Property | Value |
|---|---|
| Container max-width | 1880px |
| Content max-width | 1080px |
| Reading line length | 55ch |
| Navigation height | 70px |

### Breakpoints

| Name | Width | Notes |
|---|---|---|
| sm | 640px | Tailwind default |
| md | 780px | Major typography shift |
| lg | 980px | Carousel adjustments |
| xl | 1080px | Caption size increase |
| 2xl | 1281px | Large desktop |
| 3xl | 1441px | Wide desktop |
| 4xl | 1600px | Extra-wide (major font scale) |
| ultra | 1880px | Max container |

---

## Component Inventory

See `components/README.md` for full component documentation.

Key components:
- `NavigationMain` — top nav, 70px tall, hamburger on mobile
- `BlockHeader` — page hero with large heading
- `BlockImageText` — alternating image/text columns
- `BlockCarouselCities` — Swiper.js carousel
- `BlockScrollySlides` — scroll-triggered animation sections
- `BlockPartners` — logo grid on dark background
- `BlockNewsletter` — Mailchimp email capture
- Buttons: 8 variants (brand, accent, outline, arrow, link, external, card, icon)

---

## Technical Stack

| Layer | Technology |
|---|---|
| CMS | WordPress |
| Theme | Flynt (component-based PHP theme) |
| CSS | Tailwind CSS + CSS custom properties |
| Forms | Contact Form 7 (WCF7) |
| Sliders | Swiper.js |
| Fonts | Self-hosted .woff2 (Söhne, Aeonik Mono) |
| Icons | Custom inline SVGs |
| Images | Lazy-loaded via `load:on="idle"`, data-srcset for responsive |

---

## Brand Tone

- **Aesthetic:** Clean, modern, data-forward
- **Audience:** Global policymakers, urban planners, environmental advocates
- **Palette philosophy:** Restrained — white base, dark blue for authority, light blue for approachability
- **Motion:** Intentional — scrollytelling, smooth carousel transitions
- **Accessibility:** High contrast text/background pairs throughout
