import type React from "react";
import type { Metadata, Viewport } from "next";
import { Sarabun, Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-inter",
});

const sarabun = Sarabun({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sarabun",
});

import "../index.css";
import Providers from "../components/providers";
import Header from "../components/header";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://teramisu.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Teramisu | ร้านค้าออนไลน์คุณภาพพรีเมียม",
    template: "%s | Teramisu",
  },
  description:
    "ช้อปสินค้าคุณภาพพรีเมียม เฟอร์นิเจอร์ ของตกแต่งบ้าน และสินค้าไลฟ์สไตล์ ส่งฟรีทั่วประเทศ ชำระเงินสะดวกด้วย PromptPay",
  keywords: [
    "ร้านค้าออนไลน์",
    "เฟอร์นิเจอร์",
    "ของตกแต่งบ้าน",
    "โคมไฟ",
    "เก้าอี้",
    "โต๊ะ",
    "Teramisu",
    "ช้อปออนไลน์",
    "ส่งฟรี",
  ],
  authors: [{ name: "Teramisu" }],
  creator: "Teramisu",
  publisher: "Teramisu",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "th_TH",
    url: siteUrl,
    siteName: "Teramisu",
    title: "Teramisu | ร้านค้าออนไลน์คุณภาพพรีเมียม",
    description:
      "ช้อปสินค้าคุณภาพพรีเมียม เฟอร์นิเจอร์ ของตกแต่งบ้าน และสินค้าไลฟ์สไตล์ ส่งฟรีทั่วประเทศ",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Teramisu - Premium E-commerce",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Teramisu | ร้านค้าออนไลน์คุณภาพพรีเมียม",
    description:
      "ช้อปสินค้าคุณภาพพรีเมียม เฟอร์นิเจอร์ ของตกแต่งบ้าน และสินค้าไลฟ์สไตล์",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
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
  manifest: "/manifest.json",
  alternates: {
    canonical: siteUrl,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body
        className={`${inter.variable} ${sarabun.variable} font-sans antialiased`}
      >
        <Providers>
          <Header />
          <main className="pt-16">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
