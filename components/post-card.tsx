interface PostCardProps {
  slug: string;
  title: string;
  metaDesc: string | null;
  publishedAt: string;
  tags: string[];
  coverImage?: string | null;
}

export function PostCard({ slug, title, metaDesc, publishedAt, tags, coverImage }: PostCardProps) {
  const date = new Date(publishedAt).toLocaleDateString("ru-RU", {
    year: "numeric", month: "long", day: "numeric",
  });

  return (
    <article>
      <a
        href={`/blog/${slug}`}
        className="group flex flex-col h-full rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden transition-all hover:border-[var(--accent)] hover:shadow-lg"
      >
        {coverImage && (
          <div className="aspect-[16/9] overflow-hidden bg-zinc-100 dark:bg-zinc-900">
            <img
              src={coverImage}
              alt={title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        )}
        <div className="p-5 sm:p-6 flex flex-col flex-1">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-[var(--accent)] transition-colors leading-snug">
            {title}
          </h2>
          {metaDesc && (
            <p className="mt-2.5 text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed line-clamp-3 flex-1">
              {metaDesc}
            </p>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-zinc-400">
            <time>{date}</time>
            <span className="text-zinc-300 dark:text-zinc-700">·</span>
            {tags.slice(0, 3).map((tag) => (
              <span key={tag} className="px-2 py-0.5 bg-[var(--accent-light)] text-[var(--accent-dark,#0d7a42)] dark:text-[var(--accent)] rounded-md font-medium">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </a>
    </article>
  );
}
