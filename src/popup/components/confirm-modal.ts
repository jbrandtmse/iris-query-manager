/**
 * Confirmation Modal Component
 * Displays a modal dialog for destructive action confirmations
 */

import './confirm-modal.css'

/**
 * Show a confirmation modal and return user's choice
 *
 * @param title - Modal title
 * @param message - Warning message to display
 * @param confirmText - Text for confirm button (default: "Confirm")
 * @param confirmDanger - If true, style confirm button as destructive (default: false)
 * @returns Promise<boolean> - true if confirmed, false if cancelled
 */
export function showConfirmModal(
  title: string,
  message: string,
  confirmText = 'Confirm',
  confirmDanger = false
): Promise<boolean> {
  return new Promise((resolve) => {
    // Create modal elements
    const overlay = document.createElement('div')
    overlay.className = 'confirm-modal-overlay'

    const modal = document.createElement('div')
    modal.className = 'confirm-modal'
    modal.setAttribute('role', 'dialog')
    modal.setAttribute('aria-modal', 'true')
    modal.setAttribute('aria-labelledby', 'confirm-modal-title')

    const titleEl = document.createElement('h2')
    titleEl.id = 'confirm-modal-title'
    titleEl.className = 'confirm-modal__title'
    titleEl.textContent = title

    const messageEl = document.createElement('p')
    messageEl.className = 'confirm-modal__message'
    messageEl.textContent = message

    const actions = document.createElement('div')
    actions.className = 'confirm-modal__actions'

    const cancelBtn = document.createElement('button')
    cancelBtn.type = 'button'
    cancelBtn.className = 'confirm-modal__btn confirm-modal__btn--cancel js-modal-cancel'
    cancelBtn.textContent = 'Cancel'

    const confirmBtn = document.createElement('button')
    confirmBtn.type = 'button'
    confirmBtn.className = `confirm-modal__btn ${confirmDanger ? 'confirm-modal__btn--danger' : 'confirm-modal__btn--confirm'} js-modal-confirm`
    confirmBtn.textContent = confirmText

    actions.appendChild(cancelBtn)
    actions.appendChild(confirmBtn)

    modal.appendChild(titleEl)
    modal.appendChild(messageEl)
    modal.appendChild(actions)
    overlay.appendChild(modal)
    document.body.appendChild(overlay)

    // Focus the cancel button (safer default for destructive actions)
    cancelBtn.focus()

    let resolved = false

    function cleanup(result: boolean): void {
      if (resolved) return
      resolved = true
      document.removeEventListener('keydown', handleKeydown)
      overlay.remove()
      resolve(result)
    }

    // Event handlers
    cancelBtn.addEventListener('click', () => cleanup(false))
    confirmBtn.addEventListener('click', () => cleanup(true))

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) cleanup(false)
    })

    function handleKeydown(e: KeyboardEvent): void {
      if (e.key === 'Escape') {
        cleanup(false)
      }
    }
    document.addEventListener('keydown', handleKeydown)

    // Focus trap
    modal.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        if (e.shiftKey && document.activeElement === cancelBtn) {
          e.preventDefault()
          confirmBtn.focus()
        } else if (!e.shiftKey && document.activeElement === confirmBtn) {
          e.preventDefault()
          cancelBtn.focus()
        }
      }
    })
  })
}
