const WORDSTAT_BASE = "https://api.wordstat.yandex.net/v1";

// ── Types ──────────────────────────────────────────────────────────────

export interface TopRequest {
  phrase: string;
  count: number;
}

export interface TopRequestsResponse {
  requestPhrase: string;
  totalCount: number;
  topRequests: TopRequest[];
  associations: TopRequest[];
}

export interface UserInfo {
  login: string;
  rpsLimit: number;
  dailyLimit: number;
  remainingLimit: number;
}

/** Raw shape from the Wordstat API (field names differ from our interface) */
interface UserInfoRaw {
  login: string;
  limitPerSecond: number;
  dailyLimit: number;
  dailyLimitRemaining: number;
}

// ── Helpers ────────────────────────────────────────────────────────────

function getToken(): string | null {
  return process.env.WORDSTAT_TOKEN ?? null;
}

async function wordstatFetch<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const token = getToken();
  if (!token) {
    throw new Error("[Wordstat] WORDSTAT_TOKEN is not set");
  }

  const response = await fetch(`${WORDSTAT_BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`[Wordstat] ${path} failed: ${response.status} ${text}`);
  }

  return response.json() as Promise<T>;
}

// ── Public API ─────────────────────────────────────────────────────────

/**
 * Fetches top search requests from Yandex Wordstat for the given phrases.
 * @param phrases — up to 128 seed phrases
 * @param numPhrases — how many top requests per phrase (default 50, max 2000)
 */
export async function getTopRequests(
  phrases: string[],
  numPhrases?: number
): Promise<TopRequestsResponse[]> {
  return wordstatFetch<TopRequestsResponse[]>("/topRequests", {
    phrases: phrases.slice(0, 128),
    ...(numPhrases !== undefined && { numPhrases }),
  });
}

/**
 * Returns total monthly search volume for a single phrase.
 * Returns 0 on any error (graceful degradation).
 */
export async function getSearchVolume(phrase: string): Promise<number> {
  try {
    const results = await getTopRequests([phrase], 1);
    return results[0]?.totalCount ?? 0;
  } catch (err) {
    console.warn("[Wordstat] getSearchVolume failed:", (err as Error).message);
    return 0;
  }
}

/**
 * Checks current API quota and user info.
 */
export async function getUserInfo(): Promise<UserInfo> {
  const wrapper = await wordstatFetch<{ userInfo: UserInfoRaw }>("/userInfo", {});
  const raw = wrapper.userInfo;
  return {
    login: raw.login,
    rpsLimit: raw.limitPerSecond,
    dailyLimit: raw.dailyLimit,
    remainingLimit: raw.dailyLimitRemaining,
  };
}

/**
 * Collects popular related queries for a list of seed phrases.
 * Returns a formatted string for use as Gemini context.
 * Returns empty string on error (graceful degradation).
 */
export async function collectSeedQueries(seedPhrases: string[]): Promise<string> {
  try {
    const results = await getTopRequests(seedPhrases, 50);

    const lines: string[] = [];
    for (const r of results) {
      lines.push(`## "${r.requestPhrase}" (${r.totalCount} searches/month)`);
      for (const t of r.topRequests.slice(0, 20)) {
        lines.push(`- ${t.phrase}: ${t.count}`);
      }
      if (r.associations.length > 0) {
        lines.push(`\nAssociations:`);
        for (const a of r.associations.slice(0, 10)) {
          lines.push(`- ${a.phrase}: ${a.count}`);
        }
      }
      lines.push("");
    }

    return lines.join("\n");
  } catch (err) {
    console.warn("[Wordstat] collectSeedQueries failed:", (err as Error).message);
    return "";
  }
}
