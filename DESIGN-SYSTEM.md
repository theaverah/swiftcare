# DESIGN-SYSTEM.md — SwiftCare

This file defines the visual language of SwiftCare. All UI decisions should follow these guidelines. When a Figma design is provided, it always takes priority over what is written here. This file exists to fill in gaps and keep things consistent when no Figma reference is available.

> This is a living document. Update it as the design evolves throughout the project.

---

## Brand Identity

SwiftCare is a telehealth platform that feels clean, calm, and trustworthy. The visual language should communicate clarity and confidence — not clinical coldness, not bubbly friendliness. Think premium, minimal, modern healthcare.

---

## Color Tokens

```css
--brand:           #008786;  /* primary brand, teal — CTAs, active states, links */
--brand-sub:       #E6F4EF;  /* section backgrounds, tags, subtle highlights */
--text-main:       #111111;  /* primary text, headings */
--text-sub:        #6F6F6F;  /* secondary text, captions, default icon color */
--elements:        #EAEAEA;  /* borders, inactive elements */
--background-main: #FFFFFF;  /* page background */
--background-sub:  #F3F3F3;  /* card backgrounds, focused sections */
--success:         #0F8946;  /* online indicators, checkmarks, valid field borders */
--warning:         #E18246;  /* warning banners, cautionary text */
--error:           #E24F62;  /* errors, destructive actions, invalid field borders */
```

### Dividers
Use `bg-elements/50` (50% opacity of `--elements`) for horizontal rule dividers — this gives a softer line on white without disappearing.

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

| Name | Size | Weight | Letter Spacing | Usage |
|---|---|---|---|---|
| display | 48px | Medium | -0.08em | Hero headings only |
| h1 | 40px | Medium | -0.08em | Page titles |
| h2 | 32px | Medium | -0.08em | Section headings |
| h3 | 24px | Medium | -0.08em | Auth page titles, modal titles |
| h4 | 20px | Medium | 0 | Subheadings |
| body | 16px | Regular or Medium | 0 | **Default for all UI text** — nav labels, descriptions, button text, form labels, inputs, menu items, card content, notification messages, everything that isn't a heading |
| label | 14px | Regular | 0 | Secondary captions only — timestamps, email addresses under names, sub-labels like "Profile" beneath a name in sidebar. Never go below 14px. |

### Rules
- use **Medium (500)** weight throughout forms and interactive elements — not Bold
- headings use `--text-main`
- **16px is the default for all non-heading text** — when in doubt, use 16px
- 14px is reserved for secondary captions only (timestamps, email addresses under names, helper sub-labels)
- line height: 1.5 for body, 1.2 for headings
- sidebar width: 264px (`w-66`)
- search bar height: 52px (`h-13`)

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
4px  — very small inline elements only
8px  — inputs, buttons, dropdowns, small form elements (rounded-lg)
12px — dashboard cards, modals, drawers, doctor cards, consultation cards (rounded-xl)
```

- **`rounded-lg` (8px)** — inputs, buttons, filter chips, inline form elements
- **`rounded-xl` (12px)** — all dashboard cards, modals, drawers, popovers, doctor/consultation cards
- **`rounded-full`** — avatars, status badges, pill tags, filter chip selected states

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
| Primary | `--text-main` | `--brand-sub` | none | Main form CTAs (Continue, Submit) |
| Brand | `--brand` | white | none | Brand-colored CTAs |
| Secondary | `--brand-sub` | `--brand` | none | Secondary actions |
| Outline | transparent | `--text-main` | `--elements` | Tertiary actions |
| Ghost | transparent | `--text-sub` | none | Subtle actions |
| Destructive | `--error` | white | none | Delete, cancel |

- height: 40px (`h-10`)
- border radius: 8px (`rounded-lg`)
- font: 14px medium
- disabled state: 40% opacity (`bg-text-main/40`), `cursor-not-allowed`
- hover: `hover:opacity-90`
- always show a clear hover and focus state

### Inputs

- height: 40px (`h-10`)
- border: `1px solid var(--elements)`
- border radius: 8px (`rounded-lg`)
- padding: `px-4`
- font size: 14px, medium weight
- focus border: `1px solid var(--text-main)` — black, not brand color
- valid border: `1px solid var(--success)` — goes green as soon as the value is valid
- error border: `1px solid var(--error)`
- background: `--background-main`
- placeholder color: `--text-sub`
- label → input gap: 6px (`gap-1.5`)
- success icon: bare `Check` (16px, no circle background) in `--success` color
- password eye toggle: `EyeOff` by default (hidden), `Eye` when revealed; persists until field blur

### Cards

- background: `--background-main` (white) for selection/interactive cards; `--background-sub` for content cards
- border: `1px solid var(--elements)`
- border radius: 8px (`rounded-lg`)
- padding: 14–16px
- shadow: `--shadow-sm` only when elevation is needed for context

**Selection cards** (e.g. role picker):
- default border: `--elements`
- hover border: `--text-sub` (border only, no fill change)
- selected border: `--text-main` (black)
- error border: `--error`
- radio indicator: 18px circle, filled dot animates in on select
- label: 14px medium, `--text-main`
- description: 14px regular, `--text-sub`, indented to align with label start

### Badges and Tags

- border radius: 2px or 4px
- font: 12px medium
- padding: 4px 8px
- status colors map to semantic tokens (success, warning, error, brand-sub)

### Empty States

Used wherever a list or section has no content to show.

**Structure:**
```
illustration (w-66, max-w-full, opacity-90)
  ↕ gap-4 (16px)
text group (flex-col gap-1 = 4px between lines)
  main text  — 16px medium, --text-main
  subtext    — 16px regular, --text-sub
  CTA link   — 16px regular, --brand, hover:underline (if action available)
