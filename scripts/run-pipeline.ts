import { config } from "dotenv";
config({ path: ".env.local" });

import { supabase } from "../lib/supabase";
import { searchSources } from "../lib/researcher";
import { writeArticle } from "../lib/pipeline/writer";
import { runAllEditors } from "../lib/pipeline/editors";
import { publishPost } from "../lib/pipeline/publisher";

async function run() {
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

  console.log("2. Researching...");
  const sources = await searchSources(`${topic.title} ${(topic.keywords ?? []).join(" ")}`, 6);
  console.log(`   Found ${sources.length} sources`);

  console.log("3. Writing draft...");
  const draft = await writeArticle({
    title: topic.title,
    angle: topic.angle ?? "",
    keywords: topic.keywords ?? [],
    sources,
  });
  console.log(`   Draft: ${draft.length} chars`);

  console.log("4. Editing (4 passes)...");
  const edited = await runAllEditors(draft);
  console.log(`   Edited: ${edited.length} chars`);

  console.log("5. Publishing...");
  const slug = await publishPost({
    topicId: topic.id,
    title: topic.title,
    content: edited,
    tags: topic.keywords ?? [],
  });
  console.log(`   Published: /blog/${slug}`);

  console.log("\nDone! Check Supabase for the published post.");
}

run().catch(console.error);
