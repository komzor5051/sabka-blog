import { supabase } from "@/lib/supabase";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export const revalidate = 60;

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { data: post } = await supabase
    .from("blog_posts")
    .select("title, meta_desc, slug")
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (!post) return {};

  const blogUrl = process.env.BLOG_URL ?? "https://blog.sabka.pro";

  return {
    title: `${post.title} | Блог Сабки`,
    description: post.meta_desc ?? undefined,
    openGraph: {
      title: post.title,
      description: post.meta_desc ?? undefined,
      type: "article",
      url: `${blogUrl}/blog/${post.slug}`,
    },
  };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const { data: post } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (!post) notFound();

  const date = new Date(post.published_at).toLocaleDateString("ru-RU", {
    year: "numeric", month: "long", day: "numeric",
  });

  return (
    <article>
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-3">
          {post.title}
        </h1>
        <div className="flex items-center gap-3 text-sm text-zinc-400">
          <time>{date}</time>
          {(post.tags ?? []).slice(0, 4).map((tag: string) => (
            <span key={tag} className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded text-xs">
              {tag}
            </span>
          ))}
        </div>
      </header>

      <div
        className="prose prose-zinc dark:prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: post.content_html ?? "" }}
      />

      <div className="mt-12 p-6 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 text-center">
        <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
          Попробуйте Сабку бесплатно
        </p>
        <p className="text-sm text-zinc-500 mb-4">
          Мультичат с ChatGPT, Claude, Gemini и DeepSeek — без VPN, с готовыми промптами
        </p>
        <a
          href={post.cta_url ?? "https://sabka.pro?utm_source=blog"}
          className="inline-block px-6 py-3 bg-zinc-900 text-white rounded-lg hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 text-sm font-medium"
        >
          Начать бесплатно
        </a>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: post.title,
            description: post.meta_desc,
            datePublished: post.published_at,
            publisher: {
              "@type": "Organization",
              name: "Сабка",
              url: "https://sabka.pro",
            },
          }),
        }}
      />
    </article>
  );
}
