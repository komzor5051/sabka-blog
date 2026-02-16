import { config } from "dotenv";
config({ path: ".env.local" });

async function run() {
  // Dynamic imports to ensure env vars are loaded first
  const { supabase } = await import("../lib/supabase");
  const { searchSources } = await import("../lib/researcher");
  const { writeArticle } = await import("../lib/pipeline/writer");
  const { runAllEditors } = await import("../lib/pipeline/editors");
  const { generateArticleImages } = await import("../lib/pipeline/image-generator");
  const { publishPost } = await import("../lib/pipeline/publisher");
  const { slugify } = await import("../lib/utils");

  console.log("1. Selecting topic...");
  const { data: topic } = await supabase
    .from("blog_topics")
    .select("*")
    .eq("status", "pending")
    .order("score", { ascending: false })
    .limit(1)
    .single();

  if (!topic) { console.error("No pending topics!"); return; }
  console.log(`   Topic: ${topic.title}`);

  // Mark as writing
  await supabase.from("blog_topics").update({ status: "writing" }).eq("id", topic.id);

  console.log("2. Researching...");
  const sources = await searchSources(`${topic.title} ${(topic.keywords ?? []).join(" ")}`, 6);
  console.log(`   Found ${sources.length} sources`);

  console.log("3. Writing draft (with image placeholders)...");
  const draft = await writeArticle({
    title: topic.title,
    angle: topic.angle ?? "",
    keywords: topic.keywords ?? [],
    sources,
  });
  console.log(`   Draft: ${draft.length} chars`);

  // Show placeholders found
  const placeholders = (draft.match(/!\[MEME:/g) || []).length;
  console.log(`   Image placeholders found: ${placeholders}`);

  console.log("4. Editing (4 passes)...");
  const edited = await runAllEditors(draft);
  console.log(`   Edited: ${edited.length} chars`);

  const placeholdersAfterEdit = (edited.match(/!\[MEME:/g) || []).length;
  console.log(`   Placeholders preserved: ${placeholdersAfterEdit}`);

  console.log("5. Generating images...");
  const articleSlug = slugify(topic.title);
  const { markdown: withImages, coverImage } = await generateArticleImages(edited, articleSlug);
  console.log(`   Images done. Cover: ${coverImage ? "yes" : "no"}`);

  console.log("6. Publishing...");
  const slug = await publishPost({
    topicId: topic.id,
    title: topic.title,
    content: withImages,
    tags: topic.keywords ?? [],
    coverImage,
  });
  console.log(`   Published: /blog/${slug}`);

  console.log("\nDone! Check the blog at http://localhost:3000/blog/" + slug);
}

run().catch(console.error);
