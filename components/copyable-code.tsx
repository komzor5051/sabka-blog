"use client";

import { useEffect, useRef } from "react";

function addCopyButton(el: HTMLElement, getText: () => string) {
  const wrapper = document.createElement("div");
  wrapper.className = "relative group";
  el.parentNode?.insertBefore(wrapper, el);
  wrapper.appendChild(el);

  const btn = document.createElement("button");
  btn.className =
    "copy-btn absolute top-2 right-2 px-2 py-1 rounded-md text-xs font-medium " +
    "bg-zinc-700 text-zinc-300 hover:bg-zinc-600 hover:text-white " +
    "opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-10";
  btn.textContent = "Скопировать";

  btn.addEventListener("click", async () => {
    await navigator.clipboard.writeText(getText().trim());
    btn.textContent = "Скопировано!";
    btn.classList.add("!bg-emerald-600", "!text-white");
    setTimeout(() => {
      btn.textContent = "Скопировать";
      btn.classList.remove("!bg-emerald-600", "!text-white");
    }, 2000);
  });

  wrapper.appendChild(btn);
}

export function CopyableCode({ html }: { html: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Code blocks (<pre>)
    container.querySelectorAll("pre").forEach((pre) => {
      if (pre.closest(".group")) return;
      addCopyButton(pre, () => pre.querySelector("code")?.textContent ?? pre.textContent ?? "");
    });

    // 2. Long inline <code> inside <p> (prompts, commands — 60+ chars)
    container.querySelectorAll("p > code, li > code").forEach((code) => {
      const text = code.textContent ?? "";
      if (text.length < 60) return;
      if (code.closest(".group")) return;

      // Convert inline code to a block-like element for better UX
      const block = document.createElement("div");
      block.className =
        "my-3 p-3 rounded-lg bg-zinc-100 dark:bg-zinc-800/80 text-sm font-mono " +
        "leading-relaxed whitespace-pre-wrap break-words";
      block.textContent = text;

      const parent = code.parentElement!;
      // If the <p> only contains this <code>, replace the whole <p>
      if (parent.childNodes.length === 1) {
        parent.replaceWith(block);
      } else {
        // Otherwise insert block after the parent paragraph
        code.replaceWith(block);
      }

      addCopyButton(block, () => text);
    });
  }, [html]);

  return (
    <div
      ref={containerRef}
      className="prose prose-zinc dark:prose-invert max-w-none prose-headings:font-bold prose-h2:text-2xl prose-h3:text-xl prose-a:text-[var(--accent)] dark:prose-a:text-[var(--accent)] prose-img:rounded-xl prose-img:shadow-md"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
