# Трекер целевых компаний

Личное приложение-список компаний, в которых пользователь хочет работать.
Хостинг — GitHub Pages. **Это не облачная база:** рабочая копия живёт в IndexedDB
этого браузера и не синхронизируется между устройствами.

Каноническая продуктовая спецификация: [`specs/001-company-tracker/spec.md`](specs/001-company-tracker/spec.md).
Конституция: [`.specify/memory/constitution.md`](.specify/memory/constitution.md).

## Стек

| Слой | Выбор |
|------|--------|
| UI | React + Vite + TypeScript (`strict`, без `any`) |
| Стили | Tailwind CSS |
| Линт | ESLint + typescript-eslint |
| Тесты | Vitest + Testing Library |
| Контракт данных / импорт GrokBot | Zod + `public/data/companies.json` |
| Хранилище каталога | IndexedDB через `idb-keyval` |
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
- проверка в коде: `src/lib/schema.ts` (`parseFileCatalog`)

Публичный файл — полный снимок: `id`, `name`, `website`, `email`, `coverLetter`,
`vacancies`. Письмо — обычная строка, в том числе пустая. Шифрования нет.

Пустой валидный снимок:

```json
{
  "schemaVersion": "1.0.0",
  "companies": []
}
```

## Что умеет приложение

- Таблица-обзор: имя, сайт, email, вакансии. Имя открывает карточку; сайт, почта
  и вакансии — ссылки. Письмо — в подсказке строки, не отдельной колонкой.
- Список компаний и форма: создать, открыть, сохранить, удалить.
- Сопроводительное письмо в карточке; копирование — выделением текста в textarea.
- Вакансии добавляют вручную ссылками. Фильтр «для фронтенда» — только встроенный набор.
- Импорт и экспорт JSON той же схемы, явный сброс к файлу сайта.
