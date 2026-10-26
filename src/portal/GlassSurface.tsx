import type { HTMLAttributes } from "react";
import { SectionGlyphField } from "./AmbientEffects";

type GlassSurfaceProps = HTMLAttributes<HTMLElement> & {
  as?: "section" | "header" | "aside";
  motion?: "glyphs" | "quiet";
};

// Light reading surfaces share one motion rule. Diagrams opt out explicitly.
export default function GlassSurface({
  as: Tag = "section",
  motion = "glyphs",
  className = "",
  children,
  ...props
}: GlassSurfaceProps) {
  return (
    <Tag {...props} className={`home-glass ${className}`} data-atlas-motion={motion}>
      {motion === "glyphs" && <SectionGlyphField />}
      {children}
    </Tag>
  );
}
