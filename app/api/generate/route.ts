import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { searchSources } from "@/lib/researcher";
import { writeArticle } from "@/lib/pipeline/writer";
import { runAllEditors } from "@/lib/pipeline/editors";
import { generateArticleImages } from "@/lib/pipeline/image-generator";
import { publishPost } from "@/lib/pipeline/publisher";
import { slugify } from "@/lib/utils";

export const maxDuration = 300;

export async function POST(request: Request) {
  // Simple secret check
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");
  if (secret !== "sabka2026go") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 1. Select topic
    const { data: topic } = await supabase
      .from("blog_topics")
      .select("*")
      .eq("status", "pending")
      .order("score", { ascending: false })
      .limit(1)
      .single();

    if (!topic) {
      return NextResponse.json({ error: "No pending topics" }, { status: 404 });
    }

    // 2. Research
    const sources = await searchSources(
      `${topic.title} ${(topic.keywords ?? []).join(" ")}`,
      6
    );

    // 3. Write draft (with image placeholders)
    const draft = await writeArticle({
      title: topic.title,
      angle: topic.angle ?? "",
      keywords: topic.keywords ?? [],
      sources,
    });

    // 4. Edit (4 passes)
    const edited = await runAllEditors(draft);

    // 5. Generate images
    const articleSlug = slugify(topic.title);
    const { markdown: withImages, coverImage } = await generateArticleImages(
      edited,
      articleSlug
    );

    // 6. Publish
    const slug = await publishPost({
      topicId: topic.id,
      title: topic.title,
      content: withImages,
      tags: topic.keywords ?? [],
      coverImage,
    });

    return NextResponse.json({
      success: true,
      slug,
      title: topic.title,
      url: `/blog/${slug}`,
      imagesGenerated: !!coverImage,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
