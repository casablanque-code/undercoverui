/**
 * docTemplate — общая HTML-обёртка для страниц документации.
 * Импортируется и плагином (build/dev), и не зависит от Vite API,
 * чтобы можно было использовать в обоих режимах одинаково.
 */

export function docTemplate({ title, contentHtml, navItems, activeSlug }) {
  const nav = navItems
    .map(
      (item) => `<a href="/docs/${item.slug}/" class="doc-nav-link${item.slug === activeSlug ? ' active' : ''}">${item.label}</a>`,
    )
    .join('')

  return `<!doctype html>
<html lang="ru">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} — UndercoverUI Docs</title>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/styles/main.css">
  <link rel="stylesheet" href="/styles/docs.css">
</head>
<body class="docs-body">
  <header>
    <div class="header-inner">
      <a class="logo" href="/">
        <span class="logo-mark">U_</span>
        <span class="logo-text">Undercover<span>UI</span></span>
      </a>
      <nav>
        <a class="nav-link" href="/#components">Компоненты</a>
        <a class="nav-link" href="/#compliance">Compliance</a>
        <a class="nav-link" href="/docs/quick-start/">Документация</a>
      </nav>
    </div>
  </header>

  <div class="docs-layout">
    <aside class="docs-sidebar">
      <div class="docs-sidebar-title">Документация</div>
      ${nav}
    </aside>
    <main class="docs-content">
      ${contentHtml}
    </main>
  </div>

  <footer>
    <div class="footer-inner">
      <span class="footer-copy">© 2026 UndercoverUI — открытый проект · MIT</span>
      <div class="footer-links">
        <a href="https://github.com/casablanque-code/undercoverui" target="_blank" rel="noopener">GitHub</a>
        <a href="/">На главную</a>
      </div>
    </div>
  </footer>
</body>
</html>`
}

export const DOC_NAV_ITEMS = [
  { slug: 'quick-start', label: 'Быстрый старт' },
  { slug: 'contribution', label: 'Добавить компонент' },
  { slug: 'compliance', label: 'Compliance & Тесты' },
  { slug: 'changelog', label: 'Regulatory Changelog' },
]
