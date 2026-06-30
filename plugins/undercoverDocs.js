/**
 * undercoverDocs — Vite plugin
 *
 * Рендерит docs/<slug>/index.md в полноценные HTML-страницы:
 *   - dev: middleware перехватывает GET /docs/<slug>/ и отдаёт рендер на лету
 *   - build: после основной сборки генерирует dist/docs/<slug>/index.html
 *
 * Markdown рендерится через `marked`, оборачивается в общий шаблон
 * с подключённым main.css — без этого слоя .md отдавался браузеру
 * как сырой текст без какой-либо стилизации.
 */

import { readFileSync, existsSync, readdirSync, mkdirSync, writeFileSync, copyFileSync } from 'fs'
import { join } from 'path'
import { marked } from 'marked'
import { docTemplate, DOC_NAV_ITEMS } from './docTemplate.js'

export function undercoverDocs() {
  let rootDir = ''
  let outDir = ''

  function renderDocPage(slug) {
    const mdPath = join(rootDir, 'docs', slug, 'index.md')
    if (!existsSync(mdPath)) return null

    const md = readFileSync(mdPath, 'utf-8')
    const titleMatch = md.match(/^#\s+(.+)$/m)
    const title = titleMatch ? titleMatch[1] : slug

    const contentHtml = marked.parse(md)

    return docTemplate({
      title,
      contentHtml,
      navItems: DOC_NAV_ITEMS,
      activeSlug: slug,
    })
  }

  function getAllDocSlugs() {
    const docsDir = join(rootDir, 'docs')
    if (!existsSync(docsDir)) return []
    return readdirSync(docsDir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
  }

  return {
    name: 'undercover-docs',

    configResolved(config) {
      rootDir = config.root
      outDir = join(rootDir, config.build.outDir)
    },

    configureServer(server) {
      // dev middleware: GET /docs/<slug>/ -> рендер markdown на лету
      server.middlewares.use((req, res, next) => {
        const match = req.url.match(/^\/docs\/([a-z0-9-]+)\/?$/)
        if (!match) return next()

        const slug = match[1]
        const html = renderDocPage(slug)
        if (!html) return next()

        res.setHeader('Content-Type', 'text/html')
        res.end(html)
      })

      // dev middleware: GET /styles/*.css -> отдаём напрямую из src/styles
      // (doc-страницы ссылаются на стабильный путь /styles/*.css, а не на
      //  хэшированный Vite-бандл, чтобы один и тот же шаблон работал
      //  одинаково в dev и build)
      server.middlewares.use((req, res, next) => {
        const match = req.url.match(/^\/styles\/([a-z0-9-]+\.css)$/)
        if (!match) return next()

        const cssPath = join(rootDir, 'src', 'styles', match[1])
        if (!existsSync(cssPath)) return next()

        res.setHeader('Content-Type', 'text/css')
        res.end(readFileSync(cssPath, 'utf-8'))
      })

      // hot-reload при правке .md
      const docsDir = join(rootDir, 'docs')
      server.watcher.add(docsDir)
      server.watcher.on('change', (file) => {
        if (file.endsWith('.md')) {
          server.ws.send({ type: 'full-reload' })
        }
      })
    },

    // build: генерируем статичные dist/docs/<slug>/index.html
    // + копируем CSS как статичные неизменяемые файлы dist/styles/*.css
    closeBundle() {
      const slugs = getAllDocSlugs()
      for (const slug of slugs) {
        const html = renderDocPage(slug)
        if (!html) continue

        const dir = join(outDir, 'docs', slug)
        mkdirSync(dir, { recursive: true })
        writeFileSync(join(dir, 'index.html'), html, 'utf-8')
      }
      if (slugs.length) {
        console.log(`[undercover-docs] Сгенерировано страниц документации: ${slugs.length}`)
      }

      const stylesOutDir = join(outDir, 'styles')
      mkdirSync(stylesOutDir, { recursive: true })
      const stylesSrcDir = join(rootDir, 'src', 'styles')
      if (existsSync(stylesSrcDir)) {
        for (const file of readdirSync(stylesSrcDir)) {
          if (file.endsWith('.css')) {
            copyFileSync(join(stylesSrcDir, file), join(stylesOutDir, file))
          }
        }
        console.log(`[undercover-docs] CSS скопирован в /styles/`)
      }
    },
  }
}
