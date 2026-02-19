CREATE TABLE blog_topics (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  angle       TEXT,
  keywords    TEXT[] DEFAULT '{}',
  source      TEXT DEFAULT 'trend',
  score       INT DEFAULT 0,
  search_volume INT DEFAULT 0,
  status      TEXT DEFAULT 'pending',
  created_at  TIMESTAMPTZ DEFAULT now(),
  used_at     TIMESTAMPTZ
);

CREATE TABLE blog_posts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id      UUID REFERENCES blog_topics(id),
  slug          TEXT UNIQUE NOT NULL,
  title         TEXT NOT NULL,
  meta_desc     TEXT,
  content_md    TEXT NOT NULL,
  content_html  TEXT,
  cover_image   TEXT,
  tags          TEXT[] DEFAULT '{}',
  cta_url       TEXT DEFAULT 'https://sabka.pro?utm_source=blog&utm_medium=article',
  status        TEXT DEFAULT 'draft',
  published_at  TIMESTAMPTZ,
  telegram_sent BOOLEAN DEFAULT false,
  created_at    TIMESTAMPTZ DEFAULT now(),
  views         INT DEFAULT 0
);

CREATE INDEX idx_topics_status_score ON blog_topics(status, score DESC);
CREATE INDEX idx_posts_status_published ON blog_posts(status, published_at DESC);
CREATE INDEX idx_posts_slug ON blog_posts(slug);
