import { generateFlash } from "@/lib/gemini";
import { supabase } from "@/lib/supabase";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID!;

export async function sendTelegramAnnouncement(slug: string): Promise<void> {
  // Get the post
  const { data: post } = await supabase
    .from("blog_posts")
    .select("title, meta_desc, slug")
    .eq("slug", slug)
    .single();

  if (!post) throw new Error(`Post not found: ${slug}`);

  // Generate hook
  const hook = await generateFlash(
    `Напиши анонс статьи для Telegram-канала (2-3 предложения, без эмодзи, интригующе).
Заголовок: "${post.title}"
Описание: "${post.meta_desc}"
Только текст анонса, без кавычек.`
  );

  const blogUrl = process.env.BLOG_URL ?? "https://blog.sabka.pro";
  const message = `<b>${post.title}</b>\n\n${hook.trim()}\n\n<a href="${blogUrl}/blog/${post.slug}">Читать статью</a>`;

  // Send to Telegram
  const res = await fetch(
    `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: CHANNEL_ID,
        text: message,
        parse_mode: "HTML",
        disable_web_page_preview: false,
      }),
    }
  );

  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Telegram send failed: ${JSON.stringify(err)}`);
  }

  // Mark as sent
  await supabase
    .from("blog_posts")
    .update({ telegram_sent: true })
    .eq("slug", slug);
}
