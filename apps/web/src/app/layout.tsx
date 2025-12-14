import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"

const inter = Inter({ subsets: ["latin"], weight: ["300", "400", "500", "600"] })

import "../index.css";
import Providers from "../components/providers";
import Header from "../components/header";

export const metadata: Metadata = {
  title: "Essence | Minimalist E-commerce",
  description: "Premium products, elegant design, curated collections",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} font-sans antialiased`}>
        <Providers>
          <Header />
          <main className="pt-16">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  )
}
