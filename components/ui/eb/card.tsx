import * as React from "react";
import { cn } from "@/lib/utils";

type EbCardProps = React.HTMLAttributes<HTMLElement> & {
  /** hero: tinte indigo arriba a la izquierda (tarjeta "Gastado") */
  variant?: "default" | "hero";
  /**
   * desktop: radio 26px y sombra profunda. mobile: radio 24px y sombra
   * mas corta. list / list-sm: listas agrupadas de movil (22px / 18px).
   */
  size?: "desktop" | "mobile" | "list" | "list-sm";
  as?: "section" | "div" | "article";
  ref?: React.Ref<HTMLElement>;
};

const RADIUS: Record<NonNullable<EbCardProps["size"]>, string> = {
  desktop: "rounded-[26px]",
  mobile: "rounded-[24px]",
  list: "rounded-[22px]",
  "list-sm": "rounded-[18px]",
};

export function EbCard({
  variant = "default",
  size = "desktop",
  as = "section",
  className,
  ...props
}: EbCardProps) {
  const Tag = as as React.ElementType;
  return (
    <Tag
      className={cn(
        "eb-card",
        size !== "desktop" && "eb-card--sm",
        variant === "hero" && "eb-card--hero",
        RADIUS[size],
        className
      )}
      {...props}
    />
  );
}
