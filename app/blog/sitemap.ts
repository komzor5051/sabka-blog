import { supabase } from "@/lib/supabase";
import type { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const blogUrl = process.env.BLOG_URL ?? "https://blog.sabka.pro";

  const { data: posts } = await supabase
    .from("blog_posts")
    .select("slug, published_at")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  const postEntries = (posts ?? []).map((post) => ({
    url: `${blogUrl}/blog/${post.slug}`,
    lastModified: post.published_at,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [
    { url: `${blogUrl}/blog`, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    ...postEntries,
  ];
}
