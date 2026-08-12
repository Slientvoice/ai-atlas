---
name: atlas-flow-design
description: "Apply the reusable Atlas Flow visual system to websites and web applications: cold white/blue-violet fluid atmosphere, translucent glass engineering surfaces, grid-based editorial typography, and the local three-tier o/greater-than/underscore glyph wake. Use when creating, restyling, or extending portals, landing pages, dashboards, documentation sites, and other web UIs that should match the AI Atlas portal aesthetic, including requests that mention Atlas Flow, AI Atlas style, glass modules, fluid backgrounds, or the character wake effect."
---

# Atlas Flow Design

Apply Atlas Flow as a visual and atmospheric layer while preserving the product's information architecture, copy, data, and behavior unless the user explicitly requests structural changes.

## Workflow

1. Inspect the existing framework, layout, styles, responsive behavior, and motion preferences.
2. Read [references/design-system.md](references/design-system.md) before making design decisions.
3. Reuse the implementation in `assets/react/` for React-compatible projects. Copy and adapt it instead of recreating the fluid or glyph algorithms from a prompt.
4. Establish tokens and glass surfaces first, then add atmospheric motion.
5. Mount exactly one global `<AtlasFlowAtmosphere />` per page or application shell.
6. Mount `<SectionGlyphField />` only inside eligible light glass sections. Keep it absent from dark evidence/verification sections, navigation, modals, forms, and dense control surfaces unless the user explicitly asks otherwise.
7. Validate the build and the interaction contract before publishing.

## Integration contract

Use this structure for an eligible section:

```tsx
<main className="atlas-flow-page">
  <AtlasFlowAtmosphere />
  <section className="atlas-glass-section atlas-glass-section--light">
    <SectionGlyphField />
    <div>{/* existing content */}</div>
  </section>
  <section className="atlas-glass-section atlas-glass-section--dark">
    {/* Do not mount SectionGlyphField here. */}
    <div>{/* evidence or verification content */}</div>
  </section>
</main>
```

Preserve these invariants:

- Keep the fluid atmosphere global, fixed, noninteractive, and behind all content.
- Keep each glyph canvas local to one section so it scrolls with that section and clips at its rounded boundary.
- Keep content above glyphs and keep glyph canvases pointer-transparent.
- Preserve the `o` high-energy core, `>` middle band, `_` edge, and energy-driven decay sequence.
- Preserve click stacking, irregular diffusion, trail narrowing, wind advection, and reduced-motion behavior.
- Treat glyphs as atmosphere, not content or data visualization.
- Avoid official Codex names, marks, imagery, or claims of an exact official implementation. Call this system Atlas Flow.

## Adaptation rules

- Recompose modules around the target project's real content; do not duplicate the AI Atlas page structure blindly.
- Use fewer, larger glass regions instead of wrapping every small card in glass.
- Maintain strong type hierarchy and readable opaque-enough content surfaces.
- Prefer quiet motion. Change parameters in small increments and record intentional deviations.
- On non-React stacks, port the same two-layer architecture and interaction semantics; do not substitute a generic particle library.

## Validation

Verify all of the following:

- Scrolling moves existing glyph traces with their owning section.
- Trails and click bursts never cross into gaps, adjacent sections, or the page background.
- Dark verification/evidence sections produce no trail or click glyphs.
- Text, links, and controls remain above the canvases and fully interactive.
- One global fluid layer renders and moves without obvious looping seams.
- `prefers-reduced-motion` disables glyph motion and avoids unnecessary animation.
- Responsive layouts retain the same hierarchy without overflowing canvases.
- The project build and relevant tests pass.
