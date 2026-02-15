import { supabase } from "@/lib/supabase";

export async function GET() {
  const { data: posts } = await supabase
    .from("blog_posts")
    .select("slug, title, meta_desc, published_at, content_html")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(20);

  const blogUrl = process.env.BLOG_URL ?? "https://sabka-blog.vercel.app";
  const items = (posts ?? [])
    .map(
      (p) => `
    <item>
      <title><![CDATA[${p.title}]]></title>
      <link>${blogUrl}/blog/${p.slug}</link>
      <guid isPermaLink="true">${blogUrl}/blog/${p.slug}</guid>
      <description><![CDATA[${p.meta_desc ?? ""}]]></description>
      <pubDate>${new Date(p.published_at).toUTCString()}</pubDate>
    </item>`
    )
    .join("");

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Блог Сабки</title>
    <link>${blogUrl}/blog</link>
    <description>Практичные статьи о ChatGPT, Claude, Gemini и DeepSeek</description>
    <language>ru</language>
    <atom:link href="${blogUrl}/blog/feed.xml" rel="self" type="application/rss+xml"/>
    ${items}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "s-maxage=3600, stale-while-revalidate",
    },
  });
}
