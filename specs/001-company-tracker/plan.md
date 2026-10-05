# План реализации: Трекер целевых компаний

**Ветка**: `001-company-tracker` (git: `main`) | **Дата**: 2026-10-05 | **Спека**: [spec.md](./spec.md)

**Вход**: спецификация `/specs/001-company-tracker/spec.md`

**Примечание**: этот файл заполнен командой `/speckit-plan` по шаблону. Спека и план утверждены. Analyze remediation закрыт. Implement выполнен. Поздний отзыв пользователя: таблица-обзор на главном экране; шифрование писем снято целиком.

## Summary

Соискатель ведёт список целевых компаний (имя, сайт, email, сопроводительное письмо, вакансии-гиперссылки) в статическом приложении на GitHub Pages. На главном экране — таблица-обзор и текущий флоу списка/формы. Рабочая копия живёт в IndexedDB браузера. GrokBot наполняет канонический публичный файл той же схемы без UI.

Официальные решения:

- **Q1**: вакансии не из живого API. Основной путь — ручная ссылка в форме создания/правки компании; файл и импорт тоже MAY содержать ссылки.
- **Q2**: фильтр «для фронтенда» — только встроенный фиксированный набор. Пользователь набор не редактирует.
- **Q3 / FR-019**: публичный файл — полный снимок (включая email и письма). `coverLetter` — обычная строка везде. Шифрования нет: нет ключа, нет конверта, нет поля ввода ключа.
- **Таблица**: колонки имя / сайт / email / вакансии; письмо в подсказке строки; имя открывает карточку; ссылки кликабельны. Форма редактирования сохраняется.

Каркас React + Vite + TypeScript. Реализация выровнена под этот план.

## Technical Context

**Language/Version**: TypeScript 6 (`strict`, без `any`), React 19, Vite 8

**Primary Dependencies**: Tailwind CSS 4, Zod 4, idb-keyval. ESLint + typescript-eslint, Vitest + Testing Library. Крипто-библиотек нет.

**Storage**: IndexedDB (`idb-keyval`), ключ каталога `job-searching:catalog` — тот же снимок, что файл. Публичный снимок: `public/data/companies.json`. Отдельного ключа «пользовательские слова фильтра» быть MUST NOT. `localStorage` для писем не используется.

**Testing**: Vitest + Testing Library + jsdom. Проверки схемы, импорта/экспорта обычной строки письма, фильтра и таблицы.

**Target Platform**: современные настольные браузеры; статический сайт GitHub Pages (`VITE_BASE=/` в dev, `/job_searching/` в production)

**Project Type**: одностраничное веб-приложение без backend

**Performance Goals**: список десятков компаний правится без заметной задержки; сохранение карточки ощущается мгновенным

**Constraints**: нет серверной БД и своего API; нет живого API вакансий; нет `any`; нет преждевременных `useMemo`/`useCallback`; нет Redux; нет шифрования писем; конституция обязательна

**Scale/Scope**: один пользователь на браузер; один экран таблица+список+карточка; без учёток и синхронизации устройств

Маркеров NEEDS CLARIFICATION нет.

## Constitution Check

*GATE: пройден до Phase 0. Повторно проверен после снятия шифрования — PASS.*

| Принцип | Вердикт | Как соблюдаем |
|---------|---------|----------------|
| I. Единый стиль | PASS | Тот же Vite/TS/Tailwind каркас, алиас `@/`, те же имена файлов |
| II. Понятность за 5 минут | PASS | Плоские модули: схема, хранилище, каталог, фильтр, таблица, компоненты экрана |
| III. Простота | PASS | Без роутера, без Redux, без крипто-модуля |
| IV. DRY и явные имена | PASS | Одна Zod-схема каталога; один набор ключевых слов |
| V. Минимум состояния | PASS | Каталог + выбранный id + черновик формы + флаг фильтра. Отфильтрованный список вакансий не хранится |
| VI. Без ранней оптимизации | PASS | Без `useMemo`/`useCallback`, пока не сломается поведение |
| VII. Без `any` | PASS | Zod на границе файла/IDB |
| VIII. Без мёртвого кода | PASS | Удалены `letter-crypto`, `DecryptKeyField`, extra-keywords |

Нарушений, требующих Complexity Tracking, нет.

## Project Structure

### Documentation (this feature)

```text
specs/001-company-tracker/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── catalog.schema.md
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── main.tsx
├── App.tsx
├── index.css
├── lib/
│   ├── schema.ts          # одна Zod-схема файла и рабочей копии
│   ├── storage.ts         # IndexedDB, только каталог
│   ├── catalog.ts         # сид, CRUD, импорт/экспорт, сброс к файлу сайта
│   ├── keywords.ts        # BUILTIN_FRONTEND_KEYWORDS + исключение React Native
│   └── vacancies.ts       # клиентский фильтр по встроенному набору
├── components/
│   ├── CompanyTable.tsx   # обзор: имя/сайт/email/вакансии; письмо в tooltip
│   ├── CompanyList.tsx    # компактный список + добавить/удалить
│   ├── CompanyForm.tsx    # имя, сайт, email, письмо, ручные ссылки вакансий
│   ├── VacancyList.tsx    # гиперссылки + тумблер фильтра
│   └── CatalogTransfer.tsx
└── test/setup.ts

public/data/
├── companies.json         # полный снимок; coverLetter — обычная строка
└── companies.schema.json
```

**Structure Decision**: один фронтенд-проект в корне. Тесты рядом с модулями. Отдельного backend нет.

## Phase 0 / Phase 1 — артефакты

Сгенерированы:

- [research.md](./research.md) — решения Q1–Q3, отказ от крипто, хранилище, стек
- [data-model.md](./data-model.md) — сущности и валидация
- [contracts/catalog.schema.md](./contracts/catalog.schema.md) — файл GrokBot
- [quickstart.md](./quickstart.md) — проверка end-to-end

## Constitution Check (после Phase 1)

Повторная оценка: **PASS**. Complexity Tracking не требуется.

## Complexity Tracking

Не требуется: нарушений конституции нет.
