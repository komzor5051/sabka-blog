"use client";

import { useEffect, useState, useRef } from "react";

interface TocItem {
  id: string;
  text: string;
  level: 2 | 3;
}

function parseHeadings(html: string): TocItem[] {
  const regex = /<h([23])\s[^>]*id="([^"]*)"[^>]*>(.*?)<\/h[23]>/gi;
  const items: TocItem[] = [];
  let match;
  while ((match = regex.exec(html)) !== null) {
    items.push({
      level: parseInt(match[1]) as 2 | 3,
      id: match[2],
      text: match[3].replace(/<[^>]*>/g, ""),
    });
  }
  return items;
}

export function TableOfContents({ html }: { html: string }) {
  const items = parseHeadings(html);
  const [activeId, setActiveId] = useState<string>("");
  const [isOpen, setIsOpen] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (items.length === 0) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: "0px 0px -80% 0px", threshold: 0.1 }
    );

    for (const item of items) {
      const el = document.getElementById(item.id);
      if (el) observerRef.current.observe(el);
    }

    return () => observerRef.current?.disconnect();
  }, [items]);

  if (items.length < 3) return null;

  return (
    <>
      {/* Mobile: collapsible */}
      <nav className="lg:hidden mb-4" aria-label="Оглавление">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 text-xs font-semibold tracking-wider text-zinc-900 dark:text-zinc-100 w-full py-2.5 px-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800"
        >
          <svg className={`w-3.5 h-3.5 transition-transform ${isOpen ? "rotate-90" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          ОГЛАВЛЕНИЕ
        </button>
        {isOpen && (
          <ul className="mt-1 space-y-0.5 px-2 pb-2 bg-zinc-50 dark:bg-zinc-900 rounded-b-lg border border-t-0 border-zinc-200 dark:border-zinc-800">
            {items.map((item) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  onClick={() => setIsOpen(false)}
                  className={`block py-1 text-[13px] leading-snug transition-colors ${
                    item.level === 3 ? "pl-3" : ""
                  } ${
                    activeId === item.id
                      ? "text-[var(--accent)] font-medium"
                      : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                  }`}
                >
                  {item.text}
                </a>
              </li>
            ))}
          </ul>
        )}
      </nav>

      {/* Desktop: sticky sidebar */}
      <nav
        className="hidden lg:block sticky top-24 self-start w-52 shrink-0 max-h-[calc(100vh-8rem)] overflow-y-auto"
        aria-label="Оглавление"
      >
        <p className="text-[11px] font-bold tracking-wider text-zinc-400 dark:text-zinc-500 uppercase mb-2">
          Оглавление
        </p>
        <ul className="space-y-0.5 border-l border-zinc-200 dark:border-zinc-800">
          {items.map((item) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                className={`block py-1 text-[13px] leading-snug transition-all border-l -ml-px ${
                  item.level === 3 ? "pl-5" : "pl-3"
                } ${
                  activeId === item.id
                    ? "border-[var(--accent)] text-[var(--accent)] font-medium"
                    : "border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:border-zinc-400"
                }`}
              >
                {item.text}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
