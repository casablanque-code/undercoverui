# UndercoverUI

Открытый реестр compliance-компонентов: куки-баннеры, страницы ошибок, empty states — с реальным GDPR/CCPA соответствием, проверяемым автоматически в CI, а не задекларированным на словах.

Скопировал код — вставил в проект. Без npm-зависимостей, без сборщика на стороне потребителя.

## Почему

Дизайн куки-баннера — не вопрос вкуса. CNIL и ICO штрафуют за конкретные паттерны интерфейса (asymmetric accept/reject buttons), Honda заплатила $632,500 за разное число кликов до opt-in и opt-out. Большинство open-source UI-библиотек не учитывают это вообще — компонент выглядит хорошо, но юридически дырявый.

Здесь каждый legal-компонент проходит **click-parity тест** — Playwright-проверка, что кнопки Accept/Reject симметричны по размеру, и axe-core проверку на accessibility.

## Стек

- **Vite** + кастомный плагин, который собирает реестр из папок `components/*`
- Vanilla JS на фронте — никакого фреймворка, чтобы порог входа для контрибьюторов был нулевым
- **Playwright + axe-core** — accessibility и click-parity тесты в CI
- Cloudflare Pages — деплой

## Структура проекта

```
undercoverui/
├── components/              # каждый компонент = папка с meta.json + template.html
│   └── cookie-banner-classic/
│       ├── meta.json
│       └── template.html
├── plugins/
│   └── undercoverComponents.js   # Vite-плагин, собирает components/* в массив
├── scripts/
│   └── validate-components.mjs   # CI-валидатор схемы
├── tests/
│   ├── a11y.spec.js              # axe-core по каждому компоненту
│   └── click-parity.spec.js      # фирменный тест на dark patterns
├── docs/                     # документация в .md
│   ├── quick-start/
│   ├── contribution/
│   ├── compliance/
│   └── changelog/
└── src/                      # UI приложения
    ├── ui/                    # grid, modal, app bootstrap
    ├── lib/                   # likes, clipboard, escape — чистые утилиты
    └── styles/
```

## Разработка

```bash
npm install
npm run dev          # dev-сервер с hot-reload при изменении components/*
npm run validate      # проверка структуры всех компонентов
npm run test          # validate + a11y + click-parity
npm run build          # production-сборка в dist/
```

## Добавить компонент

Создай папку `components/твой-компонент/` с `meta.json` и `template.html`. Подробности и схема — в [Contribution Guide](/docs/contribution/).

## Документация

- [Быстрый старт](/docs/quick-start/) — как использовать компоненты
- [Contribution Guide](/docs/contribution/) — как добавить свой
- [Compliance Checklist](/docs/compliance/) — почему компоненты выглядят именно так
- [Regulatory Changelog](/docs/changelog/) — журнал регуляторных изменений

## Лицензия

MIT
