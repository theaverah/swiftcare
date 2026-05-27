# DESIGN-SYSTEM.md — SwiftCare

This file defines the visual language of SwiftCare. All UI decisions should follow these guidelines. When a Figma design is provided, it always takes priority over what is written here. This file exists to fill in gaps and keep things consistent when no Figma reference is available.

> This is a living document. Update it as the design evolves throughout the project.

---

## Brand Identity

SwiftCare is a telehealth platform that feels clean, calm, and trustworthy. The visual language should communicate clarity and confidence — not clinical coldness, not bubbly friendliness. Think premium, minimal, modern healthcare.

---

## Color Tokens

```css
--brand:           #008786;  /* primary brand, mint green — CTAs, active states, links */
--brand-sub:       #E6F4EF;  /* section backgrounds, tags, subtle highlights */
--text-main:       #111111;  /* primary text, headings */
--text-sub:        #6F6F6F;  /* secondary text, captions, default icon color */
--elements:        #EAEAEA;  /* dividers, borders, inactive elements */
--background-main: #FFFFFF;  /* page background */
--background-sub:  #F3F3F3;  /* card backgrounds, focused sections */
--success:         #23C65F;  /* online indicators, checkmarks, confirmed states */
--warning:         #E18246;  /* warning banners, cautionary text */
--error:           #822D34;  /* errors, destructive actions */
```

### Usage Notes
- use `--brand` for primary buttons, active nav items, links, and key interactive elements
- use `--brand-sub` for pill tags, selected states, and subtle section backgrounds
- use `--background-sub` for cards, sidebars, and content containers
- use `--elements` for all dividers, input borders, and decorative lines
- use `--text-sub` as the default color for icons unless they are interactive or active

---

## Typography

**Font family:** Apercu Pro (all weights)

> If Apercu Pro is unavailable or not loading, fall back to: `Inter, system-ui, sans-serif`

### Type Scale

| Name | Size | Weight | Word Spacing | Usage |
|---|---|---|---|---|
| display | 48px | Bold | -0.08em | Hero headings only |
| h1 | 40px | Bold | -0.08em | Page titles |
| h2 | 32px | Bold | -0.08em | Section headings |
| h3 | 24px | Medium or Bold | -0.08em | Card headings, modal titles |
| h4 | 20px | Medium | 0 | Subheadings |
| body-lg | 18px | Regular | 0 | Emphasized body text |
| body | 16px | Regular | 0 | Default body text |
| body-sm | 14px | Regular | 0 | Secondary info, captions |
| label | 12px | Medium | 0 | Form labels, tags, badges |

### Rules
- headings use `--text-main`
- body and secondary text use `--text-main` or `--text-sub` depending on hierarchy
- never go below 12px
- line height: 1.5 for body, 1.2 for headings

---

## Spacing System

Base unit is **8px**. All spacing, padding, gap, and sizing values must be multiples of 8. Multiples of 4 or 2 are allowed for very small elements or fine adjustments.

```
2px   — micro adjustments only
4px   — tight spacing, icon gaps, small badges
8px   — default small spacing
12px  — small component padding (exception, multiple of 4)
16px  — standard component padding
24px  — comfortable spacing between elements
32px  — section spacing
40px  — large section spacing
48px  — major section breaks
64px  — page-level vertical rhythm
80px  — hero sections
96px  — maximum section padding
```

---

## Border Radius

```
2px  — tags, small badges, subtle chips
4px  — inputs, small buttons, inline elements
8px  — cards, standard buttons, dropdowns, modals
12px — large cards, bottom sheets (exception, for visual comfort)
```

---

## Shadows

Keep shadows extremely subtle. Use borders over shadows where possible.

```css
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.06);         /* inputs on focus, subtle lift */
--shadow-md: 0 2px 8px rgba(0, 0, 0, 0.08);         /* cards, dropdowns */
--shadow-lg: 0 4px 16px rgba(0, 0, 0, 0.10);        /* modals, popovers */
```

Default cards: use `--background-sub` background + `1px solid var(--elements)` border. Add `--shadow-sm` only when elevation is needed for context.

---

## Icons

**Library:** Lucide React (already installed)

**Style:** Outline only — never use filled variants.

**Default size:** 20px (adjustable to 16px for compact UI, 24px for emphasis)

**Default color:** `--text-sub` (`#6F6F6F`)

**Active/interactive color:** `--brand` (`#008786`)

**Usage:**
```tsx
import { Calendar, User, Stethoscope } from "lucide-react"

<Calendar size={20} className="text-[var(--text-sub)]" />
```

---

## Component Guidelines

### Buttons

| Variant | Background | Text | Border | Use case |
|---|---|---|---|---|
| Primary | `--brand` | white | none | Main CTAs |
| Secondary | `--brand-sub` | `--brand` | none | Secondary actions |
| Outline | transparent | `--text-main` | `--elements` | Tertiary actions |
| Ghost | transparent | `--text-sub` | none | Subtle actions |
| Destructive | `--error` | white | none | Delete, cancel |

- border radius: 8px
- padding: 12px 16px (medium), 8px 12px (small)
- font: 14px medium
- always show a clear hover and focus state

