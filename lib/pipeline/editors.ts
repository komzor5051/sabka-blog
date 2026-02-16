import { generateFlash } from "@/lib/gemini";

type EditorRole = "structure" | "coherence" | "anti-slop" | "factcheck";

const IMAGE_PRESERVATION = `
ВАЖНО: В статье есть плейсхолдеры для картинок в формате ![MEME: описание](placeholder).
НЕ УДАЛЯЙ и НЕ ИЗМЕНЯЙ их! Оставь их точно как есть, на тех же местах.`;

const EDITOR_PROMPTS: Record<EditorRole, string> = {
  structure: `Ты редактор-структуралист. Проверь и исправь статью:

1. Первый абзац ЦЕПЛЯЕТ? Если нет — перепиши хук.
2. Заголовки логичны и информативны? Исправь размытые.
3. Используются ТОЛЬКО ## (H2) и ### (H3)? Если есть # (H1) — убери его.
4. Есть ли "мост" между секциями? Добавь переходы.
5. CTA-секция в конце понятна и мотивирует?
${IMAGE_PRESERVATION}
Верни ИСПРАВЛЕННУЮ статью целиком в Markdown. Без комментариев.`,

  coherence: `Ты редактор связности. Проверь и исправь статью:

1. Нет ли повторов мыслей/фраз в разных абзацах?
2. Абзацы перетекают друг в друга логично?
3. Аргументация последовательна?
4. Примеры поддерживают тезисы?
${IMAGE_PRESERVATION}
Верни ИСПРАВЛЕННУЮ статью целиком в Markdown. Без комментариев.`,

  "anti-slop": `Ты редактор-чистильщик. Убери из статьи AI-слоп и канцелярит:

УДАЛИ/ЗАМЕНИ:
- "В современном мире" → убрать
- "Как следствие", "Таким образом" → упростить
- "Данный", "Является" → простые формы
- Пассивный залог → активный
- "Безусловно", "Несомненно" → убрать
- Любые шаблонные AI-обороты
- Слишком длинные предложения → разбить

Сохрани смысл и экспертность. Текст должен звучать как живой человек.
${IMAGE_PRESERVATION}
Верни ИСПРАВЛЕННУЮ статью целиком в Markdown. Без комментариев.`,

  factcheck: `Ты фактчекер. Проверь статью:

1. Утверждения соответствуют источникам (ссылки в тексте)?
2. Даты актуальны?
3. Нет ли выдуманных фактов, продуктов, функций?
4. Числа и проценты правдоподобны?

Если нашёл проблему — исправь или убери утверждение.
${IMAGE_PRESERVATION}
Верни ИСПРАВЛЕННУЮ статью целиком в Markdown. Без комментариев.`,
};

export async function editArticle(
  content: string,
  role: EditorRole
): Promise<string> {
  const prompt = `${EDITOR_PROMPTS[role]}

--- СТАТЬЯ ---
${content}
--- КОНЕЦ СТАТЬИ ---`;

  return generateFlash(prompt);
}

export async function runAllEditors(content: string): Promise<string> {
  // Extract MEME placeholders before editing — LLMs often remove them despite instructions
  const memeRegex = /!\[MEME:\s*.+?\]\(placeholder\)/g;
  const memePlaceholders = content.match(memeRegex) ?? [];

  const roles: EditorRole[] = ["structure", "coherence", "anti-slop", "factcheck"];
  let result = content;
  for (const role of roles) {
    result = await editArticle(result, role);
  }

  // Re-insert lost placeholders after H2 headings
  if (memePlaceholders.length > 0) {
    const surviving = (result.match(memeRegex) ?? []).length;
    if (surviving < memePlaceholders.length) {
      const lost = memePlaceholders.filter((p) => !result.includes(p));
      const h2Positions: number[] = [];
      const h2Regex = /^## .+$/gm;
      let m;
      while ((m = h2Regex.exec(result)) !== null) {
        // Position right after the H2 line
        const endOfLine = result.indexOf("\n", m.index + m[0].length);
        if (endOfLine !== -1) h2Positions.push(endOfLine + 1);
      }

      // Distribute lost placeholders evenly across H2 positions
      for (let i = 0; i < lost.length && i < h2Positions.length; i++) {
        const posIndex = Math.floor((i / lost.length) * h2Positions.length);
        const insertAt = h2Positions[posIndex];
        result = result.slice(0, insertAt) + "\n" + lost[i] + "\n\n" + result.slice(insertAt);
        // Shift remaining positions
        const shift = lost[i].length + 3;
        for (let j = posIndex + 1; j < h2Positions.length; j++) {
          h2Positions[j] += shift;
        }
      }
      console.log(`[editors] Re-inserted ${lost.length} lost MEME placeholders`);
    }
  }

  return result;
}
