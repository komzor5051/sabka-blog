import { GoogleGenAI } from "@google/genai";
import { supabase } from "@/lib/supabase";
import { slugify } from "@/lib/utils";

const genAI = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY! });

const MEME_PLACEHOLDER_REGEX = /!\[MEME:\s*(.+?)\]\(placeholder\)/g;

interface GeneratedImage {
  url: string;
  alt: string;
}

async function generateImage(prompt: string): Promise<Buffer> {
  const response = await genAI.models.generateImages({
    model: "imagen-4.0-generate-001",
    prompt,
    config: {
      numberOfImages: 1,
    },
  });

  const imageData = response.generatedImages?.[0]?.image?.imageBytes;
  if (!imageData) throw new Error("Imagen 4 returned no image");

  return Buffer.from(imageData, "base64");
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

function buildImagenPrompt(russianDescription: string): string {
  return `Digital illustration in cartoon/comic meme style, vibrant colors, bold outlines. The scene: ${russianDescription}. Include text overlay in Cyrillic Russian on the image. Style: funny internet meme, editorial illustration for a tech blog. High quality, clean composition, 16:9 aspect ratio.`;
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
    const imagenPrompt = buildImagenPrompt(description);

    try {
      console.log(`[image-gen] Generating image ${i + 1}/${matches.length}: ${description.slice(0, 60)}...`);
      const buffer = await generateImage(imagenPrompt);
      const url = await uploadToStorage(buffer, articleSlug, i + 1);

      if (i === 0) coverImage = url;

      // Replace placeholder with real image
      const altText = description.trim();
      result = result.replace(full, `![${altText}](${url})`);

      console.log(`[image-gen] Image ${i + 1} uploaded: ${url}`);
    } catch (err) {
      console.error(`[image-gen] Failed to generate image ${i + 1}:`, err);
      // Remove failed placeholder to not break the article
      result = result.replace(full, "");
    }

    // Rate limiting: small delay between generations
    if (i < matches.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  return { markdown: result, coverImage };
}
