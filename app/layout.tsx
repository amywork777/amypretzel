import type { Metadata, Viewport } from "next";
import { Instrument_Serif, Manrope, JetBrains_Mono, Silkscreen } from "next/font/google";
import "./globals.css";

const instrumentSerif = Instrument_Serif({
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-display",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

// kept for the fishing easter-egg page only
const silkscreen = Silkscreen({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-pixel",
});

const SITE_URL = "https://amypretzel.com";
const SITE_DESC =
  "Amy Zhou, designer and engineer in San Francisco. Currently at Vizcom building AI tools for industrial designers; previously Apple and Stanford.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Amy Zhou",
    template: "%s, Amy Zhou",
  },
  description: SITE_DESC,
  applicationName: "Amy Zhou",
  authors: [{ name: "Amy Zhou", url: SITE_URL }],
  creator: "Amy Zhou",
  publisher: "Amy Zhou",
  keywords: [
    "Amy Zhou",
    "amypretzel",
    "product design",
    "mechanical engineering",
    "industrial design",
    "AI hardware",
    "AI tools",
    "Vizcom",
    "Apple",
    "Stanford",
    "Taiyaki",
    "Taya",
    "Mobius",
    "jewelry",
    "wearables",
    "San Francisco",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    siteName: "Amy Zhou",
    url: SITE_URL,
    locale: "en_US",
    title: "Amy Zhou",
    description: SITE_DESC,
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Amy Zhou" }],
  },
  twitter: {
    card: "summary_large_image",
    creator: "@amypretzel",
    site: "@amypretzel",
    title: "Amy Zhou",
    description: SITE_DESC,
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${instrumentSerif.variable} ${manrope.variable} ${mono.variable} ${silkscreen.variable}`}
    >
      <body className="font-body antialiased text-ink bg-paper">{children}</body>
    </html>
  );
}
