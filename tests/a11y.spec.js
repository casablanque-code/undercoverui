/**
 * a11y.spec.js
 *
 * Прогоняет axe-core по превью каждого компонента в реестре.
 * Ловит отсутствующие aria-атрибуты, недостаточный контраст,
 * незакрытые role'ы и прочие нарушения WCAG 2.1.
 *
 * Запуск: npx playwright test tests/a11y.spec.js
 */

import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { readFileSync, readdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const COMPONENTS_DIR = join(__dirname, '..', 'components')

function extractPreview(template) {
  const m = template.match(/\[PREVIEW\]([\s\S]*?)\[\/PREVIEW\]/)
  return m ? m[1].trim() : null
}

function getAllComponents() {
  const folders = readdirSync(COMPONENTS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)

  const result = []
  for (const folder of folders) {
    const metaPath = join(COMPONENTS_DIR, folder, 'meta.json')
    const templatePath = join(COMPONENTS_DIR, folder, 'template.html')
    if (!existsSync(metaPath) || !existsSync(templatePath)) continue

    const meta = JSON.parse(readFileSync(metaPath, 'utf-8'))
    const preview = extractPreview(readFileSync(templatePath, 'utf-8'))
    if (!preview) continue

    result.push({ folder, meta, preview })
  }
  return result
}

const components = getAllComponents()

// Правила axe, которые отключаем для изолированных iframe-превью
// (color-contrast иногда даёт false positive на полупрозрачных оверлеях,
//  page-has-heading-one неприменимо к фрагменту, не к целой странице)
const DISABLED_RULES = ['page-has-heading-one', 'landmark-one-main', 'region']

test.describe('Accessibility: axe-core проверка каждого компонента', () => {
  for (const { folder, meta, preview } of components) {
    test(`${folder}: без критичных нарушений WCAG`, async ({ page }) => {
      await page.setContent(preview)
      await page.waitForTimeout(100) // дать анимациям/скриптам инициализироваться

      const results = await new AxeBuilder({ page })
        .disableRules(DISABLED_RULES)
        .analyze()

      const critical = results.violations.filter(
        (v) => v.impact === 'critical' || v.impact === 'serious',
      )

      if (critical.length > 0) {
        const details = critical
          .map((v) => `  [${v.impact}] ${v.id}: ${v.description}\n    ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)
          .join('\n')
        throw new Error(`${folder}: найдены критичные нарушения a11y:\n${details}`)
      }

      expect(critical.length, `${folder}: не должно быть critical/serious нарушений`).toBe(0)
    })

    // Компоненты с тегом A11Y проходят более строгую проверку — 0 нарушений любой серьёзности
    if ((meta.tags || []).includes('A11Y')) {
      test(`${folder}: тег A11Y требует 0 нарушений любой серьёзности`, async ({ page }) => {
        await page.setContent(preview)
        await page.waitForTimeout(100)

        const results = await new AxeBuilder({ page })
          .disableRules(DISABLED_RULES)
          .analyze()

        if (results.violations.length > 0) {
          const details = results.violations
            .map((v) => `  [${v.impact}] ${v.id}: ${v.description}`)
            .join('\n')
          throw new Error(`${folder} помечен тегом A11Y, но axe находит нарушения:\n${details}`)
        }

        expect(results.violations.length).toBe(0)
      })
    }
  }
})
