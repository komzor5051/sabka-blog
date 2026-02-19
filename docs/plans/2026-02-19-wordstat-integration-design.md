# Wordstat API Integration — Design Document

**Date**: 2026-02-19
**Status**: Approved

## Summary

Integrate Yandex Wordstat API (new REST API at wordstat.yandex.ru/api/v1/) into the topic mining pipeline. Two integration points: seed queries before Gemini generation, and search volume validation after.

## API

Using the **new Wordstat API** (launched 2025), not the old Yandex.Direct v4 API.

- Base URL: `https://wordstat.yandex.ru/api/v1`
- Auth: `Authorization: Bearer <WORDSTAT_TOKEN>`
- Primary method: `/v1/topRequests` — returns popular queries with search volumes
- Rate limit: per-second + daily quota (check via `/v1/userInfo`)
- Max 128 phrases per request

## Pipeline Change

### Before (current)
```
Exa trends → Gemini generates 10 topics (AI score 1-10) → save to Supabase
```

### After
```
1. Wordstat /v1/topRequests(seed phrases) → top 50 popular queries with volumes
2. Exa trends + Wordstat context → Gemini generates 10 topics
3. Wordstat /v1/topRequests(each topic's keyword) → real search_volume
4. final_score = AI_score * 0.4 + normalized_volume * 0.6
5. Topics with volume=0 → status=rejected
6. Save to Supabase with search_volume
```

## Files

| File | Change |
|---|---|
| `lib/wordstat.ts` | NEW — API wrapper: `getTopRequests()`, `getSearchVolume()`, `getUserInfo()` |
| `lib/pipeline/topic-miner.ts` | MODIFY — add seed queries + post-validation |
| `lib/db-schema.sql` | MODIFY — add `search_volume INT` column |
| `.env.local` | MODIFY — add `WORDSTAT_TOKEN` |
| `CLAUDE.md` (Sabka_Content_Factory) | MODIFY — update docs |

## Key Decisions

- **Graceful degradation**: if Wordstat fails (quota/network), pipeline runs without validation (same as before)
- **Rate limiting**: 1 req/sec with retry + exponential backoff
- **No caching**: runs every 3 days, not worth it
- **Region**: all of Russia (default)
- **Score formula**: `final_score = AI_score * 0.4 + normalized_volume * 0.6` where normalized_volume = min(volume / 10000, 1.0) * 10
- **Rejection threshold**: topics with 0 search volume get status=rejected

## Environment Variables

```
WORDSTAT_TOKEN    # Yandex Wordstat API OAuth token (Bearer)
```
