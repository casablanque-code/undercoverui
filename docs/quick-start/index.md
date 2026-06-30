# Быстрый старт

UndercoverUI — это не npm-пакет. Здесь нет `npm install undercoverui`, нет версий, нет breaking changes в твоём бандле. Это **паттерны**: открытый код, который ты копируешь и адаптируешь под себя.

Этот принцип («copy, don't install») выбран намеренно — так уже работает [shadcn/ui](https://ui.shadcn.com), и для compliance-компонентов это даже важнее, чем для обычного UI: куки-баннер почти всегда требует правок под формулировки твоего юриста, и npm-зависимость тут только мешала бы.

## 30 секунд до результата

1. Открой [реестр компонентов](/#components)
2. Найди нужный (поиск или фильтр по категории)
3. Нажми **«Код»** на карточке или открой превью и вкладку **«Исходный код»**
4. Вставь в свой проект

Готово. Никакой сборки, никаких зависимостей — компоненты используют только нативный JS и инлайн-стили.

## Кастомизация под бренд

Каждый компонент использует простые инлайн-стили без CSS-переменных по умолчанию — это сделано специально, чтобы код был самодостаточным и не требовал внешнего стилбука. Чтобы перебить цвета под свой брендбук, ищи в коде:

```js
background: #4f46e5   // основной акцентный цвет — замени на свой
color: #374151        // текст
border-radius: 6px    // скругления — поменяй глобально через find&replace
```

Если ты используешь Tailwind или свою дизайн-систему — просто перенеси разметку (`<div>`, `<button>`) и замени инлайн-стили на классы.

## Интеграция с фреймворками

### React

```jsx
function CookieBanner() {
  const [visible, setVisible] = useState(() => {
    const saved = JSON.parse(localStorage.getItem('uu_consent') || 'null')
    return saved?.version !== '1.0'
  })

  function accept() {
    localStorage.setItem('uu_consent', JSON.stringify({
      version: '1.0', timestamp: Date.now(), categories: { analytics: true }
    }))
    setVisible(false)
    loadAnalytics()
  }

  if (!visible) return null

  return (
    <div role="dialog" aria-modal="true" className="cookie-banner">
      {/* разметка из template.html, JSX-синтаксис */}
    </div>
  )
}
```

### Vue 3

```vue
<script setup>
import { ref } from 'vue'

const visible = ref(true)
function accept() {
  localStorage.setItem('uu_consent', JSON.stringify({ version: '1.0', timestamp: Date.now() }))
  visible.value = false
}
</script>

<template>
  <div v-if="visible" role="dialog" aria-modal="true" class="cookie-banner">
    <!-- разметка из template.html -->
  </div>
</template>
```

### Svelte

```svelte
<script>
  let visible = true
  function accept() {
    localStorage.setItem('uu_consent', JSON.stringify({ version: '1.0', timestamp: Date.now() }))
    visible = false
  }
</script>

{#if visible}
  <div role="dialog" aria-modal="true" class="cookie-banner">
    <!-- разметка из template.html -->
  </div>
{/if}
```

Логика согласия (localStorage, версионирование, динамическая загрузка скриптов) везде одна и та же — меняется только то, как компонент монтируется/размонтируется во фреймворке.

## Что дальше

- [Чеклист compliance](/docs/compliance/) — почему компоненты выглядят именно так
- [Как добавить свой компонент](/docs/contribution/) — если хочешь контрибьютить
