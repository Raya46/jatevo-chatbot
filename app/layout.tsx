import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import { Toaster } from "sonner";
import PWAInstallPrompt from "@/components/pwa-install-prompt";
import PWAPerformanceMonitor from "@/components/pwa-performance-monitor";
import ServiceWorkerProvider from "@/components/service-worker-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { ImageProvider } from "@/contexts/image-context";

import "./globals.css";
import { SessionProvider } from "next-auth/react";

export const metadata: Metadata = {
  metadataBase: new URL("https://jatevo-chatbot-web.vercel.app/"),
  title: {
    default: "Jatevo Chatbot - AI-Powered Conversations",
    template: "%s | Jatevo Chatbot",
  },
  description:
    "Experience advanced AI conversations with Jatevo Chatbot. Features multiple AI models including GPT, DeepSeek, ZAI, and Gemini with tool calling capabilities for image generation, weather checks, and more.",
  keywords: [
    "AI chatbot",
    "Jatevo",
    "GPT",
    "DeepSeek",
    "ZAI",
    "Gemini",
    "AI conversation",
    "image generation",
    "AI tools",
    "chat AI",
    "artificial intelligence",
    "machine learning",
    "natural language processing",
  ],
  authors: [{ name: "Jatevo" }],
  creator: "Jatevo",
  publisher: "Jatevo",
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
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://jatevo-chatbot-web.vercel.app/",
    title: "Jatevo Chatbot - AI-Powered Conversations",
    description:
      "Experience advanced AI conversations with multiple models and tool calling capabilities.",
    siteName: "Jatevo Chatbot",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Jatevo Chatbot - AI-Powered Conversations",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Jatevo Chatbot - AI-Powered Conversations",
    description:
      "Experience advanced AI conversations with multiple models and tool calling capabilities.",
    images: ["/og-image.png"],
    creator: "@jatevo",
  },
  alternates: {
    canonical: "https://jatevo-chatbot-web.vercel.app/",
  },
  category: "technology",
  classification: "Artificial Intelligence",
  referrer: "origin-when-cross-origin",
};

export const viewport = {
  maximumScale: 1, // Disable auto-zoom on mobile Safari
};

const geist = Geist({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist-mono",
});

const LIGHT_THEME_COLOR = "hsl(0 0% 100%)";
const DARK_THEME_COLOR = "hsl(240deg 10% 3.92%)";
const THEME_COLOR_SCRIPT = `\
(function() {
  var html = document.documentElement;
  var meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', 'theme-color');
    document.head.appendChild(meta);
  }
  function updateThemeColor() {
    var isDark = html.classList.contains('dark');
    meta.setAttribute('content', isDark ? '${DARK_THEME_COLOR}' : '${LIGHT_THEME_COLOR}');
  }
  var observer = new MutationObserver(updateThemeColor);
  observer.observe(html, { attributes: true, attributeFilter: ['class'] });
  updateThemeColor();
})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      className={`${geist.variable} ${geistMono.variable}`}
      // `next-themes` injects an extra classname to the body element to avoid
      // visual flicker before hydration. Hence the `suppressHydrationWarning`
      // prop is necessary to avoid the React hydration mismatch warning.
      // https://github.com/pacocoursey/next-themes?tab=readme-ov-file#with-app
      lang="en"
      suppressHydrationWarning
    >
      <head>
        <script
          // biome-ignore lint/security/noDangerouslySetInnerHtml: "Required"
          dangerouslySetInnerHTML={{
            __html: THEME_COLOR_SCRIPT,
          }}
        />
      </head>
      <body className="antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          disableTransitionOnChange
          enableSystem
        >
          <Toaster position="top-center" />
          <Suspense fallback={<div>Loading...</div>}>
            <ImageProvider>
              <SessionProvider>{children}</SessionProvider>
            </ImageProvider>
          </Suspense>
          <ServiceWorkerProvider />
          <PWAInstallPrompt />
          <PWAPerformanceMonitor />
        </ThemeProvider>
      </body>
    </html>
  );
}
