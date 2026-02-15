import type { Metadata } from "next";
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
  title: {
    default: "Блог Сабки — AI, нейросети, промпты",
    template: "%s | Блог Сабки",
  },
  description: "Практичные статьи о ChatGPT, Claude, Gemini и DeepSeek. Сравнения моделей, гайды, промпты и AI-автоматизация.",
  metadataBase: new URL("https://sabka-blog.vercel.app"),
  openGraph: {
    type: "website",
    siteName: "Блог Сабки",
    locale: "ru_RU",
  },
  twitter: {
    card: "summary_large_image",
  },
  icons: {
    icon: { url: "/favicon.svg", type: "image/svg+xml" },
  },
  alternates: {
    types: {
      "application/rss+xml": "/blog/feed.xml",
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
