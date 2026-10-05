# Трекер целевых компаний

Личное приложение-список компаний, в которых пользователь хочет работать.
Хостинг — GitHub Pages. Базы на сервере нет: рабочая копия живёт в браузере.

Каноническая продуктовая спецификация: [`specs/001-company-tracker/spec.md`](specs/001-company-tracker/spec.md).
Конституция: [`.specify/memory/constitution.md`](.specify/memory/constitution.md).

## Стек каркаса

| Слой | Выбор |
|------|--------|
| UI | React + Vite + TypeScript (`strict`, без `any`) |
| Стили | Tailwind CSS |
| Линт | ESLint + typescript-eslint |
| Тесты | Vitest + Testing Library |
| Контракт данных / импорт GrokBot | Zod + `public/data/companies.json` |
| Хранилище | IndexedDB через `idb-keyval` |
| Состояние | без Redux; без преждевременных `useMemo` / `useCallback` |

## Команды

```bash
npm install
npm run dev
npm run build
npm run preview
npm test
npm run lint
```

## GitHub Pages

- Базовый путь: переменная `VITE_BASE`.
  - разработка: `/` (`.env.development`)
  - публикация: `/job_searching/` (`.env.production`)
- Сборка копирует `dist/index.html` в `dist/404.html` на случай клиентских маршрутов.
- Выкладка: [`.github/workflows/pages.yml`](.github/workflows/pages.yml). В настройках репозитория включите Pages → Source: GitHub Actions.

## Контракт GrokBot

Агент пишет файл, не открывая UI:

- схема: `public/data/companies.schema.json` (на сайте: `/data/companies.schema.json`)
- данные: `public/data/companies.json` (на сайте: `/data/companies.json`)
- проверка в коде: `src/lib/schema.ts` (`parseCatalog`)

Пустой валидный снимок:

```json
{
  "schemaVersion": "1.0.0",
  "companies": []
}
```

## Что сейчас есть и чего нет

Есть: каркас, схема, обёртка IndexedDB, скрипты проверки, настройка Pages.

Нет (намеренно): CRUD компаний, письма в UI, фильтр вакансий, экран импорта.

Отложены без выдуманных ответов (не блокируют каркас): источник вакансий (Q1), авторство ключевых слов фильтра (Q2), какие поля агент имеет право класть в публичный файл (Q3). См. раздел «Отложенные уточнения» в спецификации.
