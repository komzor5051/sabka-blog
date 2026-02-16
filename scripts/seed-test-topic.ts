import { config } from "dotenv";
config({ path: ".env.local" });

async function seed() {
  const { supabase } = await import("../lib/supabase");

  // Check for existing pending topics
  const { data: existing } = await supabase
    .from("blog_topics")
    .select("id, title, status")
    .eq("status", "pending")
    .limit(5);

  if (existing && existing.length > 0) {
    console.log("Existing pending topics:");
    existing.forEach((t) => console.log(`  - [${t.id.slice(0, 8)}] ${t.title}`));
    console.log("\nUsing first existing topic for pipeline test.");
    return;
  }

  // Seed a fresh topic
  const { error } = await supabase.from("blog_topics").insert({
    title: "5 нейросетей для создания картинок в 2026: от DALL-E до Imagen",
    angle: "Практическое сравнение генераторов изображений — что реально работает для бизнеса",
    keywords: [
      "генерация картинок нейросетью",
      "DALL-E альтернативы",
      "AI генерация изображений",
      "нейросеть для картинок",
    ],
    source: "manual",
    score: 10,
    status: "pending",
  });

  if (error) console.error("Seed error:", error);
  else console.log("Test topic seeded!");
}

seed().catch(console.error);
