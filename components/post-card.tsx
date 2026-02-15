interface PostCardProps {
  slug: string;
  title: string;
  metaDesc: string | null;
  publishedAt: string;
  tags: string[];
}

export function PostCard({ slug, title, metaDesc, publishedAt, tags }: PostCardProps) {
  const date = new Date(publishedAt).toLocaleDateString("ru-RU", {
    year: "numeric", month: "long", day: "numeric",
  });

  return (
    <article>
      <a
        href={`/blog/${slug}`}
        className="group flex flex-col h-full rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 transition-all hover:border-zinc-400 dark:hover:border-zinc-600 hover:shadow-md"
      >
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-blue-500 transition-colors">
          {title}
        </h2>
        {metaDesc && (
          <p className="mt-2 text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed line-clamp-3 flex-1">
            {metaDesc}
          </p>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-zinc-400">
          <time>{date}</time>
          <span className="text-zinc-300 dark:text-zinc-700">·</span>
          {tags.slice(0, 3).map((tag) => (
            <span key={tag} className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded-md text-zinc-500 dark:text-zinc-400">
              {tag}
            </span>
          ))}
        </div>
      </a>
    </article>
  );
}
