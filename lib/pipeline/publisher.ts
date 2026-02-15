import { supabase } from "@/lib/supabase";
import { slugify, renderMarkdown } from "@/lib/utils";
import { generateFlash } from "@/lib/gemini";

interface PublishInput {
  topicId: string;
  title: string;
  content: string;
  tags: string[];
}

export async function publishPost(input: PublishInput): Promise<string> {
  const slug = slugify(input.title);
  const contentHtml = renderMarkdown(input.content);

  // Generate meta description
  const metaDesc = await generateFlash(
    `Напиши SEO мета-описание (РОВНО 150-155 символов) для статьи с заголовком "${input.title}". Только текст, без кавычек.`
  );

  const { data, error } = await supabase
    .from("blog_posts")
    .insert({
      topic_id: input.topicId,
      slug,
      title: input.title,
      meta_desc: metaDesc.trim().slice(0, 160),
      content_md: input.content,
      content_html: contentHtml,
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
