# Wordstat Integration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Integrate Yandex Wordstat API into topic mining to use real search demand data for topic generation and scoring.

**Architecture:** New `lib/wordstat.ts` wrapper calls Wordstat REST API (`/v1/topRequests`, `/v1/userInfo`). Topic miner gets two new steps: seed collection before Gemini, and search volume validation after. Graceful degradation — pipeline works without Wordstat if API fails.

**Tech Stack:** Yandex Wordstat API v1 (REST, Bearer auth), TypeScript, Supabase (new column), existing Gemini + Exa pipeline.

---

### Task 1: Add WORDSTAT_TOKEN to environment

**Files:**
- Modify: `/Users/lvmn/sabka-blog/.env.local`

**Step 1: Add env var**

Add to `.env.local`:
```
WORDSTAT_TOKEN=y0__xDoq-t5GNf-PSCcn7G8FqpvEYmMRg_mU-iKXgJ8fvRYGelu
```

**Step 2: Verify env is loadable**

Run: `cd /Users/lvmn/sabka-blog && node -e "require('dotenv').config({path:'.env.local'}); console.log('WORDSTAT_TOKEN:', process.env.WORDSTAT_TOKEN ? 'SET (' + process.env.WORDSTAT_TOKEN.length + ' chars)' : 'MISSING')"`
Expected: `WORDSTAT_TOKEN: SET (51 chars)`

---

### Task 2: Create lib/wordstat.ts — API wrapper

**Files:**
- Create: `/Users/lvmn/sabka-blog/lib/wordstat.ts`

**Step 1: Write the Wordstat API wrapper**

```typescript
const WORDSTAT_BASE = "https://wordstat.yandex.ru/api/v1";

interface TopRequest {
  phrase: string;
  count: number;
}

interface TopRequestsResponse {
  requestPhrase: string;
  totalCount: number;
  topRequests: TopRequest[];
  associations: TopRequest[];
}

interface UserInfo {
  login: string;
  rpsLimit: number;
  dailyLimit: number;
  remainingLimit: number;
}

function getToken(): string | null {
  return process.env.WORDSTAT_TOKEN ?? null;
}

async function wordstatFetch<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const token = getToken();
  if (!token) throw new Error("WORDSTAT_TOKEN not set");

  const res = await fetch(`${WORDSTAT_BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Wordstat API ${path} failed: ${res.status} ${text}`);
  }

  return res.json() as Promise<T>;
}

/** Get popular queries for given phrases (max 128 phrases per request) */
export async function getTopRequests(
  phrases: string[],
  numPhrases = 50
): Promise<TopRequestsResponse[]> {
  const data = await wordstatFetch<TopRequestsResponse[]>("/topRequests", {
    phrases: phrases.slice(0, 128),
    numPhrases,
  });
  return data;
}

/** Get search volume for a single phrase. Returns totalCount or 0. */
export async function getSearchVolume(phrase: string): Promise<number> {
  try {
    const results = await getTopRequests([phrase], 1);
    return results[0]?.totalCount ?? 0;
  } catch {
    return 0;
  }
}

/** Check API quota */
export async function getUserInfo(): Promise<UserInfo> {
  const token = getToken();
  if (!token) throw new Error("WORDSTAT_TOKEN not set");

  const res = await fetch(`${WORDSTAT_BASE}/userInfo`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({}),
  });

  if (!res.ok) throw new Error(`Wordstat userInfo failed: ${res.status}`);
  return res.json() as Promise<UserInfo>;
}

/** Collect seed queries from popular search terms. Returns formatted string for Gemini context. */
export async function collectSeedQueries(
  seedPhrases: string[]
): Promise<string> {
  try {
    const results = await getTopRequests(seedPhrases, 50);
    const lines: string[] = [];

    for (const r of results) {
      lines.push(`## "${r.requestPhrase}" (${r.totalCount} запросов/мес)`);
      for (const q of r.topRequests.slice(0, 10)) {
        lines.push(`- ${q.phrase}: ${q.count}`);
      }
    }

    return lines.join("\n");
  } catch (err) {
    console.warn("[Wordstat] Seed collection failed, continuing without:", err);
    return "";
  }
}
```

**Step 2: Verify API connection**

Run: `cd /Users/lvmn/sabka-blog && npx tsx -e "
import 'dotenv/config';
process.env.WORDSTAT_TOKEN = process.env.WORDSTAT_TOKEN || '';
import { getUserInfo } from './lib/wordstat';
getUserInfo().then(info => console.log('Wordstat connected:', info)).catch(e => console.error('Failed:', e.message));
"`
Expected: JSON with login, rpsLimit, dailyLimit, remainingLimit

**Step 3: Test getTopRequests**

Run: `cd /Users/lvmn/sabka-blog && npx tsx -e "
import 'dotenv/config';
import { getTopRequests } from './lib/wordstat';
getTopRequests(['нейросети'], 5).then(r => {
  console.log('Phrase:', r[0]?.requestPhrase);
  console.log('Total count:', r[0]?.totalCount);
  console.log('Top 5:', r[0]?.topRequests?.slice(0, 5));
}).catch(e => console.error('Failed:', e.message));
"`
Expected: Real search data for "нейросети"

