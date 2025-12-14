"use client";

import { ThemeProvider } from "./theme-provider";
import { Toaster } from "./ui/sonner";

import { StoreProvider } from "../service/store";

export default function Providers({ children }: { children: React.ReactNode }) {
	return (
		<ThemeProvider
			attribute="class"
			defaultTheme="system"
			enableSystem
			disableTransitionOnChange
		>
			<StoreProvider>
				{children}
				<Toaster richColors />
			</StoreProvider>
		</ThemeProvider>
	);
}
