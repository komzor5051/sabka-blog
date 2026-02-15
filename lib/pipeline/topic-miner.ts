import { generatePro } from "@/lib/gemini";
import { searchSources } from "@/lib/researcher";
import { supabase } from "@/lib/supabase";

interface GeneratedTopic {
  title: string;
  angle: string;
  keywords: string[];
  score: number;
}

export async function mineTopics(): Promise<GeneratedTopic[]> {
  // 1. Research current AI trends
  const trends = await searchSources(
    "AI нейросети ChatGPT Claude Gemini новости тренды", 8
  );
  const trendSummary = trends.map((t) => `- ${t.title}: ${t.summary}`).join("\n");

  // 2. Get existing topics to avoid duplicates
  const { data: existing } = await supabase
    .from("blog_topics")
    .select("title")
    .order("created_at", { ascending: false })
    .limit(50);

  const existingTitles = (existing ?? []).map((t) => t.title).join("\n");

  // 3. Generate new topics
  const prompt = `Ты контент-стратег SaaS-сервиса "Сабка" (sabka.pro) — мультичат с нейросетями (ChatGPT, Claude, Gemini, DeepSeek) без VPN, с готовыми промптами.

Проанализируй текущие тренды:
${trendSummary}

Уже опубликованные темы (НЕ повторяй):
${existingTitles || "Пока нет публикаций"}

Сгенерируй 10 тем для блога. Каждая тема должна:
- Привлекать людей, которые ищут доступ к нейросетям без VPN
- Быть практичной (как сделать X, сравнение Y vs Z, гайд по W)
- Содержать угол, который отличает от типичных статей

Ответь СТРОГО в JSON-формате (массив объектов):
[{
  "title": "Заголовок статьи",
  "angle": "Уникальный угол раскрытия",
  "keywords": ["ключ1", "ключ2", "ключ3"],
  "score": 1-10
}]

Только JSON, без markdown-обёрток.`;

  const raw = await generatePro(prompt);
  const cleaned = raw.replace(/\`\`\`json?\n?/g, "").replace(/\`\`\`/g, "").trim();
  const topics: GeneratedTopic[] = JSON.parse(cleaned);

  // 4. Save to Supabase
  const rows = topics.map((t) => ({
    title: t.title,
    angle: t.angle,
    keywords: t.keywords,
    source: "trend",
    score: t.score,
    status: "pending",
  }));

  const { error } = await supabase.from("blog_topics").insert(rows);
  if (error) throw new Error(`Failed to save topics: ${error.message}`);

  return topics;
}
