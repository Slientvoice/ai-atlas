# Atlas Flow design system

## Contents

- Intent
- Visual grammar
- Surface hierarchy
- Motion architecture
- Glyph eligibility
- Responsive and accessibility rules
- Parameter baseline

## Intent

Atlas Flow combines scientific editorial design with a restrained computational atmosphere. It should feel like an instrument panel printed on translucent material, not a generic neon AI landing page. Preserve the target project's meaning and use the system to improve hierarchy, depth, and continuity.

## Visual grammar

Use a cold white base with blue and violet light rather than a dark cyberpunk palette.

Recommended tokens:

```css
--atlas-ink: #111318;
--atlas-ink-muted: #4b5159;
--atlas-blue: #365fd3;
--atlas-blue-soft: #b7ccff;
--atlas-paper: rgba(249, 251, 255, 0.42);
--atlas-paper-strong: rgba(249, 251, 255, 0.62);
--atlas-hairline: rgba(255, 255, 255, 0.62);
--atlas-radius-section: 32px;
--atlas-radius-control: 999px;
--atlas-shadow: 0 20px 60px rgba(38, 52, 111, 0.075);
--atlas-mono: "SFMono-Regular", "Cascadia Mono", "Segoe UI Mono", Consolas, monospace;
```

Combine large sans-serif display type with small mono labels. Use grids, coordinates, indices, short English technical labels, and thin rules as navigation grammar. Keep body text plain and readable. Do not turn ordinary copy into decorative pseudo-technical language.

## Surface hierarchy

Use three depths:

1. Global fluid atmosphere behind the application.
2. Large translucent glass sections with white borders and soft shadows.
3. Reading surfaces or controls inside sections with slightly higher opacity.

Keep the number of glass boundaries low. A page usually needs one glass surface per semantic chapter, not one per paragraph. Apply `position: relative`, `isolation: isolate`, and `overflow: hidden` to every glyph-enabled section so the character field is locally clipped.

Use dark glass sparingly for evidence, verification, safety, provenance, or a serious concluding contrast. Dark sections should normally contain no glyph field; the stillness is part of their hierarchy.

## Motion architecture

Use two separate systems:

### Global fluid

- Render once with WebGL behind the page.
- Keep it fixed to the viewport and pointer-transparent.
- Use slow multiscale noise, cold gradients, and subtle pointer energy.
- Baseline shader time multiplier: `0.043`.
- Increase or decrease speed in steps no larger than about 15–20%.

### Local glyph wake

- Render one 2D canvas per opted-in glass section.
- Size it from the section bounding box and observe resizes.
- Convert client pointer coordinates into section-local coordinates.
- Use a regular 12px desktop grid and 14px compact/mobile grid.
- Draw only `o`, `>`, and `_`.
- Assign glyphs by energy: high energy `o`, middle energy `>`, low energy `_`.
- Let low-energy cells move more strongly in the wind so the edge travels while drying.
- Support narrow directional trails, irregular edges, click expansion, repeated-click stacking, diffusion, advection, and gradual decay.
- Keep canvases `pointer-events: none`; listen without blocking the application.

The effect must look structured at rest and organic in time. Do not use freely positioned particle sprites, random symbol choice, a fixed circular radial gradient, or a global full-page glyph canvas.

## Glyph eligibility

Opt in only when all are true:

- The section is a large light/translucent atmospheric surface.
- The content remains readable with a faint symbol wake behind it.
- The section has enough open space for trails to breathe.
- The interaction does not imply the symbols represent real data.

Do not mount glyphs in:

- dark evidence or verification sections;
- navigation and sticky controls;
- dialogs, forms, editors, and dense dashboards;
- small nested cards;
- places where motion competes with an existing visualization.

## Responsive and accessibility rules

- Honor `prefers-reduced-motion` by hiding the glyph canvas and stopping avoidable animation.
- Cap canvas device pixel ratio to control memory use.
- Preserve keyboard focus indicators and pointer behavior.
- Ensure text contrast is independent of the moving background.
- Recalculate local canvas dimensions when a section reflows.
- Avoid running invisible animation when document visibility is hidden.

## Parameter baseline

Start from the bundled source values. Tune only after the page is structurally complete.

| Parameter | Baseline |
|---|---:|
| Fluid time multiplier | `0.043` |
| Glyph grid spacing | `12px` desktop / `14px` compact |
| Desktop glyph size | `11.5px` |
| Pointer trail radius | about `28px`, narrowed by speed |
| Click expansion radius | about `110px`, increased by repeated clicks |
| Click stack window | `680ms` within `64px` |
| Energy decay | `exp(-0.46 × delta)` |
| Section radius | `32px` desktop / `24px` compact |
