"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

/**
 * ThemeProvider
 * - uses `class` attribute strategy so Tailwind + theme toggles work via .dark class
 * - provides a simple wrapper that ensures Inter is used via CSS variable set in
 *   [`apps/web/src/index.css`](apps/web/src/index.css:1)
 */
export function ThemeProvider({
	children,
	...props
}: React.ComponentProps<typeof NextThemesProvider>) {
	return (
		<NextThemesProvider attribute="class" defaultTheme="system" {...props}>
			{/* Ensure the Inter CSS variable is applied to the provider root */}
			<div style={{ fontFamily: "var(--font-inter)", fontSize: "var(--base-font-size)" }}>
				{children}
			</div>
		</NextThemesProvider>
	);
}
