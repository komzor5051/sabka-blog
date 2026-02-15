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
    .select("title, meta_desc, slug, tags, published_at")
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (!post) return {};

  return {
    title: post.title,
    description: post.meta_desc ?? undefined,
    keywords: post.tags ?? undefined,
    openGraph: {
      title: post.title,
      description: post.meta_desc ?? undefined,
      type: "article",
      url: `/blog/${post.slug}`,
      publishedTime: post.published_at,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.meta_desc ?? undefined,
    },
    alternates: {
      canonical: `/blog/${post.slug}`,
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

  // Prev/next articles
  const [{ data: prev }, { data: next }] = await Promise.all([
    supabase
      .from("blog_posts")
      .select("slug, title")
      .eq("status", "published")
      .lt("published_at", post.published_at)
      .order("published_at", { ascending: false })
      .limit(1)
      .single(),
    supabase
      .from("blog_posts")
      .select("slug, title")
      .eq("status", "published")
      .gt("published_at", post.published_at)
      .order("published_at", { ascending: true })
      .limit(1)
      .single(),
  ]);

  const date = new Date(post.published_at).toLocaleDateString("ru-RU", {
    year: "numeric", month: "long", day: "numeric",
  });

  const blogUrl = process.env.BLOG_URL ?? "https://sabka-blog.vercel.app";

  return (
    <article>
      <header className="mb-8">
        <nav className="text-sm text-zinc-400 mb-4">
          <a href="/blog" className="hover:text-zinc-600 dark:hover:text-zinc-300">Блог</a>
          <span className="mx-2">/</span>
          <span className="text-zinc-600 dark:text-zinc-300">{post.title}</span>
        </nav>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-3">
          {post.title}
        </h1>
        <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-400">
          <time dateTime={post.published_at}>{date}</time>
          {(post.tags ?? []).slice(0, 4).map((tag: string) => (
            <span key={tag} className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded-md text-xs">
              {tag}
            </span>
          ))}
        </div>
      </header>

      <div
        className="prose prose-zinc dark:prose-invert max-w-none prose-headings:scroll-mt-20 prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-img:rounded-lg"
        dangerouslySetInnerHTML={{ __html: post.content_html ?? "" }}
      />

      {/* Prev/Next navigation */}
      {(prev || next) && (
        <nav className="mt-12 grid grid-cols-2 gap-4 text-sm">
          {prev ? (
            <a href={`/blog/${prev.slug}`} className="p-4 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors">
              <span className="text-zinc-400 text-xs">Предыдущая</span>
              <p className="text-zinc-900 dark:text-zinc-100 font-medium mt-1 line-clamp-2">{prev.title}</p>
            </a>
          ) : <div />}
          {next ? (
            <a href={`/blog/${next.slug}`} className="p-4 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors text-right">
              <span className="text-zinc-400 text-xs">Следующая</span>
              <p className="text-zinc-900 dark:text-zinc-100 font-medium mt-1 line-clamp-2">{next.title}</p>
            </a>
          ) : <div />}
        </nav>
      )}

      {/* CTA */}
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

      {/* JSON-LD: Article */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: post.title,
            description: post.meta_desc,
            datePublished: post.published_at,
            dateModified: post.published_at,
            keywords: (post.tags ?? []).join(", "),
            author: {
              "@type": "Organization",
              name: "Сабка",
              url: "https://sabka.pro",
            },
            publisher: {
              "@type": "Organization",
              name: "Сабка",
              url: "https://sabka.pro",
            },
            mainEntityOfPage: {
              "@type": "WebPage",
              "@id": `${blogUrl}/blog/${post.slug}`,
            },
          }),
        }}
      />

      {/* JSON-LD: BreadcrumbList */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Блог", item: `${blogUrl}/blog` },
              { "@type": "ListItem", position: 2, name: post.title, item: `${blogUrl}/blog/${post.slug}` },
            ],
          }),
        }}
      />
    </article>
  );
}
