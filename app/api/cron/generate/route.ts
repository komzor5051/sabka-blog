import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { searchSources } from "@/lib/researcher";
import { writeArticle } from "@/lib/pipeline/writer";
import { runAllEditors } from "@/lib/pipeline/editors";
import { generateArticleImages } from "@/lib/pipeline/image-generator";
import { publishPost } from "@/lib/pipeline/publisher";
import { slugify } from "@/lib/utils";

export const maxDuration = 300;

export async function GET(request: Request) {
  // Verify Vercel Cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Select top pending topic
    const { data: topic } = await supabase
      .from("blog_topics")
      .select("*")
      .eq("status", "pending")
      .order("score", { ascending: false })
      .limit(1)
      .single();

    if (!topic) {
      return NextResponse.json({ message: "No pending topics" });
    }

    // Mark as writing to prevent duplicate picks
    await supabase
      .from("blog_topics")
      .update({ status: "writing" })
      .eq("id", topic.id);

    // Research
    const sources = await searchSources(
      `${topic.title} ${(topic.keywords ?? []).join(" ")}`,
      6
    );

    // Write (includes image placeholders)
    const draft = await writeArticle({
      title: topic.title,
      angle: topic.angle ?? "",
      keywords: topic.keywords ?? [],
      sources,
    });

    // Edit (4 passes — preserves image placeholders)
    const edited = await runAllEditors(draft);

    // Generate images (replaces placeholders with real URLs)
    const articleSlug = slugify(topic.title);
    const { markdown: withImages, coverImage } = await generateArticleImages(
      edited,
      articleSlug
    );

    // Publish
    const slug = await publishPost({
      topicId: topic.id,
      title: topic.title,
      content: withImages,
      tags: topic.keywords ?? [],
      coverImage,
    });

    return NextResponse.json({ success: true, slug, imagesGenerated: !!coverImage });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
