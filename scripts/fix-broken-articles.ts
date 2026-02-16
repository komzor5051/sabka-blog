import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";
import { marked } from "marked";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[ёЁ]/g, "е")
    .replace(/[а-яА-Я]/g, (ch) => {
      const map: Record<string, string> = {
        а:"a",б:"b",в:"v",г:"g",д:"d",е:"e",ж:"zh",з:"z",и:"i",й:"y",
        к:"k",л:"l",м:"m",н:"n",о:"o",п:"p",р:"r",с:"s",т:"t",у:"u",
        ф:"f",х:"kh",ц:"ts",ч:"ch",ш:"sh",щ:"shch",ъ:"",ы:"y",ь:"",
        э:"e",ю:"yu",я:"ya",
      };
      return map[ch.toLowerCase()] ?? ch;
    })
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function stripCodeFence(text: string): string {
  const trimmed = text.trim();
  const match = trimmed.match(/^```(?:markdown|md|html)?\s*\n([\s\S]*?)\n```\s*$/);
  return match ? match[1] : trimmed;
}

function renderMarkdown(md: string): string {
  const renderer = new marked.Renderer();
  const headingIds = new Map<string, number>();

  renderer.heading = ({ text, depth }: { text: string; depth: number }) => {
    const plain = text.replace(/<[^>]*>/g, "");
    let id = slugify(plain);
    const count = headingIds.get(id) ?? 0;
    headingIds.set(id, count + 1);
    if (count > 0) id = `${id}-${count}`;
    return `<h${depth} id="${id}">${text}</h${depth}>\n`;
  };

  return marked.parse(md, { async: false, renderer }) as string;
}

async function main() {
  const sb = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );

  const { data } = await sb
    .from("blog_posts")
    .select("id, slug, title, content_md, content_html")
    .eq("status", "published");

  if (!data) {
    console.log("No articles found");
    return;
  }

  let fixed = 0;
  for (const p of data) {
    const md = p.content_md ?? "";
    const needsFix = md.trimStart().startsWith("```");

    if (!needsFix) {
      console.log(`OK: ${p.slug}`);
      continue;
    }

    const cleanMd = stripCodeFence(md);
    const newHtml = renderMarkdown(cleanMd);

    const { error } = await sb
      .from("blog_posts")
      .update({ content_md: cleanMd, content_html: newHtml })
      .eq("id", p.id);

    if (error) {
      console.error(`FAIL: ${p.slug} — ${error.message}`);
    } else {
      console.log(`FIXED: ${p.slug}`);
      fixed++;
    }
  }

  console.log(`\nDone. Fixed ${fixed} articles.`);
}

main();
