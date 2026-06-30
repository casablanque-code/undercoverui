import { escHtml, escAttr } from '../lib/escape.js'
import { isLiked } from '../lib/likes.js'
import { copyToClipboard, showToast } from '../lib/clipboard.js'

const CAT_LABEL = { legal: 'Legal', error: 'Error', empty: 'Empty', anim: 'Anim' }
const CAT_TAG   = { legal: 'tag-legal', error: 'tag-error', empty: 'tag-empty', anim: 'tag-anim' }
const TAG_CLASS = { GDPR: 'tag-gdpr', CCPA: 'tag-ccpa', A11Y: 'tag-a11y' }

export function createGrid(components, { onCardClick, onLikeChange }) {
  let activeFilter = 'all'
  let searchQuery = ''

  const gridEl = document.getElementById('grid')
  const gridLabel = document.getElementById('gridLabel')
  const filtersEl = document.getElementById('filters')
  const searchInput = document.getElementById('searchInput')

  function updateCounts() {
    const cats = ['all', 'legal', 'error', 'empty', 'anim']
    cats.forEach((cat) => {
      const n = cat === 'all' ? components.length : components.filter((c) => c.cat === cat).length
      const el = document.getElementById('fc-' + cat)
      if (el) el.textContent = n
    })
    const statEl = document.getElementById('stat-count')
    if (statEl) statEl.textContent = components.length
  }

  function getFiltered() {
    const q = searchQuery.trim().toLowerCase()
    return components.filter((c) => {
      const catOk = activeFilter === 'all' || c.cat === activeFilter
      const searchOk = !q || c.title.toLowerCase().includes(q) || c.desc.toLowerCase().includes(q)
      return catOk && searchOk
    })
  }

  function cardTemplate(c) {
    const liked = isLiked(c.id)
    const hearts = c.hearts + (liked ? 1 : 0)
    return `
    <div class="card" data-id="${c.id}">
      <div class="card-preview">
        <div class="browser-bar">
          <div class="dot r"></div><div class="dot y"></div><div class="dot g"></div>
        </div>
        <iframe
          srcdoc="${escAttr(c.preview)}"
          sandbox="allow-scripts allow-same-origin"
          loading="lazy"
          title="${escAttr(c.title)} превью"
          tabindex="-1">
        </iframe>
      </div>
      <div class="card-body">
        <div class="card-tags">
          <span class="tag ${CAT_TAG[c.cat]}">${CAT_LABEL[c.cat]}</span>
          ${c.tags.map((t) => `<span class="tag ${TAG_CLASS[t] || ''}">${t}</span>`).join('')}
        </div>
        <div class="card-title">${escHtml(c.title)}</div>
        <div class="card-desc">${escHtml(c.desc)}</div>
      </div>
      <div class="card-footer">
        <div class="card-meta">
          <span class="like-btn ${liked ? 'liked' : ''}" data-id="${c.id}" data-action="like" title="Лайк">
            <svg width="12" height="12" fill="${liked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            <span data-hearts="${c.id}">${hearts}</span>
          </span>
          <span title="Копирований">
            <svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            ${c.copies.toLocaleString('ru')}
          </span>
        </div>
        <button class="copy-btn" data-id="${c.id}" data-action="copy" title="Скопировать код">
          <svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          Код
        </button>
      </div>
    </div>`
  }

  function render() {
    const filtered = getFiltered()
    gridLabel.textContent = filtered.length + ' компонент' + (filtered.length === 1 ? '' : 'ов')

    if (!filtered.length) {
      gridEl.innerHTML = `<div class="empty-grid">Ничего не найдено по запросу «${escHtml(searchQuery)}»</div>`
      return
    }

    gridEl.innerHTML = filtered.map(cardTemplate).join('')
  }

  // Event delegation — one listener for all cards
  gridEl.addEventListener('click', (e) => {
    const actionEl = e.target.closest('[data-action]')
    const card = e.target.closest('.card')
    if (!card) return
    const id = card.dataset.id

    if (actionEl?.dataset.action === 'like') {
      e.stopPropagation()
      const nowLiked = onLikeChange(id)
      const comp = components.find((c) => c.id === id)
      actionEl.classList.toggle('liked', nowLiked)
      actionEl.querySelector('svg').setAttribute('fill', nowLiked ? 'currentColor' : 'none')
      const heartsEl = actionEl.querySelector('[data-hearts]')
      heartsEl.textContent = comp.hearts + (nowLiked ? 1 : 0)
      return
    }

    if (actionEl?.dataset.action === 'copy') {
      e.stopPropagation()
      const comp = components.find((c) => c.id === id)
      copyToClipboard(comp.code, {
        onSuccess: () => {
          actionEl.classList.add('copied')
          actionEl.innerHTML = `<svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg> OK`
          showToast('Код скопирован')
          setTimeout(() => {
            actionEl.classList.remove('copied')
            actionEl.innerHTML = `<svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Код`
          }, 2000)
        },
      })
      return
    }

    onCardClick(id)
  })

  filtersEl.addEventListener('click', (e) => {
    const btn = e.target.closest('.filter-btn')
    if (!btn) return
    activeFilter = btn.dataset.cat
    filtersEl.querySelectorAll('.filter-btn').forEach((b) => b.classList.remove('active'))
    btn.classList.add('active')
    render()
  })

  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value
    render()
  })

  updateCounts()
  render()

  return { render }
}
