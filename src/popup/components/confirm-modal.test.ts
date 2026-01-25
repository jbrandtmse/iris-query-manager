import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { showConfirmModal } from './confirm-modal'

describe('confirm-modal', () => {
  beforeEach(() => {
    // Clean up any existing modals
    document.body.innerHTML = ''
  })

  afterEach(() => {
    // Clean up after each test
    document.body.innerHTML = ''
  })

  describe('showConfirmModal', () => {
    it('should return true when Replace clicked', async () => {
      const modalPromise = showConfirmModal(
        'Replace Library?',
        'This will permanently delete all your current queries and folders.',
        'Replace',
        true
      )

      // Find and click the confirm button
      const confirmBtn = document.querySelector('.js-modal-confirm') as HTMLButtonElement
      expect(confirmBtn).not.toBeNull()
      confirmBtn.click()

      const result = await modalPromise
      expect(result).toBe(true)
    })

    it('should return false when Cancel clicked', async () => {
      const modalPromise = showConfirmModal(
        'Replace Library?',
        'This will permanently delete all your current queries and folders.',
        'Replace',
        true
      )

      // Find and click the cancel button
      const cancelBtn = document.querySelector('.js-modal-cancel') as HTMLButtonElement
      expect(cancelBtn).not.toBeNull()
      cancelBtn.click()

      const result = await modalPromise
      expect(result).toBe(false)
    })

    it('should return false when Escape pressed', async () => {
      const modalPromise = showConfirmModal(
        'Replace Library?',
        'This will permanently delete all your current queries and folders.',
        'Replace',
        true
      )

      // Simulate Escape key press
      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' })
      document.dispatchEvent(escapeEvent)

      const result = await modalPromise
      expect(result).toBe(false)
    })

    it('should return false when overlay clicked', async () => {
      const modalPromise = showConfirmModal(
        'Replace Library?',
        'This will delete everything.',
        'Replace',
        true
      )

      // Find and click the overlay (not the modal itself)
      const overlay = document.querySelector('.confirm-modal-overlay') as HTMLDivElement
      expect(overlay).not.toBeNull()
      overlay.click()

      const result = await modalPromise
      expect(result).toBe(false)
    })

    it('should display correct title and message', () => {
      showConfirmModal('Test Title', 'Test Message', 'OK', false)

      const title = document.querySelector('.confirm-modal__title')
      const message = document.querySelector('.confirm-modal__message')

      expect(title?.textContent).toBe('Test Title')
      expect(message?.textContent).toBe('Test Message')
    })

    it('should display custom confirm button text', () => {
      showConfirmModal('Title', 'Message', 'Delete Everything', true)

      const confirmBtn = document.querySelector('.js-modal-confirm')
      expect(confirmBtn?.textContent).toBe('Delete Everything')
    })

    it('should apply danger style when confirmDanger is true', () => {
      showConfirmModal('Title', 'Message', 'Delete', true)

      const confirmBtn = document.querySelector('.js-modal-confirm')
      expect(confirmBtn?.classList.contains('confirm-modal__btn--danger')).toBe(true)
      expect(confirmBtn?.classList.contains('confirm-modal__btn--confirm')).toBe(false)
    })

    it('should apply confirm style when confirmDanger is false', () => {
      showConfirmModal('Title', 'Message', 'Confirm', false)

      const confirmBtn = document.querySelector('.js-modal-confirm')
      expect(confirmBtn?.classList.contains('confirm-modal__btn--confirm')).toBe(true)
      expect(confirmBtn?.classList.contains('confirm-modal__btn--danger')).toBe(false)
    })

    it('should remove modal from DOM after resolution', async () => {
      const modalPromise = showConfirmModal('Title', 'Message', 'OK', false)

      expect(document.querySelector('.confirm-modal-overlay')).not.toBeNull()

      const confirmBtn = document.querySelector('.js-modal-confirm') as HTMLButtonElement
      confirmBtn.click()

      await modalPromise

      expect(document.querySelector('.confirm-modal-overlay')).toBeNull()
    })

    it('should set aria attributes for accessibility', () => {
      showConfirmModal('Title', 'Message', 'OK', false)

      const modal = document.querySelector('.confirm-modal')
      expect(modal?.getAttribute('role')).toBe('dialog')
      expect(modal?.getAttribute('aria-modal')).toBe('true')
      expect(modal?.getAttribute('aria-labelledby')).toBe('confirm-modal-title')
    })

    it('should focus cancel button by default', () => {
      showConfirmModal('Title', 'Message', 'OK', false)

      const cancelBtn = document.querySelector('.js-modal-cancel')
      expect(document.activeElement).toBe(cancelBtn)
    })
  })
})
