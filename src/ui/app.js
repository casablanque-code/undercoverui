import { createGrid } from './grid.js'
import { createModal } from './modal.js'
import { toggleLike } from '../lib/likes.js'

export function initApp(components) {
  const modal = createModal()

  createGrid(components, {
    onCardClick: (id) => {
      const comp = components.find((c) => c.id === id)
      if (comp) modal.open(comp)
    },
    onLikeChange: (id) => toggleLike(id),
  })
}
