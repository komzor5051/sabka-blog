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
    <article className="py-6 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
      <a href={`/blog/${slug}`} className="group block">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 transition-colors">
          {title}
        </h2>
        {metaDesc && (
          <p className="mt-2 text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">
            {metaDesc}
          </p>
        )}
        <div className="mt-3 flex items-center gap-3 text-xs text-zinc-400">
          <time>{date}</time>
          {tags.slice(0, 3).map((tag) => (
            <span key={tag} className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded">
              {tag}
            </span>
          ))}
        </div>
      </a>
    </article>
  );
}
