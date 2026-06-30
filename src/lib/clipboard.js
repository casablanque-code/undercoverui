let toastTimer

export function showToast(msg) {
  const toast = document.getElementById('toast')
  const msgEl = document.getElementById('toastMsg')
  if (!toast || !msgEl) return
  msgEl.textContent = msg
  toast.classList.add('show')
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2300)
}

export function copyToClipboard(text, { onSuccess, onError } = {}) {
  navigator.clipboard.writeText(text).then(
    () => onSuccess?.(),
    (err) => onError?.(err),
  )
}
