"use client";

import { useEffect, useRef } from "react";

export function CopyableCode({ html }: { html: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const pres = container.querySelectorAll("pre");
    pres.forEach((pre) => {
      if (pre.querySelector(".copy-btn")) return;

      const wrapper = document.createElement("div");
      wrapper.className = "relative group";
      pre.parentNode?.insertBefore(wrapper, pre);
      wrapper.appendChild(pre);

      const btn = document.createElement("button");
      btn.className =
        "copy-btn absolute top-2 right-2 px-2 py-1 rounded-md text-xs font-medium " +
        "bg-zinc-700 text-zinc-300 hover:bg-zinc-600 hover:text-white " +
        "opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer";
      btn.textContent = "Скопировать";

      btn.addEventListener("click", async () => {
        const code = pre.querySelector("code")?.textContent ?? pre.textContent ?? "";
        await navigator.clipboard.writeText(code.trim());
        btn.textContent = "Скопировано!";
        btn.classList.add("!bg-emerald-600", "!text-white");
        setTimeout(() => {
          btn.textContent = "Скопировать";
          btn.classList.remove("!bg-emerald-600", "!text-white");
        }, 2000);
      });

      wrapper.appendChild(btn);
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
