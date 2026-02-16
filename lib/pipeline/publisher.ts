import { supabase } from "@/lib/supabase";
import { slugify, renderMarkdown } from "@/lib/utils";
import { generateFlash } from "@/lib/gemini";

interface PublishInput {
  topicId: string;
  title: string;
  content: string;
  tags: string[];
  coverImage?: string | null;
}

export async function publishPost(input: PublishInput): Promise<string> {
  // Shorten title if > 55 chars (SEO best practice)
  let title = input.title;
  if (title.length > 55) {
    console.log(`[publisher] Title too long (${title.length} chars), shortening...`);
    title = await generateFlash(
      `Сократи заголовок статьи до 55 символов максимум, сохрани смысл и ключевые слова. Верни ТОЛЬКО заголовок, без кавычек и пояснений.\n\nЗаголовок: "${title}"`
    );
    title = title.trim().replace(/^["«]|["»]$/g, "");
    if (title.length > 55) {
      title = title.slice(0, 52) + "...";
    }
    console.log(`[publisher] Shortened title: "${title}" (${title.length} chars)`);
  }

  const slug = slugify(title);
  const contentHtml = renderMarkdown(input.content);

  // Generate meta description
  const metaDesc = await generateFlash(
    `Напиши SEO мета-описание (РОВНО 150-155 символов) для статьи с заголовком "${title}". Только текст, без кавычек.`
  );

  const { data, error } = await supabase
    .from("blog_posts")
    .insert({
      topic_id: input.topicId,
      slug,
      title,
      meta_desc: metaDesc.trim().slice(0, 160),
      content_md: input.content,
      content_html: contentHtml,
      cover_image: input.coverImage ?? null,
      tags: input.tags,
      cta_url: `https://sabka.pro?utm_source=blog&utm_medium=article&utm_campaign=${slug}`,
      status: "published",
      published_at: new Date().toISOString(),
    })
    .select("slug")
    .single();

  if (error) throw new Error(`Publish failed: ${error.message}`);

  // Mark topic as used
  await supabase
    .from("blog_topics")
    .update({ status: "used", used_at: new Date().toISOString() })
    .eq("id", input.topicId);

  return data.slug;
}
