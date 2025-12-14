"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Icon component: thin line SVG wrapper
 * Accepts full SVG props to avoid prop type mismatches when spreading React.SVGProps
 */
type IconProps = React.SVGProps<SVGSVGElement> & {
  size?: number | string;
  strokeWidth?: number | string;
  className?: string;
};

export function Icon({
  children,
  size = 20,
  strokeWidth = 1.5,
  className,
  ...props
}: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("inline-block align-middle", className)}
      {...(props as React.SVGProps<SVGSVGElement>)}
    >
      {children}
    </svg>
  );
}

export default Icon;