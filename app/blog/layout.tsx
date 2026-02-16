import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Блог Сабки — AI, нейросети, промпты",
  description: "Практичные статьи о работе с ChatGPT, Claude, Gemini и DeepSeek. Сравнения, гайды, промпты.",
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <header className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6 flex items-center justify-between">
          <a href="/blog" className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
            Блог Сабки
          </a>
          <a
            href="https://sabka.pro?utm_source=blog&utm_medium=header"
            className="text-sm px-4 py-2 bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent-hover)] transition-colors font-medium"
          >
            Попробовать Сабку
          </a>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">{children}</main>
    </div>
  );
}