### Inputs

- border: `1px solid var(--elements)`
- border radius: 4px
- padding: 12px 16px
- focus border: `1px solid var(--brand)`
- error border: `1px solid var(--error)`
- background: `--background-main`
- placeholder color: `--text-sub`

### Cards

- background: `--background-sub`
- border: `1px solid var(--elements)`
- border radius: 8px
- padding: 24px
- shadow: `--shadow-sm` if elevated

### Badges and Tags

- border radius: 2px or 4px
- font: 12px medium
- padding: 4px 8px
- status colors map to semantic tokens (success, warning, error, brand-sub)

---

## States

| State | Treatment |
|---|---|
| Hover | 10% darker or brand tint background |
| Focus | `2px solid var(--brand)` outline, offset 2px |
| Disabled | 40% opacity, no pointer events |
| Loading | skeleton shimmer using `--elements` → `--background-sub` |
| Error | `--error` border and text below input |
| Success | `--success` icon or text confirmation |
| Empty | centered illustration or icon + `--text-sub` message |

---

## Layout

- max content width: 1280px, centered
- page horizontal padding: 24px (mobile), 48px (tablet), 64px+ (desktop)
- sidebar width (doctor/patient dashboards): 240px
- use CSS grid and flexbox, no fixed pixel layouts
- desktop-first, but all layouts must be fully responsive

---

## Motion

Everything should feel alive and smooth — not static. Every interaction, transition, and page load should have intentional animation. The goal is a "properly made website" feel where nothing snaps or jumps.

### Timing

```
duration-fast:   150ms  — micro interactions (button press, toggle, checkbox)
duration-base:   250ms  — standard transitions (hover, focus, dropdown open)
duration-slow:   400ms  — page transitions, modals, drawers sliding in
duration-reveal: 600ms  — page load reveals, section entrances
easing:          ease-out for entrances, ease-in for exits, ease-in-out for loops
```

### Rules

- **no static UI** — every meaningful state change should animate
- **tab switching** — animate content fade + slight translate when switching tabs
- **dropdowns and menus** — smooth fade + scale from origin point, never instant
- **modals and drawers** — slide in with fade, never pop in abruptly
- **page load / refresh** — each section, line, or component should stagger in with a downward shift (translate-y from -8px to 0) + fade in. stagger delay: 50-80ms per element. this creates the "everything settling into place" feel
- no bouncy or elastic animations — everything is smooth and professional
- no animations on data-heavy tables or long lists (performance)

### Page Load Stagger Pattern

```tsx
// each section gets a stagger delay based on its index
<div
  className="animate-fadeInDown"
  style={{ animationDelay: `${index * 60}ms` }}
/>

// in globals.css
@keyframes fadeInDown {
  from { opacity: 0; transform: translateY(-8px); }
  to   { opacity: 1; transform: translateY(0); }
}
.animate-fadeInDown {
  animation: fadeInDown 600ms ease-out both;
}
```

---

## Loading States

Every element that fetches data must have a loading state. Nothing should be blank or flash in without transition.

### Skeleton Shimmer

Use a CSS class called `skeleton` for all loading placeholders:

```css
.skeleton {
  background: linear-gradient(
    105deg,
    var(--elements) 40%,
    rgba(255, 255, 255, 0.6) 50%,
    var(--elements) 60%
  );
  background-size: 200% 100%;
  background-position: 100% 0;
  animation: shimmer 2.2s linear infinite;
  border-radius: inherit;
}

@keyframes shimmer {
  to { background-position: -100% 0; }
}
```

Apply `skeleton` to the container while loading, remove it once data is ready.

### Blur-up Reveal for Media (Images and Videos)

When media loads, reveal it with a smooth blur-up transition:

```tsx
// start: opacity-0 blur-md scale-105
// end:   opacity-100 blur-0 scale-100
// duration: 700ms ease-out

const [loaded, setLoaded] = useState(false)

useEffect(() => {
  // race condition fix: handle already-cached media
  if (imageRef.current?.complete) setLoaded(true)
  if (videoRef.current?.readyState >= 2) setLoaded(true)
}, [])

<div className={loaded ? "" : "skeleton"}>
  <img
    ref={imageRef}
    onLoad={() => setLoaded(true)}
    className={`transition-all duration-700 ease-out ${
      loaded ? "opacity-100 blur-0 scale-100" : "opacity-0 blur-md scale-105"
    }`}
  />
</div>
```

### Loading State Coverage

Every one of these must have a skeleton or spinner:
- doctor cards while fetching doctors list
- appointment list while fetching appointments
- profile data while fetching user info
- medical records while loading
- any dashboard stat or count
- notification list

---

## Do's and Don'ts

**Do:**
- use lots of white space
- let the brand color breathe — don't overuse it
- keep hierarchy clear through size and weight, not just color
- use `--brand-sub` for selected/active states instead of full brand color on backgrounds

**Don't:**
- use more than 2 font weights on one screen
- add shadows where a border will do
- use filled icons
- mix border radius values on the same component
- use color alone to convey meaning (always pair with text or icon)