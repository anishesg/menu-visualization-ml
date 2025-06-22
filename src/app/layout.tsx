import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://menuvision.vercel.app'),
  title: "MenuVision | AI-Powered Menu Visualization",
  description: "Transform your restaurant menu photos into stunning visual menus with AI-powered food image matching. Upload, extract text, and discover beautiful food photography automatically.",
  keywords: ["menu visualization", "restaurant", "AI", "food photography", "menu digitization", "OpenAI", "Google Search"],
  authors: [{ name: "MenuVision" }],
  creator: "MenuVision",
  publisher: "MenuVision",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://menuvision.vercel.app',
    title: 'MenuVision | AI-Powered Menu Visualization',
    description: 'Transform your restaurant menu photos into stunning visual menus with AI-powered food image matching.',
    siteName: 'MenuVision',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'MenuVision - AI Menu Visualization Tool',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MenuVision | AI-Powered Menu Visualization',
    description: 'Transform your restaurant menu photos into stunning visual menus with AI-powered food image matching.',
    images: ['/og-image.png'],
  },
  category: 'technology',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#3b82f6',
  colorScheme: 'light',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon.svg" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="MenuVision" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#3b82f6" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="icon" type="image/svg+xml" href="/icon.svg" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
