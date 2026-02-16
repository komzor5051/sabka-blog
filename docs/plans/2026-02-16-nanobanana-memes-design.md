# Nano Banana Pro: Мемы с русским текстом для блога

## Проблема

Writer генерирует описания мемов с русским текстом:
> "Программист в 3 часа ночи перед монитором, подпись КОГДА CHATGPT ДАЕТ РАЗНЫЙ ОТВЕТ КАЖДЫЙ РАЗ"

Но `image-generator.ts` оборачивает это в промпт:
> "professional editorial illustration, NO text, NO letters, NO words"

Результат — скучные иллюстрации без текста и без юмора.

## Решение

Заменить модель и промпт в `image-generator.ts`:

- **Модель**: `gemini-2.5-flash-preview-05-20` → `gemini-3-pro-image-preview` (Nano Banana Pro)
- **Промпт**: профессиональная иллюстрация → мем в стиле Rick and Morty с русским текстом
- **Инфраструктура**: без изменений (Supabase Storage, regex, upload flow)

## Файлы

Один файл: `/Users/lvmn/sabka-blog/lib/pipeline/image-generator.ts`

### Изменения

1. `generateImage()` — сменить модель на `gemini-3-pro-image-preview`
2. `buildPrompt()` — полная замена промпта:
   - Стиль: Rick and Morty / яркий мультяшный мем
   - Русский текст на картинке обязателен (крупный, читаемый)
   - 16:9 формат
   - IT/AI тематика

## Не трогаем

- `writer.ts` — уже генерирует правильные описания мемов
- `editors.ts` — уже сохраняет MEME-плейсхолдеры
- `gemini.ts` — текстовая генерация остаётся на gemini-2.5-flash
- `publisher.ts`, `telegram.ts`, все API routes, frontend

## Риски

- Nano Banana Pro — preview модель, может быть нестабильна
- Русский текст на картинках — LLM всё ещё могут ошибаться в кириллице
- Fallback: если генерация падает, placeholder просто удаляется (текущее поведение, сохраняем)
