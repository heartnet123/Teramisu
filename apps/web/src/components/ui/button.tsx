import * as React from "react";
import { Slot as SlotPrimitive } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Minimalist glassy button styles
 * - Uses Inter (thin) via global CSS variables
 * - Small compact sizes by default
 * - Thin borders, subtle shadows, and backdrop blur for glassmorphism
 */
const buttonVariants = cva(
	"glass-button inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-extralight transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
	{
		variants: {
			variant: {
				default:
					"bg-primary/85 text-primary-foreground border border-white/10 shadow-sm hover:bg-primary/95",
				destructive:
					"bg-destructive/85 text-destructive-foreground border border-destructive/10 shadow-sm hover:bg-destructive/95 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40",
				outline:
					"border border-[color:var(--color-border)] bg-transparent text-foreground shadow-sm hover:bg-[color:var(--color-popover)]/40",
				secondary:
					"bg-secondary/70 text-secondary-foreground border border-white/8 shadow-sm hover:bg-secondary/85",
				ghost:
					"bg-transparent text-foreground hover:bg-[color:var(--color-accent)]/10 dark:hover:bg-[color:var(--color-accent)]/12",
				link: "text-primary underline-offset-4 hover:underline bg-transparent px-0 py-0",
			},
			size: {
				default: "h-8 px-3 py-1 has-[>svg]:px-2",
				sm: "h-7 rounded-md gap-1 px-2 text-xs has-[>svg]:px-1.5",
				lg: "h-10 rounded-md px-5 text-sm has-[>svg]:px-3",
				icon: "p-2 h-9 w-9",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	},
);

function Button({
	className,
	variant,
	size,
	asChild = false,
	...props
}: React.ComponentProps<"button"> &
	VariantProps<typeof buttonVariants> & {
		asChild?: boolean;
	}) {
	const Comp = asChild ? SlotPrimitive.Slot : "button";

	return (
		<Comp
			data-slot="button"
			className={cn(buttonVariants({ variant, size, className }))}
			{...props}
		/>
	);
}

export { Button, buttonVariants };
