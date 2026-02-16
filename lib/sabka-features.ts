/**
 * Single source of truth for Sabka product features.
 * Used by the writer to avoid hallucinating capabilities.
 * Based on sabka_description_seo.md — update here when features change.
 */

export const SABKA_FEATURES = `
## Что такое Сабка

Сабка (sabka.pro) — рабочее пространство для работы с ИИ. Все лучшие нейросети в одном месте без VPN.
Целевая аудитория: маркетологи, копирайтеры, контент-мейкеры, предприниматели.
Сабка — это чат с нейросетями. НЕ конструктор ботов, НЕ платформа для автоматизации.

## Ключевые функции

### 1. Мультичат (уникальная фича)
Один запрос → 3 нейросети параллельно → 3 ответа → выбираешь лучший или комбинируешь.
Дефолтные модели: GPT 5 nano, Gemini 2.0 Flash, DeepSeek Chat.

### 2. Фактчек через Perplexity (уникальная фича)
Любой ответ любой нейросети можно проверить одним кликом.
Perplexity ищет подтверждения/опровержения в интернете, показывает ссылки на источники.

### 3. Общая память (уникальная фича)
Нейросети помнят контекст между сессиями и чатами.
Автоматически извлекает факты из диалогов: имена, компании, проекты, предпочтения.
Работает для всех моделей — сказал Claude, вспомнит GPT.
До 3 000 воспоминаний, автоочистка через 90 дней.

### 4. Голосовой ввод
Наговори мысли с паузами и ошибками — Сабка поймёт. Удобно с мобильного.

### 5. Дополнительно
- Веб-поиск для всех моделей
- Загрузка файлов: PDF, DOCX, изображения, аудио, видео (до 50 МБ)
- Библиотека промптов С2: шаблоны для маркетинга, копирайтинга, SMM (sabka.pro/prompts)
- История чатов с поиском

## Доступные модели (30+)
OpenAI: GPT 5 nano, GPT 5 Mini, GPT 5, GPT 4.1 Mini, o3 mini, o3, GPT 5.2, GPT 5.2 Codex, GPT 5 Imagex, GPT 5 Image Mini
Anthropic: Claude 3 Haiku, Claude Opus 4.6, Claude 4.5 Sonnet
Google: Gemini 2.5 Flash, Gemini 3 Pro, Nano Banana, Nano Banana Pro
xAI: Grok 4.1 Fast, Grok Code Fast 1, Grok 4
Perplexity: Sonar, Sonar Pro
DeepSeek: V3, V3.2, R1
MiniMax M2.1, Kimi 2.5, Xiaomi MiMo V2 Flash

## Тарифы
- Free (0 руб): 12 запросов, базовые модели, фактчек + память
- Plus (999 руб/мес): 4 млн токенов, все модели
- Pro (1 599 руб/мес): 8 млн токенов, все модели

Сабка — не безлимитный сервис. Разные модели стоят по-разному (GPT 5 дороже DeepSeek Chat). Токены расходуются в зависимости от выбранной модели.

## Чего Сабка НЕ делает (не упоминать как фичи!)
- Не строит ботов
- Не создаёт автоматизации
- Не является ИИ-ассистентом
- Не имеет API для разработчиков
`;

export const SABKA_LINKS = {
  main: "https://sabka.pro",
  prompts: "https://sabka.pro/prompts",
  business: "https://sabka.pro/business",
  blog: "https://sabka.pro?utm_source=blog",
  support: "https://t.me/sabka_help",
  videos: "https://vk.com/sabka_pro",
} as const;
