"use client";

import * as React from "react";
import * as CollapsiblePrimitive from "@radix-ui/react-collapsible";
import { cn } from "@/lib/utils";

export const Collapsible = CollapsiblePrimitive.Root;

export function CollapsibleTrigger({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.Trigger>) {
  return (
    <CollapsiblePrimitive.Trigger
      className={cn(
        "flex items-center justify-between gap-2 font-medium transition-all [&[data-state=open]>svg]:rotate-180",
        className
      )}
      {...props}
    />
  );
}

export function CollapsibleContent({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.Content>) {
  return (
    <CollapsiblePrimitive.Content
      className={cn(
        "overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down",
        className
      )}
      {...props}
    >
      <div className="">{children}</div>
    </CollapsiblePrimitive.Content>
  );
}
