/**
 * undercoverComponents — Vite plugin
 *
 * Обходит папки components/*  при каждом билде/dev-сервере.
 * Для каждой папки читает:
 *   meta.json      — метаданные карточки
 *   template.html  — превью для iframe + код для копирования
 *
 * Инжектирует виртуальный модуль `virtual:components` который
 * экспортирует массив COMPONENTS. index.html его просто импортирует.
 *
 * Добавить компонент = создать папку + два файла. Vite сам увидит.
 */

import { readFileSync, readdirSync, existsSync } from 'fs'
import { resolve, join } from 'path'
import { glob } from 'glob'

const VIRTUAL_ID = 'virtual:components'
const RESOLVED_VIRTUAL_ID = '\0' + VIRTUAL_ID

export function undercoverComponents() {
  let rootDir = ''

  return {
    name: 'undercover-components',
    configResolved(config) {
      rootDir = config.root
    },

    resolveId(id) {
      if (id === VIRTUAL_ID) return RESOLVED_VIRTUAL_ID
    },

    async load(id) {
      if (id !== RESOLVED_VIRTUAL_ID) return

      const componentsDir = join(rootDir, 'components')
      const components = await loadComponents(componentsDir)

      return `export const COMPONENTS = ${JSON.stringify(components, null, 2)};`
    },

    // Hot-reload при изменении любого meta.json или template.html
    configureServer(server) {
      const componentsDir = join(rootDir, 'components')
      server.watcher.add(componentsDir)
      server.watcher.on('change', (file) => {
        if (file.includes('/components/') && (file.endsWith('meta.json') || file.endsWith('template.html'))) {
          const mod = server.moduleGraph.getModuleById(RESOLVED_VIRTUAL_ID)
          if (mod) {
            server.moduleGraph.invalidateModule(mod)
            server.ws.send({ type: 'full-reload' })
          }
        }
      })
    },
  }
}

async function loadComponents(componentsDir) {
  if (!existsSync(componentsDir)) return []

  const folders = readdirSync(componentsDir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name)
    .sort()

  const components = []

  for (const folder of folders) {
    const folderPath = join(componentsDir, folder)
    const metaPath = join(folderPath, 'meta.json')
    const templatePath = join(folderPath, 'template.html')

    if (!existsSync(metaPath)) {
      console.warn(`[undercover] Нет meta.json в ${folder}, пропускаю`)
      continue
    }
    if (!existsSync(templatePath)) {
      console.warn(`[undercover] Нет template.html в ${folder}, пропускаю`)
      continue
    }

    let meta
    try {
      meta = JSON.parse(readFileSync(metaPath, 'utf-8'))
    } catch (e) {
      console.error(`[undercover] Невалидный meta.json в ${folder}:`, e.message)
      continue
    }

    const errors = validateMeta(meta, folder)
    if (errors.length) {
      console.error(`[undercover] meta.json ошибки в ${folder}:\n  ${errors.join('\n  ')}`)
      continue
    }

    const template = readFileSync(templatePath, 'utf-8')

    // template.html содержит два блока, разделённых маркером:
    //   [PREVIEW] ... [/PREVIEW]  — iframe-ready полный HTML документ
    //   [CODE] ... [/CODE]        — код для копирования пользователем
    const preview = extractBlock(template, 'PREVIEW')
    const code    = extractBlock(template, 'CODE')

    if (!preview) {
      console.warn(`[undercover] Нет блока [PREVIEW] в ${folder}/template.html`)
      continue
    }

    components.push({
      id:         meta.id,
      slug:       folder,
      cat:        meta.category,
      title:      meta.title,
      desc:       meta.description,
      tags:       meta.tags || [],
      compliance: meta.compliance || [],
      refs:       meta.regulatory_refs || [],
      author:     meta.author || 'community',
      version:    meta.version || '1.0.0',
      copies:     meta.copies || 0,
      hearts:     meta.hearts || 0,
      preview,
      code: code || preview,
    })
  }

  return components
}

function extractBlock(html, name) {
  const re = new RegExp(`\\[${name}\\]([\\s\\S]*?)\\[\\/${name}\\]`)
  const m = html.match(re)
  return m ? m[1].trim() : null
}

// meta.json схема валидации
const REQUIRED_FIELDS = ['id', 'title', 'category', 'description']
const VALID_CATEGORIES = ['legal', 'error', 'empty', 'anim']
const VALID_TAGS       = ['GDPR', 'CCPA', 'A11Y']

function validateMeta(meta, folder) {
  const errors = []

  for (const field of REQUIRED_FIELDS) {
    if (!meta[field]) errors.push(`отсутствует обязательное поле "${field}"`)
  }

  if (meta.category && !VALID_CATEGORIES.includes(meta.category)) {
    errors.push(`неверная category "${meta.category}", допустимые: ${VALID_CATEGORIES.join(', ')}`)
  }

  if (meta.tags) {
    for (const tag of meta.tags) {
      if (!VALID_TAGS.includes(tag)) {
        errors.push(`неизвестный тег "${tag}", допустимые: ${VALID_TAGS.join(', ')}`)
      }
    }
  }

  if (meta.version && !/^\d+\.\d+\.\d+$/.test(meta.version)) {
    errors.push(`version должна быть semver (напр. "1.0.0")`)
  }

  return errors
}
