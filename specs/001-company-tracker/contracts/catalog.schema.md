# Контракт каталога (GrokBot, сид, импорт, экспорт)

Агент наполняет список, не открывая UI: пишет файлы этой схемы.

## Канонические пути

| Роль | Путь в репозитории | URL на сайте |
|------|--------------------|--------------|
| Данные | `public/data/companies.json` | `{VITE_BASE}data/companies.json` |
| JSON Schema | `public/data/companies.schema.json` | `{VITE_BASE}data/companies.schema.json` |

Это эквивалент `data/companies.json` / `data/companies.schema.json` из FR-013.

## Форма снимка

```json
{
  "schemaVersion": "1.0.0",
  "companies": [
    {
      "id": "acme",
      "name": "Acme",
      "website": "https://acme.example",
      "email": "jobs@acme.example",
      "coverLetter": "Здравствуйте, команда Acme.",
      "fameRank": 1,
      "vacancies": [
        {
          "id": "fe-1",
          "title": "Frontend Engineer",
          "url": "https://acme.example/jobs/fe-1",
          "summary": "React TypeScript",
          "lastAppliedAt": "2026-10-01"
        }
      ]
    }
  ]
}
```

Полный снимок допустим: `email` и `coverLetter` — обычные строки. Пустая строка письма допустима. `lastAppliedAt` у вакансии — `YYYY-MM-DD` или `""`. Битая дата отклоняет весь файл. `fameRank` — необязательное число (меньше = известнее на **этой странице**); нет поля — компания в конце списка страницы. Старый JSON без `fameRank` валиден.

GrokBot по-прежнему пишет **плоский** файл `{ schemaVersion, companies }`. Приложение при загрузке/сиде оборачивает его в одну страницу. Экспорт из UI — `{ schemaVersion, pages, activePageIndex }` (все батчи). Импорт плоского файла в уже открытый каталог добавляет **новую** страницу, не сливая компании.

## Импорт и экспорт

Тот же `schemaVersion` и массив `companies`. Экспорт рабочей копии пишет письма как есть. Импорт невалидного файла отклоняется целиком.

Повторная запись с тем же `id` — обновление компании, не вторая карточка.

## Ошибки контракта

| Ситуация | Поведение |
|----------|-----------|
| Нет `schemaVersion` | Отказ |
| Мажорная версия ≠ 1 | Отказ |
| Компания без `id` или `name` | Отказ всего файла |
| Битый URL/email при непустом значении | Отказ всего файла |
| Вакансия без `id` / `title` / `url` | Отказ всего файла |
| `lastAppliedAt` не пустой и не `YYYY-MM-DD` | Отказ всего файла |

Проверка в коде: Zod в `src/lib/schema.ts`. Одна схема для файла и рабочей копии.
