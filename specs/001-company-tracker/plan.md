# План реализации: Трекер целевых компаний

**Ветка**: `001-company-tracker` (git: `main`) | **Дата**: 2026-10-05 | **Спека**: [spec.md](./spec.md)

**Вход**: спецификация `/specs/001-company-tracker/spec.md`

**Примечание**: этот файл заполнен командой `/speckit-plan` по шаблону. Спека и план утверждены. Analyze remediation закрыт (I2/A3/D2 и мелкие правки в spec/tasks/checklist). Implement этим шагом не запускается.

## Summary

Соискатель ведёт список целевых компаний (имя, сайт, email, сопроводительное письмо, вакансии-гиперссылки) в статическом приложении на GitHub Pages. Рабочая копия живёт в IndexedDB браузера. GrokBot наполняет канонический публичный файл той же схемы без UI.

Официальные решения clarify:

- **Q1**: вакансии не из живого API. Основной путь — ручная ссылка в форме создания/правки компании; файл и импорт тоже MAY содержать ссылки.
- **Q2**: фильтр «для фронтенда» — только встроенный фиксированный набор. Пользователь набор не редактирует.
- **Q3 / FR-019**: публичный файл — полный снимок (включая email и письма). Тексты писем в файле — шифртекст. Ключ читается только из `localStorage` по **имени** `sKey`. **Значение ключа NEVER** попадает в репозиторий, спеку, этот план, research, контракты, quickstart, тесты, сиды, `.env*` и комментарии. Если `sKey` нет — письма не расшифровывать и не показывать открытый текст из файла.

Каркас React + Vite + TypeScript уже есть. Неофициальная реализация на диске **не совпадает** с Q2/Q3 (есть UI доп. ключевых слов; публичная схема вырезает email/письмо). После review-plan implement MUST выровнять код под этот план, а не под старые допущения.

## Technical Context

**Language/Version**: TypeScript 6 (`strict`, без `any`), React 19, Vite 8

**Primary Dependencies**: Tailwind CSS 4, Zod 4, idb-keyval, Web Crypto (`SubtleCrypto`: PBKDF2 + AES-GCM). ESLint + typescript-eslint, Vitest + Testing Library. Новых крипто-библиотек нет.

**Storage**: IndexedDB (`idb-keyval`), ключ каталога `job-searching:catalog` — открытый текст рабочей копии. Ключ расшифровки писем — только `localStorage` имя `sKey` (значение задаёт пользователь в браузере). Публичный снимок: `public/data/companies.json`. Отдельного ключа «пользовательские слова фильтра» быть MUST NOT.

**Testing**: Vitest + Testing Library + jsdom. Тесты шифрования используют **только тестовую фразу, рождённую в тесте**; значение пользовательского ключа в фикстурах запрещено.

**Target Platform**: современные настольные браузеры; статический сайт GitHub Pages (`VITE_BASE=/` в dev, `/job_searching/` в production)

**Project Type**: одностраничное веб-приложение без backend

**Performance Goals**: список десятков компаний правится без заметной задержки; сохранение карточки ощущается мгновенным; расшифровка писем одного каталога не блокирует UI заметно

**Constraints**: нет серверной БД и своего API; нет живого API вакансий; нет `any`; нет преждевременных `useMemo`/`useCallback`; нет Redux; значение `sKey` никогда не коммитится; конституция обязательна

**Scale/Scope**: один пользователь на браузер; один экран список+карточка; без учёток и синхронизации устройств

Маркеров NEEDS CLARIFICATION нет: Q1–Q3 закрыты в спеке.

## Constitution Check

*GATE: пройден до Phase 0. Повторно проверен после Phase 1 — см. тот же вердикт ниже.*

| Принцип | Вердикт | Как соблюдаем |
|---------|---------|----------------|
| I. Единый стиль | PASS | Тот же Vite/TS/Tailwind каркас, алиас `@/`, те же имена файлов |
| II. Понятность за 5 минут | PASS | Плоские модули: схема, хранилище, каталог, фильтр, конверт письма, компоненты экрана |
| III. Простота | PASS | Без роутера, без Redux, без слоёв «репозиторий/use-case». Крипто — один модуль Web Crypto, без сторонней библиотеки |
| IV. DRY и явные имена | PASS | Одна Zod-схема границы файла; один набор ключевых слов; одно имя `sKey` |
| V. Минимум состояния | PASS | Каталог + выбранный id + черновик формы + флаг фильтра. Ключ не дублируется в React-state как «источник правды» — источник `localStorage.sKey`. Отфильтрованный список вакансий не хранится |
| VI. Без ранней оптимизации | PASS | Без `useMemo`/`useCallback`, пока не сломается поведение |
| VII. Без `any` | PASS | Zod на границе файла/IDB; конверт письма — явный тип, не `string` «на удачу» |
| VIII. Без мёртвого кода | PASS | После выравнивания с Q2 удалить extra-keywords (хранилище, UI, `mergeFilterKeywords` с пользовательским списком) |

Нарушений, требующих Complexity Tracking, нет.

## Project Structure

### Documentation (this feature)

```text
specs/001-company-tracker/
├── plan.md              # этот файл
├── research.md          # Phase 0
├── data-model.md        # Phase 1
├── quickstart.md        # Phase 1
├── contracts/
│   └── catalog.schema.md
└── tasks.md             # Phase 2 (/speckit-tasks) — этим шагом не создавать/не обновлять
```

### Source Code (repository root)

```text
src/
├── main.tsx
├── App.tsx
├── index.css
├── lib/
│   ├── schema.ts          # Zod: каталог файла и рабочей копии
│   ├── storage.ts         # IndexedDB, только каталог
│   ├── catalog.ts         # сид, CRUD, импорт/экспорт, сброс к файлу сайта
│   ├── keywords.ts        # только BUILTIN_FRONTEND_KEYWORDS
│   ├── vacancies.ts       # клиентский фильтр по встроенному набору
│   └── letter-crypto.ts   # конверт enc.v1, PBKDF2+AES-GCM, чтение localStorage.sKey
├── components/
│   ├── CompanyList.tsx
│   ├── CompanyForm.tsx    # имя, сайт, email, письмо, ручные ссылки вакансий
│   ├── VacancyList.tsx    # гиперссылки + тумблер фильтра (без редактора слов)
│   ├── CatalogTransfer.tsx
│   └── DecryptKeyField.tsx  # пишет только localStorage.sKey; значение не в каталог
└── test/setup.ts

public/data/
├── companies.json         # полный снимок; coverLetter — конверт или ""
└── companies.schema.json
```

**Structure Decision**: один фронтенд-проект в корне (уже инициализирован). Тесты рядом с модулями (`*.test.ts` / `*.test.tsx`). Отдельного backend нет.

## Phase 0 / Phase 1 — артефакты

Сгенерированы:

- [research.md](./research.md) — решения Q1–Q3, крипто, хранилище, стек
- [data-model.md](./data-model.md) — сущности, валидация, состояния
- [contracts/catalog.schema.md](./contracts/catalog.schema.md) — файл GrokBot, конверт письма
- [quickstart.md](./quickstart.md) — проверка end-to-end без значения ключа

## Constitution Check (после Phase 1)

Повторная оценка после data-model / contracts / quickstart: **PASS**, таблица выше без изменений. Новых слоёв и неоправданной сложности дизайн не добавил. Complexity Tracking не требуется.

## Complexity Tracking

Не требуется: нарушений конституции нет.
