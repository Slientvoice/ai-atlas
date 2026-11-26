import type { HTMLAttributes } from "react";

type GlassSurfaceProps = HTMLAttributes<HTMLElement> & {
  as?: "section" | "header" | "aside";
};

export default function GlassSurface({
  as: Tag = "section",
  className = "",
  children,
  ...props
}: GlassSurfaceProps) {
  return (
    <Tag {...props} className={`home-glass ${className}`} data-glyph-block>
      {children}
    </Tag>
  );
}
