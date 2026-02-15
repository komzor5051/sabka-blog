import { generatePro } from "@/lib/gemini";
import { Source } from "@/lib/researcher";
import { SABKA_STYLE_GUIDE } from "./style-guide";

interface WriterInput {
  title: string;
  angle: string;
  keywords: string[];
  sources: Source[];
}

export async function writeArticle(input: WriterInput): Promise<string> {
  const sourcesContext = input.sources
    .map((s) => `[${s.title}](${s.url}): ${s.summary}`)
    .join("\n\n");

  const today = new Date().toLocaleDateString("ru-RU", {
    year: "numeric", month: "long", day: "numeric",
  });

  const prompt = `Ты автор блога SaaS-сервиса "Сабка" (sabka.pro) — мультичат для работы с ChatGPT, Claude, Gemini, DeepSeek без VPN.

Дата: ${today}

Напиши статью на тему: "${input.title}"
Угол раскрытия: ${input.angle}
SEO-ключевые слова (встрой естественно): ${input.keywords.join(", ")}

Источники для фактов и ссылок:
${sourcesContext}

${SABKA_STYLE_GUIDE}

Требования:
- 1500-2500 слов
- Формат Markdown
- Ссылки на источники в тексте
- В секции "Как это сделать в Сабке" — конкретный пример использования мультичата или промптов
- Заверши CTA: "Попробуйте бесплатно в Сабке" со ссылкой https://sabka.pro?utm_source=blog

Напиши ТОЛЬКО статью в Markdown, без вступления от себя.`;

  return generatePro(prompt);
}
