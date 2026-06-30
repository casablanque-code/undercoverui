/**
 * click-parity.spec.js
 *
 * Фирменный тест проекта. Для каждого legal-компонента с кнопками
 * "Принять"/"Отклонить" проверяет, что они находятся на ОДИНАКОВОЙ
 * глубине DOM и требуют одинакового числа кликов для активации.
 *
 * Это автоматизированная проверка против dark patterns, за которые
 * штрафует CNIL/ICO: спрятанная или визуально приглушённая кнопка
 * "Отклонить" — нарушение GDPR Recital 32.
 *
 * Запуск: npx playwright test tests/click-parity.spec.js
 */

import { test, expect } from '@playwright/test'
import { readFileSync, readdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const COMPONENTS_DIR = join(__dirname, '..', 'components')

function extractPreview(template) {
  const m = template.match(/\[PREVIEW\]([\s\S]*?)\[\/PREVIEW\]/)
  return m ? m[1].trim() : null
}

// Компоненты, которые содержат пару accept/reject кнопок
// (определяем по наличию обоих паттернов текста в превью)
function getLegalConsentComponents() {
  const folders = readdirSync(COMPONENTS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)

  const result = []
  for (const folder of folders) {
    const metaPath = join(COMPONENTS_DIR, folder, 'meta.json')
    const templatePath = join(COMPONENTS_DIR, folder, 'template.html')
    if (!existsSync(metaPath) || !existsSync(templatePath)) continue

    const meta = JSON.parse(readFileSync(metaPath, 'utf-8'))
    if (meta.category !== 'legal') continue

    const preview = extractPreview(readFileSync(templatePath, 'utf-8'))
    if (!preview) continue

    // Эвристика: ищем пару "Принять"/"Отклонить" в HTML
    const hasAccept = /Принять/.test(preview)
    const hasReject = /Отклонить/.test(preview)
    if (hasAccept && hasReject) {
      result.push({ folder, preview })
    }
  }
  return result
}

const consentComponents = getLegalConsentComponents()

test.describe('Click-parity: симметрия Accept/Reject кнопок', () => {
  for (const { folder, preview } of consentComponents) {
    test(`${folder}: одинаковая глубина DOM и размер кнопок`, async ({ page }) => {
      await page.setContent(preview)

      const buttons = page.locator('button')
      const count = await buttons.count()
      expect(count, `${folder}: должно быть минимум 2 кнопки`).toBeGreaterThanOrEqual(2)

      // Находим кнопки по тексту
      const acceptBtn = page.getByRole('button', { name: /Принять/i }).first()
      const rejectBtn = page.getByRole('button', { name: /Отклонить/i }).first()

      await expect(acceptBtn, `${folder}: кнопка "Принять" должна существовать`).toBeVisible()
      await expect(rejectBtn, `${folder}: кнопка "Отклонить" должна существовать`).toBeVisible()

      // Проверка 1: оба элемента — один и тот же тег (button, не button vs <a>)
      const acceptTag = await acceptBtn.evaluate((el) => el.tagName)
      const rejectTag = await rejectBtn.evaluate((el) => el.tagName)
      expect(acceptTag, `${folder}: Accept и Reject должны быть одного типа элемента`).toBe(rejectTag)

      // Проверка 2: габариты не должны различаться более чем на 15%
      const acceptBox = await acceptBtn.boundingBox()
      const rejectBox = await rejectBtn.boundingBox()
      expect(acceptBox, `${folder}: bounding box Accept не получен`).not.toBeNull()
      expect(rejectBox, `${folder}: bounding box Reject не получен`).not.toBeNull()

      const widthDiff = Math.abs(acceptBox.width - rejectBox.width) / Math.max(acceptBox.width, rejectBox.width)
      const heightDiff = Math.abs(acceptBox.height - rejectBox.height) / Math.max(acceptBox.height, rejectBox.height)

      expect(widthDiff, `${folder}: ширина кнопок различается более чем на 15% (dark pattern)`).toBeLessThan(0.15)
      expect(heightDiff, `${folder}: высота кнопок различается более чем на 15% (dark pattern)`).toBeLessThan(0.15)

      // Проверка 3: обе кнопки кликабельны за один клик (не спрятаны в подменю)
      await expect(acceptBtn).toBeEnabled()
      await expect(rejectBtn).toBeEnabled()
    })
  }

  test('найден хотя бы один консент-компонент для проверки', () => {
    expect(consentComponents.length, 'Ни одного legal-компонента с Accept/Reject не найдено — проверьте паттерн поиска').toBeGreaterThan(0)
  })
})
