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
  const prompt = `Ты контент-стратег блога "Сабка" (sabka.pro) — мультичат с нейросетями без VPN.

Тренды:
${trendSummary}

Уже опубликованные (НЕ повторяй):
${existingTitles || "Пока нет публикаций"}

Сгенерируй 10 тем для блога.

СТИЛЬ ЗАГОЛОВКОВ — разговорный, как пост в Telegram. Примеры ХОРОШИХ тем:
- "Сделал регламенты для бизнеса за 3 минуты"
- "Как уволить маркетолога (спойлер: нейросеть дешевле)"
- "GPT 5 vs Claude 4.5: кто пишет тексты лучше"
- "Почему ваш копирайтер боится нейросетей"
- "Написал диплом за вечер — и что из этого вышло"
- "3 промпта, которые заменят SMM-щика"

Примеры ПЛОХИХ тем (НЕ ДЕЛАЙ ТАК):
- "Ускорение разработки с AI без VPN" — скучно, канцелярит
- "Обзор возможностей современных нейросетей" — размыто
- "Инновационные подходы к генерации контента" — AI-слоп
- "Как искусственный интеллект трансформирует бизнес" — клише

КЛЮЧЕВЫЕ СЛОВА:
- 50% тем — популярные запросы (ChatGPT, нейросети, GPT, промпты, как пользоваться)
- 50% тем — низкочастотные длинные запросы ("как написать пост с помощью нейросети", "сравнение Claude и ChatGPT для текстов")

ЗАПРЕЩЁННЫЕ ТЕМЫ (не генерируй):
- Инструкции по обходу блокировок
- Обзоры VPN-сервисов
- Политические темы
- Темы про создание ботов или автоматизаций (Сабка этого не делает)

Каждая тема должна:
- Быть практичной (как сделать X, сравнение Y vs Z, личный опыт)
- Иметь конкретный угол, отличающий от типичных статей
- Заголовок ≤ 55 символов

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