**Step 4: Commit**

```bash
git add lib/wordstat.ts
git commit -m "feat: add Yandex Wordstat API wrapper"
```

---

### Task 3: Add search_volume column to blog_topics

**Files:**
- Modify: `/Users/lvmn/sabka-blog/lib/db-schema.sql:1-11`

**Step 1: Update schema file**

Add `search_volume INT DEFAULT 0` after the `score` column in the `blog_topics` CREATE TABLE.

**Step 2: Run migration in Supabase**

Execute this SQL in Supabase SQL Editor (or via CLI):
```sql
ALTER TABLE blog_topics ADD COLUMN IF NOT EXISTS search_volume INT DEFAULT 0;
```

**Step 3: Commit**

```bash
git add lib/db-schema.sql
git commit -m "feat: add search_volume column to blog_topics"
```

---

### Task 4: Integrate Wordstat into topic-miner

**Files:**
- Modify: `/Users/lvmn/sabka-blog/lib/pipeline/topic-miner.ts`

**Step 1: Add imports and seed collection**

Add import at top:
```typescript
import { collectSeedQueries, getSearchVolume } from "@/lib/wordstat";
```

Add seed collection after Exa trends (after line 17), before the Gemini prompt:
```typescript
// 1b. Collect popular search queries from Wordstat
const seedPhrases = ["нейросети", "ChatGPT", "Claude", "промпты", "искусственный интеллект", "GPT"];
const wordstatContext = await collectSeedQueries(seedPhrases);
```

**Step 2: Add Wordstat context to Gemini prompt**

Insert Wordstat data into the prompt, after the trends block and before "Уже опубликованные":
```
${wordstatContext ? `\nПопулярные поисковые запросы (Яндекс Wordstat):\n${wordstatContext}\n` : ""}
```

**Step 3: Add post-generation validation**

After JSON parsing (after line 80) and before saving to Supabase (before line 83), add search volume enrichment:
```typescript
// 3b. Validate with Wordstat search volumes
const enrichedTopics = [];
for (const topic of topics) {
  const keyword = topic.keywords[0] ?? topic.title;
  const volume = await getSearchVolume(keyword);

  // Wait 1s between requests (rate limit)
  await new Promise((r) => setTimeout(r, 1000));

  const normalizedVolume = Math.min(volume / 10000, 1.0) * 10;
  const finalScore = Math.round(topic.score * 0.4 + normalizedVolume * 0.6);

  enrichedTopics.push({
    ...topic,
    score: finalScore,
    search_volume: volume,
    status: volume === 0 ? "rejected" : "pending",
  });
}
```

Update the rows mapping to use enrichedTopics and include search_volume:
```typescript
const rows = enrichedTopics.map((t) => ({
  title: t.title,
  angle: t.angle,
  keywords: t.keywords,
  source: "trend",
  score: t.score,
  search_volume: t.search_volume,
  status: t.status,
}));
```

**Step 4: Test manually**

Run: `cd /Users/lvmn/sabka-blog && npx tsx scripts/seed-test-topic.ts`
Then check Supabase `blog_topics` table — new rows should have `search_volume` populated.

Alternatively, test the full miner:
Run: `cd /Users/lvmn/sabka-blog && npx tsx -e "
import 'dotenv/config';
import { mineTopics } from './lib/pipeline/topic-miner';
mineTopics().then(t => { console.log('Mined', t.length, 'topics'); t.forEach(x => console.log(x.title, '→', (x as any).search_volume)); }).catch(e => console.error(e));
"`

**Step 5: Commit**

```bash
git add lib/pipeline/topic-miner.ts
git commit -m "feat: integrate Wordstat into topic mining (seed + validation)"
```

---

### Task 5: Update documentation

**Files:**
- Modify: `/Users/lvmn/Desktop/Бизнес/01_Клиенты/Активные_Проекты/Sabka_Content_Factory/CLAUDE.md`

**Step 1: Update CLAUDE.md**

- Add `wordstat.ts` to Key Files > Core libs section
- Add `WORDSTAT_TOKEN` to Environment Variables
- Add "Yandex Wordstat API" to Stack section
- Update topic-miner description to mention Wordstat seed + validation
- Update architecture diagram to show Wordstat in mine-topics flow
- Add `search_volume` back to blog_topics schema

**Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md with Wordstat integration"
```

---

### Task 6: Deploy and verify

**Step 1: Add WORDSTAT_TOKEN to Vercel**

Run: `cd /Users/lvmn/sabka-blog && npx vercel env add WORDSTAT_TOKEN`
Enter the token value when prompted. Set for Production + Preview + Development.

**Step 2: Deploy**

Run: `cd /Users/lvmn/sabka-blog && npx vercel --prod`

**Step 3: Trigger mine-topics manually to verify**

Run: `curl -X POST "https://sabka-blog.vercel.app/api/mine-topics?secret=sabka2026go"`
Expected: `{"success": true, "message": "Topics mined"}`

Check Supabase — new topics should have `search_volume > 0`.
