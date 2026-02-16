import { supabase } from "@/lib/supabase";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { TableOfContents } from "@/components/table-of-contents";

export const revalidate = 60;

interface Props {
  params: Promise<{ slug: string }>;
}

function readingTime(text: string): number {
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { data: post } = await supabase
    .from("blog_posts")
    .select("title, meta_desc, slug, tags, published_at, cover_image")
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (!post) return {};

  const blogUrl = process.env.BLOG_URL ?? "https://sabka-blog.vercel.app";

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
      ...(post.cover_image && {
        images: [{ url: post.cover_image, width: 1200, height: 630 }],
      }),
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.meta_desc ?? undefined,
      ...(post.cover_image && { images: [post.cover_image] }),
    },
    alternates: {
      canonical: `${blogUrl}/blog/${post.slug}`,
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
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const minutes = readingTime(post.content_md);
  const blogUrl = process.env.BLOG_URL ?? "https://sabka-blog.vercel.app";
  const contentHtml = post.content_html ?? "";

  return (
    <>
      <article>
        {/* Breadcrumbs */}
        <nav className="text-sm text-zinc-400 mb-4">
          <a href="/blog" className="hover:text-[var(--accent)] transition-colors">
            Блог
          </a>
          <span className="mx-2">/</span>
          <span className="text-zinc-600 dark:text-zinc-300">{post.title}</span>
        </nav>

        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-zinc-900 dark:text-zinc-100 mb-4 leading-tight">
            {post.title}
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-400">
            <time dateTime={post.published_at}>{date}</time>
            <span className="text-zinc-300 dark:text-zinc-700">·</span>
            <span>{minutes} мин чтения</span>
            {(post.tags ?? []).slice(0, 4).map((tag: string) => (
              <span
                key={tag}
                className="px-2 py-0.5 bg-[var(--accent-light)] text-[var(--accent-dark,#166534)] dark:text-[var(--accent)] rounded-md text-xs font-medium"
              >
                {tag}
              </span>
            ))}
          </div>
        </header>

        {/* Two-column: TOC + Content */}
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-10">
          {/* TOC (handles mobile/desktop internally) */}
          <TableOfContents html={contentHtml} />

          {/* Article content */}
          <div className="min-w-0 flex-1">
            <div
              className="prose prose-zinc dark:prose-invert max-w-none prose-headings:font-bold prose-h2:text-2xl prose-h3:text-xl prose-a:text-[var(--accent)] dark:prose-a:text-[var(--accent)] prose-img:rounded-xl prose-img:shadow-md"
              dangerouslySetInnerHTML={{ __html: contentHtml }}
            />

            {/* Prev/Next */}
            {(prev || next) && (
              <nav className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                {prev ? (
                  <a
                    href={`/blog/${prev.slug}`}
                    className="p-4 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:border-[var(--accent)] transition-colors group"
                  >
                    <span className="text-zinc-400 text-xs">← Предыдущая</span>
                    <p className="text-zinc-900 dark:text-zinc-100 font-medium mt-1 line-clamp-2 group-hover:text-[var(--accent)] transition-colors">
                      {prev.title}
                    </p>
                  </a>
                ) : (
                  <div />
                )}
                {next ? (
                  <a
                    href={`/blog/${next.slug}`}
                    className="p-4 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:border-[var(--accent)] transition-colors text-right group"
                  >
                    <span className="text-zinc-400 text-xs">Следующая →</span>
                    <p className="text-zinc-900 dark:text-zinc-100 font-medium mt-1 line-clamp-2 group-hover:text-[var(--accent)] transition-colors">
                      {next.title}
                    </p>
                  </a>
                ) : (
                  <div />
                )}
              </nav>
            )}

            {/* CTA */}
            <div className="mt-10 p-4 sm:p-6 bg-[var(--accent-light)] rounded-xl border border-[var(--accent)]/20 text-center">
              <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                Попробуйте Сабку бесплатно
              </p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
                Мультичат с ChatGPT, Claude, Gemini и DeepSeek — без VPN, с готовыми промптами
              </p>
              <a
                href={post.cta_url ?? "https://sabka.pro?utm_source=blog"}
                className="inline-block px-6 py-3 bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent-hover)] text-sm font-medium transition-colors"
              >
                Начать бесплатно →
              </a>
            </div>
          </div>
        </div>
      </article>

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
            ...(post.cover_image && { image: post.cover_image }),
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
              {
                "@type": "ListItem",
                position: 1,
                name: "Блог",
                item: `${blogUrl}/blog`,
              },
              {
                "@type": "ListItem",
                position: 2,
                name: post.title,
                item: `${blogUrl}/blog/${post.slug}`,
              },
            ],
          }),
        }}
      />
    </>
  );
}
