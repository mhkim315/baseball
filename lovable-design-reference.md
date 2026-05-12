# Lovable Design System Reference (getdesign.md)

## 1. Visual Theme & Atmosphere
- Warm parchment background (#f7f4ed) — not white, not beige, a deliberate cream
- Camera Plain Variable typeface with humanist warmth and editorial letter-spacing
- Opacity-driven color system: all grays derived from #1c1c1c at varying transparency levels
- Inset shadow technique on buttons: rgba(255,255,255,0.2) 0px 0.5px 0px 0px inset, rgba(0,0,0,0.2) 0px 0px 0px 0.5px inset
- Warm neutral border palette: #eceae4 for subtle, rgba(28,28,28,0.4) for interactive
- Full-pill radius (9999px) used extensively for action buttons and icon containers
- Focus state uses rgba(0,0,0,0.1) 0px 4px 12px shadow for soft, warm emphasis
- shadcn/ui + Radix UI component primitives with Tailwind CSS utility styling

## 2. Color Palette & Roles

### Primary
- **Cream** (#f7f4ed): Page background, card surfaces, button surfaces. The foundation — warm, paper-like, human.

### Neutral Scale (Opacity-Based)
- Charcoal 100% (#1c1c1c): Primary text, headings, dark surfaces.
- Charcoal 83% (rgba(28,28,28,0.83)): Strong secondary text.
- Charcoal 82% (rgba(28,28,28,0.82)): Body copy.
- Muted Gray (#5f5f5d): Secondary text, descriptions, captions.
- Charcoal 40% (rgba(28,28,28,0.4)): Interactive borders, button outlines.
- Charcoal 4% (rgba(28,28,28,0.04)): Subtle hover backgrounds, micro-tints.
- Charcoal 3% (rgba(28,28,28,0.03)): Barely-visible overlays, background depth.

### Surface & Border
- Light Cream (#eceae4): Card borders, dividers, image outlines. The warm divider line.
- Cream Surface (#f7f4ed): Card backgrounds, section fills — same as page background for seamless integration.

### Interactive
- Ring Blue (#3b82f6 at 50% opacity): --tw-ring-color, Tailwind focus ring.
- Focus Shadow (rgba(0,0,0,0.1) 0px 4px 12px): Focus and active state shadow — soft, warm, diffused.

### Inset Shadows
- Button Inset (rgba(255,255,255,0.2) 0px 0.5px 0px 0px inset, rgba(0,0,0,0.2) 0px 0px 0px 0.5px inset, rgba(0,0,0,0.05) 0px 1px 2px 0px): Thick, layered inset for tactile depth.

## 3. Typography Rules

### Font Family
- Primary: 'Camera Plain Variable', with fallbacks: 'ui-sans-serif, system-ui'
- Weight range: 400 (body/reading), 480 (special display), 600 (headings/emphasis)
- Feature: Variable font with continuous weight axis

### Principles
- Warm humanist voice
- Variable weight as design tool
- Compression at scale: Headlines use negative letter-spacing (-0.9px to -1.5px)
- Two weights, clear roles: 400 (body/UI/links/buttons) and 600 (headings/emphasis)

## 4. Component Stylings

### Buttons
- Primary Dark (Inset Shadow): Background #1c1c1c, text cream, full-pill radius, inset shadow
- Secondary Outline: Background transparent, border rgba(28,28,28,0.4), text #1c1c1c
- Ghost/Text: No background, no border, text with hover underline

### Cards
- Background: #f7f4ed (same as page) or white
- Border: 1px solid #eceae4
- Border-radius: 16px (rounded-2xl)
- Shadow: none or very subtle

### Spacing
- Section padding: 80px-120px vertical
- Card padding: 24px-32px
- Component gap: 16px-24px
- Micro gap: 8px-12px
