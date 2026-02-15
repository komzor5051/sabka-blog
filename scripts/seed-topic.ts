import { config } from "dotenv";
config({ path: ".env.local" });

import { supabase } from "../lib/supabase";

async function seed() {
  const { error } = await supabase.from("blog_topics").insert({
    title: "ChatGPT vs Claude vs Gemini: какую нейросеть выбрать для текстов в 2026",
    angle: "Практическое сравнение через мультичат — один запрос, три ответа",
    keywords: ["chatgpt vs claude", "сравнение нейросетей", "какую нейросеть выбрать"],
    source: "manual",
    score: 10,
    status: "pending",
  });

  if (error) console.error(error);
  else console.log("Topic seeded!");
}

seed();
