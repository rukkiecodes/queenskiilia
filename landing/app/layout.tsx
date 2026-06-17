import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://queenskilla.app";

const TITLE = "QueenSkiilia — From Skill to Real Experience";
const DESCRIPTION =
  "Talent gets overlooked for lacking experience. QueenSkiilia lets you learn, prove your skills, get connected to real paid work, and build your career with confidence. Join the waiting list.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: "%s · QueenSkiilia",
  },
  description: DESCRIPTION,
  applicationName: "QueenSkiilia",
  keywords: [
    "skill marketplace",
    "student jobs",
    "freelance for students",
    "skill assessment",
    "verified portfolio",
    "escrow payments",
    "get experience",
    "QueenSkiilia",
  ],
  authors: [{ name: "QueenSkiilia" }],
  creator: "QueenSkiilia",
  publisher: "QueenSkiilia",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "QueenSkiilia",
    title: TITLE,
    description: DESCRIPTION,
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "QueenSkiilia — From Skill to Real Experience",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/og.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  category: "business",
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "QueenSkiilia",
  url: SITE_URL,
  logo: `${SITE_URL}/icon.png`,
  slogan: "From Skill to Real Experience",
  description: DESCRIPTION,
  email: "support@queenskilla.app",
  sameAs: [] as string[],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
      </body>
    </html>
  );
}
