#!/usr/bin/env node
/**
 * validate-components.mjs
 *
 * Standalone-валидатор для CI. Проверяет каждую папку в components/:
 *   - meta.json существует и валиден по схеме
 *   - template.html существует и содержит блок [PREVIEW]
 *   - id в meta.json совпадает с именем папки... (рекомендация, не строго)
 *   - tags и category — из разрешённого списка
 *   - version — semver
 *
 * Запуск: node scripts/validate-components.mjs
 * Exit code 1 при любой ошибке — ломает CI.
 */

import { readFileSync, readdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const COMPONENTS_DIR = join(__dirname, '..', 'components')

const REQUIRED_FIELDS  = ['id', 'title', 'category', 'description']
const VALID_CATEGORIES = ['legal', 'error', 'empty', 'anim']
const VALID_TAGS       = ['GDPR', 'CCPA', 'A11Y']
const SEMVER_RE        = /^\d+\.\d+\.\d+$/

let errorCount = 0
let warnCount = 0

function fail(folder, msg) {
  console.error(`\x1b[31m✗\x1b[0m ${folder}: ${msg}`)
  errorCount++
}

function warn(folder, msg) {
  console.warn(`\x1b[33m!\x1b[0m ${folder}: ${msg}`)
  warnCount++
}

function ok(folder, msg) {
  console.log(`\x1b[32m✓\x1b[0m ${folder}: ${msg}`)
}

if (!existsSync(COMPONENTS_DIR)) {
  console.error('Папка components/ не найдена')
  process.exit(1)
}

const folders = readdirSync(COMPONENTS_DIR, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .sort()

console.log(`Найдено папок: ${folders.length}\n`)

for (const folder of folders) {
  const dir = join(COMPONENTS_DIR, folder)
  const metaPath = join(dir, 'meta.json')
  const templatePath = join(dir, 'template.html')

  if (!existsSync(metaPath)) {
    fail(folder, 'отсутствует meta.json')
    continue
  }
  if (!existsSync(templatePath)) {
    fail(folder, 'отсутствует template.html')
    continue
  }

  let meta
  try {
    meta = JSON.parse(readFileSync(metaPath, 'utf-8'))
  } catch (e) {
    fail(folder, `невалидный JSON в meta.json — ${e.message}`)
    continue
  }

  let hasError = false

  for (const field of REQUIRED_FIELDS) {
    if (!meta[field]) {
      fail(folder, `отсутствует обязательное поле "${field}"`)
      hasError = true
    }
  }

  if (meta.category && !VALID_CATEGORIES.includes(meta.category)) {
    fail(folder, `category "${meta.category}" не из списка [${VALID_CATEGORIES.join(', ')}]`)
    hasError = true
  }

  if (meta.tags) {
    for (const tag of meta.tags) {
      if (!VALID_TAGS.includes(tag)) {
        fail(folder, `тег "${tag}" не из списка [${VALID_TAGS.join(', ')}]`)
        hasError = true
      }
    }
  }

  if (meta.version && !SEMVER_RE.test(meta.version)) {
    fail(folder, `version "${meta.version}" не соответствует semver (X.Y.Z)`)
    hasError = true
  }

  if (meta.id && meta.id !== folder) {
    warn(folder, `meta.json id="${meta.id}" не совпадает с именем папки (рекомендуется совпадение)`)
  }

  if (!meta.author) {
    warn(folder, 'не указан author — укажите свой GitHub username')
  }

  // Legal-компоненты обязаны иметь compliance[] и хотя бы один GDPR/CCPA тег
  if (meta.category === 'legal') {
    if (!meta.compliance || meta.compliance.length === 0) {
      fail(folder, 'category=legal требует непустой массив compliance[]')
      hasError = true
    }
    const hasLegalTag = (meta.tags || []).some((t) => t === 'GDPR' || t === 'CCPA')
    if (!hasLegalTag) {
      fail(folder, 'category=legal требует тег GDPR и/или CCPA')
      hasError = true
    }
  }

  const template = readFileSync(templatePath, 'utf-8')
  if (!/\[PREVIEW\][\s\S]*?\[\/PREVIEW\]/.test(template)) {
    fail(folder, 'template.html не содержит блок [PREVIEW]...[/PREVIEW]')
    hasError = true
  }
  if (!/<!DOCTYPE html>/i.test(template)) {
    warn(folder, 'PREVIEW блок не начинается с <!DOCTYPE html> — превью может отрендериться некорректно в iframe')
  }

  if (!hasError) ok(folder, 'структура корректна')
}

console.log(`\n${folders.length} папок проверено, ${errorCount} ошибок, ${warnCount} предупреждений`)

if (errorCount > 0) {
  console.error('\nВалидация не пройдена.')
  process.exit(1)
}

console.log('\nВалидация пройдена.')
process.exit(0)
