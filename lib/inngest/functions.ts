import { inngest } from "./client";
import { mineTopics } from "@/lib/pipeline/topic-miner";
import { searchSources } from "@/lib/researcher";
import { writeArticle } from "@/lib/pipeline/writer";
import { runAllEditors } from "@/lib/pipeline/editors";
import { publishPost } from "@/lib/pipeline/publisher";
import { sendTelegramAnnouncement } from "@/lib/pipeline/telegram";
import { supabase } from "@/lib/supabase";

export const generateDailyPost = inngest.createFunction(
  { id: "generate-daily-post", retries: 1 },
  { cron: "0 5 * * *" },
  async ({ step }) => {
    const topic = await step.run("select-topic", async () => {
      const { data } = await supabase
        .from("blog_topics")
        .select("*")
        .eq("status", "pending")
        .order("score", { ascending: false })
        .limit(1)
        .single();

      if (!data) throw new Error("No pending topics! Run topic-miner first.");

      await supabase
        .from("blog_topics")
        .update({ status: "writing" })
        .eq("id", data.id);

      return data;
    });

    const sources = await step.run("research", async () => {
      const query = `${topic.title} ${(topic.keywords ?? []).join(" ")}`;
      return searchSources(query, 6);
    });

    const draft = await step.run("write-draft", async () => {
      return writeArticle({
        title: topic.title,
        angle: topic.angle ?? "",
        keywords: topic.keywords ?? [],
        sources,
      });
    });

    const edited = await step.run("edit-article", async () => {
      return runAllEditors(draft);
    });

    const slug = await step.run("publish", async () => {
      return publishPost({
        topicId: topic.id,
        title: topic.title,
        content: edited,
        tags: topic.keywords ?? [],
      });
    });

    await step.run("telegram-announce", async () => {
      return sendTelegramAnnouncement(slug);
    });

    return { slug, title: topic.title };
  }
);

export const mineTopicsCron = inngest.createFunction(
  { id: "mine-topics", retries: 1 },
  { cron: "0 4 */3 * *" },
  async ({ step }) => {
    const topics = await step.run("mine", async () => {
      return mineTopics();
    });
    return { count: topics.length };
  }
);
