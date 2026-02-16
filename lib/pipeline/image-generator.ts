import { GoogleGenAI } from "@google/genai";
import { supabase } from "@/lib/supabase";

const genAI = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY! });

const MEME_PLACEHOLDER_REGEX = /!\[MEME:\s*(.+?)\]\(placeholder\)/g;

async function generateImage(prompt: string): Promise<Buffer> {
  const response = await genAI.models.generateContent({
    model: "gemini-3-pro-image-preview",
    contents: prompt,
    config: {
      responseModalities: ["IMAGE", "TEXT"],
    },
  });

  const parts = response.candidates?.[0]?.content?.parts ?? [];
  for (const part of parts) {
    if (part.inlineData?.data) {
      return Buffer.from(part.inlineData.data, "base64");
    }
  }

  throw new Error("Nano Banana returned no image");
}

async function uploadToStorage(
  buffer: Buffer,
  slug: string,
  index: number
): Promise<string> {
  const path = `blog-images/${slug}/img-${index}.png`;

  const { error } = await supabase.storage
    .from("blog-images")
    .upload(path, buffer, {
      contentType: "image/png",
      upsert: true,
    });

  if (error) throw new Error(`Storage upload failed: ${error.message}`);

  const { data } = supabase.storage.from("blog-images").getPublicUrl(path);
  return data.publicUrl;
}

function buildPrompt(description: string): string {
  return `Создай мем-картинку для IT/AI блога.

Описание сцены: ${description}

Требования:
- Стиль: яркий мультяшный мем как в Rick and Morty — насыщенные цвета, выразительные персонажи, гротескные эмоции
- Если в описании есть "подпись" — нарисуй этот текст НА РУССКОМ ЯЗЫКЕ крупным жирным шрифтом прямо на картинке (сверху или снизу, как в классических мемах)
- Текст на картинке должен быть ЧИТАЕМЫМ: белые буквы с чёрной обводкой, крупный размер
- Персонажи — гротескные, смешные, с утрированными эмоциями
- IT/технологическая тематика: компьютеры, роботы, нейросети, код
- Формат 16:9
- Картинка должна быть СМЕШНОЙ и понятной без контекста`;
}

export async function generateArticleImages(
  markdown: string,
  articleSlug: string
): Promise<{ markdown: string; coverImage: string | null }> {
  const matches: { full: string; description: string }[] = [];
  let match;
  const regex = new RegExp(MEME_PLACEHOLDER_REGEX.source, "g");

  while ((match = regex.exec(markdown)) !== null) {
    matches.push({ full: match[0], description: match[1] });
  }

  if (matches.length === 0) {
    return { markdown, coverImage: null };
  }

  let result = markdown;
  let coverImage: string | null = null;

  for (let i = 0; i < matches.length; i++) {
    const { full, description } = matches[i];
    const prompt = buildPrompt(description);

    try {
      console.log(`[image-gen] Generating image ${i + 1}/${matches.length}: ${description.slice(0, 60)}...`);
      const buffer = await generateImage(prompt);
      const url = await uploadToStorage(buffer, articleSlug, i + 1);

      if (i === 0) coverImage = url;

      const altText = description.trim();
      result = result.replace(full, `![${altText}](${url})`);

      console.log(`[image-gen] Image ${i + 1} uploaded: ${url}`);
    } catch (err) {
      console.error(`[image-gen] Failed to generate image ${i + 1}:`, err);
      result = result.replace(full, "");
    }

    if (i < matches.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  return { markdown: result, coverImage };
}
