import { escHtml } from '../lib/escape.js'
import { copyToClipboard, showToast } from '../lib/clipboard.js'

const COPY_ICON = `<svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Скопировать код`
const COPIED_ICON = `<svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg> Скопировано`

export function createModal() {
  let currentComp = null

  const overlay = document.getElementById('modalOverlay')
  const iframe = document.getElementById('modalIframe')
  const titleEl = document.getElementById('modalTitle')
  const subEl = document.getElementById('modalSub')
  const codeEl = document.getElementById('codeBlock')
  const badgesEl = document.getElementById('modalBadges')
  const copyBtn = document.getElementById('modalCopyBtn')
  const closeBtn = document.getElementById('modalCloseBtn')
  const tabPreview = document.getElementById('tab-preview')
  const tabCode = document.getElementById('tab-code')
  const previewArea = document.getElementById('modalPreviewArea')
  const codeArea = document.getElementById('modalCodeArea')

  function switchTab(tab) {
    tabPreview.classList.toggle('active', tab === 'preview')
    tabCode.classList.toggle('active', tab === 'code')
    previewArea.style.display = tab === 'preview' ? 'flex' : 'none'
    codeArea.style.display = tab === 'code' ? 'block' : 'none'
  }

  function open(component) {
    currentComp = component

    titleEl.textContent = component.title
    subEl.textContent = component.desc
    iframe.srcdoc = component.preview
    codeEl.textContent = component.code

    badgesEl.innerHTML = (component.compliance || [])
      .map((b) => `<div class="compliance-item"><div class="dot-ok"></div>${escHtml(b)}</div>`)
      .join('')

    switchTab('preview')
    copyBtn.innerHTML = COPY_ICON
    copyBtn.classList.remove('copied')

    overlay.classList.add('open')
    document.body.style.overflow = 'hidden'
  }

  function close() {
    overlay.classList.remove('open')
    document.body.style.overflow = ''
    iframe.srcdoc = '' // stop animations/scripts running inside
    currentComp = null
  }

  function handleCopy() {
    if (!currentComp) return
    copyToClipboard(currentComp.code, {
      onSuccess: () => {
        copyBtn.innerHTML = COPIED_ICON
        copyBtn.classList.add('copied')
        showToast('Код скопирован в буфер')
        setTimeout(() => {
          copyBtn.innerHTML = COPY_ICON
          copyBtn.classList.remove('copied')
        }, 2500)
      },
    })
  }

  closeBtn.addEventListener('click', close)
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close() })
  tabPreview.addEventListener('click', () => switchTab('preview'))
  tabCode.addEventListener('click', () => switchTab('code'))
  copyBtn.addEventListener('click', handleCopy)
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close() })

  return { open, close }
}
