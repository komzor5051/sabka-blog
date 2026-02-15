import { supabase } from "@/lib/supabase";
import { PostCard } from "@/components/post-card";

export const revalidate = 60;

export default async function BlogPage() {
  const { data: posts } = await supabase
    .from("blog_posts")
    .select("slug, title, meta_desc, published_at, tags")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(50);

  return (
    <div>
      <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
        Блог
      </h1>
      <p className="text-zinc-500 dark:text-zinc-400 mb-8">
        Практичные статьи о нейросетях, промптах и AI-инструментах
      </p>
      <div>
        {(posts ?? []).map((post) => (
          <PostCard
            key={post.slug}
            slug={post.slug}
            title={post.title}
            metaDesc={post.meta_desc}
            publishedAt={post.published_at}
            tags={post.tags ?? []}
          />
        ))}
        {(!posts || posts.length === 0) && (
          <p className="text-zinc-400 py-12 text-center">
            Статьи скоро появятся
          </p>
        )}
      </div>
    </div>
  );
}
