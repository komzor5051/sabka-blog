import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";

async function main() {
  const sb = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );

  const { data } = await sb
    .from("blog_posts")
    .select("id, slug, title, content_md, content_html")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  if (!data) {
    console.log("no data");
    return;
  }

  for (const p of data) {
    const md = p.content_md ?? "";
    const html = p.content_html ?? "";
    const broken =
      md.trimStart().startsWith("```") || html.includes("<pre><code");
    console.log(
      broken ? "BROKEN" : "OK    ",
      "|",
      p.slug.slice(0, 55),
      "|",
      p.title.slice(0, 55)
    );
  }
}

main();