```

**Rules:**
- Always use the same `no-data.svg` illustration across all empty states for consistency
- Main text is always a statement: "No upcoming consultations."
- Subtext is a hint or next action
- If the subtext is a navigable CTA, use `text-brand hover:underline` — never `hover:opacity`
- Never underline by default — only on hover
- Container: `flex flex-col items-center gap-4 py-16 text-center`

### Tabs

Used for switching between related content views (e.g. Upcoming / Past / Cancelled).

**Sliding indicator pattern** — do not use `border-b` on individual buttons:
```tsx
// Container: position relative, border-b on the row
<div ref={tabsRef} className="relative flex border-b border-elements">
  {/* Sliding brand underline — absolutely positioned */}
  <div
    className="absolute bottom-0 h-0.5 bg-brand transition-all duration-200 ease-out"
    style={{ left: indicator.left, width: indicator.width }}
  />
  {/* Tab buttons: data-tab attribute required for measurement */}
  <button data-tab={key} ...>Label</button>
</div>
```

**Measurement with `useLayoutEffect`:**
```tsx
useLayoutEffect(() => {
  const btns = tabsRef.current.querySelectorAll<HTMLButtonElement>("button[data-tab]");
  const btn  = btns[activeIndex];
  if (btn) setIndicator({ left: btn.offsetLeft, width: btn.offsetWidth });
}, [activeTab]);
```

**Tab button style:**
- `px-4 py-2.5 text-[16px] font-medium`
- active: `text-text-main`
- inactive: `text-text-sub hover:text-text-main`
- Count badge: `bg-brand text-white` (active), `bg-elements text-text-sub` (inactive), `rounded-full text-[11px]`

**Content panel:** add `key={activeTab}` + `className="animate-tabIn"` to trigger the slide-in on every switch.

### Filter Chips

Filter chips are interactive pill-shaped buttons used in scrollable filter rows (e.g. Find a Doctor).

- border radius: `rounded-full` (pill) — exception to the 8px standard; chips are a distinct pattern
- height: 32px (`h-8`)
- padding: `px-3`
- font: 13px medium
- default state: `bg-transparent border-elements text-text-main`
- hover state: `border-text-sub/60`
- active/selected state: `bg-brand-sub border-brand text-brand`
- active chip has a `×` button inline to clear the filter
- inactive chip has a `ChevronDown` icon that rotates 180° when the popover is open
- clicking a chip opens a dropdown popover anchored below-left
- dropdown: `bg-bg-main border-elements rounded-lg shadow-md min-w-[180px]`
- each option in the dropdown: 14px, `hover:bg-bg-sub`, checkmark on selected option
- a "Clear all" text link (`text-brand`) appears after the chips when any filter is active

Scrollable chip row: `overflow-x-auto` with `scrollbar-hide` class to hide the scrollbar.

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
| Empty | illustration (`w-66`) + bold main text + secondary text/link — see Empty States section |

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
- **tab switching** — sliding brand indicator (`h-0.5 bg-brand transition-all duration-200`) measured via `offsetLeft/offsetWidth`; content panel uses `animate-tabIn` (fade + 6px upward slide, 220ms) triggered by `key={activeTab}` remount
- **dropdowns and menus** — smooth fade + scale from origin point, never instant
- **modals and drawers** — slide in with fade, never pop in abruptly
- **page load / refresh** — each section, line, or component should stagger in with a downward shift (translate-y from -8px to 0) + fade in. stagger delay: 50-80ms per element. this creates the "everything settling into place" feel
- no bouncy or elastic animations — everything is smooth and professional
- no animations on data-heavy tables or long lists (performance)

### Page Transitions

Every route change triggers `src/app/template.tsx`, which re-mounts on navigation and fires `animate-pageIn`:

```css
@keyframes pageIn {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}
.animate-pageIn {
  animation: pageIn 350ms cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
}
```

No packages needed — purely CSS + Next.js `template.tsx` file convention.

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

/* Tab panel transition — triggered by key={activeTab} */
@keyframes tabIn {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}
.animate-tabIn {
  animation: tabIn 220ms cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
}
```

---

## Form Layout Patterns

Established from the registration screen — use this as the baseline for all auth and form screens.

### Container
- max-width: `max-w-lg` (512px) for auth/narrow forms
- centered on page: `min-h-screen flex items-center justify-center`
- inner gap between sections: `gap-4` (16px)
- sections separated by dividers: `h-px bg-elements/50`

### Field Group
```
label (14px medium, --text-main)
  ↕ gap-1.5 (6px)
input (h-10, rounded-lg, border-elements)
```

### Field Border States
| State | Border color |
|---|---|
| Default | `--elements` |
| Focused | `--text-main` (black) |
| Valid | `--success` |
| Error | `--error` |

### Password Field
- conditions panel appears on focus or typing, collapses smoothly (`duration-500 ease-in-out`) when all conditions are met
- condition items: 14px circle indicator (filled `--success`) + 14px text
- border goes `--success` as soon as all conditions pass, even while focused
- eye icon (`EyeOff` default / `Eye` revealed) stays visible until blur, then swaps to bare `Check`

### Primary CTA Button
- full width (`w-full`)
- `h-10 rounded-lg`
- inactive: `bg-text-main/40 cursor-not-allowed`
- active: `bg-text-main hover:opacity-90`
- text: 14px medium, `--brand-sub`

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

## Languages

Supported consultation languages across the SwiftCare doctor network:

- English
- Filipino
- Spanish
- Cebuano
- Mandarin

Add new languages here when they appear in doctor profiles.

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