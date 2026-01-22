import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { showToast, hideToast } from './toast'

// Mock matchMedia for tests
const mockMatchMedia = (matches: boolean = false) => {
  return vi.fn().mockImplementation((query: string) => ({
    matches: query === '(prefers-reduced-motion: reduce)' ? matches : false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
}

describe('toast', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    vi.useFakeTimers()
    // Default: no reduced motion preference
    window.matchMedia = mockMatchMedia(false)
  })

  afterEach(() => {
    hideToast()
    vi.useRealTimers()
  })

  describe('showToast', () => {
    it('should create toast with success variant class', () => {
      showToast('Test message', 'success')
      const toast = document.querySelector('.toast')

      expect(toast).not.toBeNull()
      expect(toast?.classList.contains('toast--success')).toBe(true)
    })

    it('should create toast with error variant class', () => {
      showToast('Error message', 'error')
      const toast = document.querySelector('.toast')

      expect(toast?.classList.contains('toast--error')).toBe(true)
    })

    it('should create toast with info variant class', () => {
      showToast('Info message', 'info')
      const toast = document.querySelector('.toast')

      expect(toast?.classList.contains('toast--info')).toBe(true)
    })

    it('should create toast with warning variant class', () => {
      showToast('Warning message', 'warning')
      const toast = document.querySelector('.toast')

      expect(toast?.classList.contains('toast--warning')).toBe(true)
    })

    it('should display message text', () => {
      showToast('Query saved', 'success')
      const message = document.querySelector('.toast__message')

      expect(message?.textContent).toBe('Query saved')
    })

    it('should have icon element', () => {
      showToast('Success', 'success')
      const icon = document.querySelector('.toast__icon')

      expect(icon).not.toBeNull()
      expect(icon?.innerHTML).toContain('svg')
    })

    it('should default to success type when not specified', () => {
      showToast('Default type')
      const toast = document.querySelector('.toast')

      expect(toast?.classList.contains('toast--success')).toBe(true)
    })

    it('should add visible class after creation', () => {
      showToast('Test', 'success')
      const toast = document.querySelector('.toast')

      expect(toast?.classList.contains('toast--visible')).toBe(true)
    })

    it('should create toast container if not exists', () => {
      showToast('Test', 'success')
      const container = document.querySelector('.toast-container')

      expect(container).not.toBeNull()
      expect(document.body.contains(container)).toBe(true)
    })
  })

  describe('accessibility', () => {
    it('should have role="status" for success toast', () => {
      showToast('Success', 'success')
      const toast = document.querySelector('.toast')

      expect(toast?.getAttribute('role')).toBe('status')
    })

    it('should have role="alert" for error toast', () => {
      showToast('Error', 'error')
      const toast = document.querySelector('.toast')

      expect(toast?.getAttribute('role')).toBe('alert')
    })

    it('should have role="status" for info toast', () => {
      showToast('Info', 'info')
      const toast = document.querySelector('.toast')

      expect(toast?.getAttribute('role')).toBe('status')
    })

    it('should have aria-live="polite" for success toast', () => {
      showToast('Success', 'success')
      const toast = document.querySelector('.toast')

      expect(toast?.getAttribute('aria-live')).toBe('polite')
    })

    it('should have aria-live="assertive" for error toast', () => {
      showToast('Error', 'error')
      const toast = document.querySelector('.toast')

      expect(toast?.getAttribute('aria-live')).toBe('assertive')
    })

    it('should have aria-live="polite" for info toast', () => {
      showToast('Info', 'info')
      const toast = document.querySelector('.toast')

      expect(toast?.getAttribute('aria-live')).toBe('polite')
    })

    it('should have role="alert" for warning toast', () => {
      showToast('Warning', 'warning')
      const toast = document.querySelector('.toast')

      expect(toast?.getAttribute('role')).toBe('alert')
    })

    it('should have aria-live="assertive" for warning toast', () => {
      showToast('Warning', 'warning')
      const toast = document.querySelector('.toast')

      expect(toast?.getAttribute('aria-live')).toBe('assertive')
    })
  })

  describe('auto-dismiss', () => {
    it('should auto-dismiss success toast after 1500ms', () => {
      showToast('Success', 'success')
      expect(document.querySelector('.toast')).not.toBeNull()

      // Advance past auto-dismiss delay
      vi.advanceTimersByTime(1500)
      // Advance past animation duration
      vi.advanceTimersByTime(300)

      expect(document.querySelector('.toast')).toBeNull()
    })

    it('should auto-dismiss info toast after 2000ms', () => {
      showToast('Info', 'info')
      expect(document.querySelector('.toast')).not.toBeNull()

      // After 1500ms, toast should still exist
      vi.advanceTimersByTime(1500)
      expect(document.querySelector('.toast')).not.toBeNull()

      // After 2000ms total + animation
      vi.advanceTimersByTime(500)
      vi.advanceTimersByTime(300)

      expect(document.querySelector('.toast')).toBeNull()
    })

    it('should NOT auto-dismiss error toast', () => {
      showToast('Error', 'error')
      expect(document.querySelector('.toast')).not.toBeNull()

      // Advance a long time
      vi.advanceTimersByTime(5000)

      // Error toast should still exist
      expect(document.querySelector('.toast')).not.toBeNull()
    })

    it('should NOT auto-dismiss warning toast', () => {
      showToast('Warning', 'warning')
      expect(document.querySelector('.toast')).not.toBeNull()

      // Advance a long time
      vi.advanceTimersByTime(5000)

      // Warning toast should still exist
      expect(document.querySelector('.toast')).not.toBeNull()
    })

    it('should add hiding class during fade-out animation', () => {
      showToast('Success', 'success')

      // Advance past auto-dismiss delay
      vi.advanceTimersByTime(1500)

      const toast = document.querySelector('.toast')
      expect(toast?.classList.contains('toast--hiding')).toBe(true)
    })

    it('should remove visible class during fade-out', () => {
      showToast('Success', 'success')

      // Advance past auto-dismiss delay
      vi.advanceTimersByTime(1500)

      const toast = document.querySelector('.toast')
      expect(toast?.classList.contains('toast--visible')).toBe(false)
    })
  })

  describe('error toast dismiss button', () => {
    it('should have dismiss button for error variant', () => {
      showToast('Error', 'error')
      const dismissBtn = document.querySelector('.toast__dismiss')

      expect(dismissBtn).not.toBeNull()
    })

    it('should NOT have dismiss button for success variant', () => {
      showToast('Success', 'success')
      const dismissBtn = document.querySelector('.toast__dismiss')

      expect(dismissBtn).toBeNull()
    })

    it('should NOT have dismiss button for info variant', () => {
      showToast('Info', 'info')
      const dismissBtn = document.querySelector('.toast__dismiss')

      expect(dismissBtn).toBeNull()
    })

    it('should have dismiss button for warning variant', () => {
      showToast('Warning', 'warning')
      const dismissBtn = document.querySelector('.toast__dismiss')

      expect(dismissBtn).not.toBeNull()
    })

    it('should remove warning toast when dismiss button clicked', () => {
      showToast('Warning', 'warning')
      const dismissBtn = document.querySelector('.toast__dismiss') as HTMLButtonElement

      dismissBtn.click()

      expect(document.querySelector('.toast')).toBeNull()
    })

    it('should remove toast when dismiss button clicked', () => {
      showToast('Error', 'error')
      const dismissBtn = document.querySelector('.toast__dismiss') as HTMLButtonElement

      dismissBtn.click()

      expect(document.querySelector('.toast')).toBeNull()
    })

    it('should have aria-label on dismiss button', () => {
      showToast('Error', 'error')
      const dismissBtn = document.querySelector('.toast__dismiss')

      expect(dismissBtn?.getAttribute('aria-label')).toBe('Dismiss')
    })

    it('should have type="button" on dismiss button', () => {
      showToast('Error', 'error')
      const dismissBtn = document.querySelector('.toast__dismiss') as HTMLButtonElement

      expect(dismissBtn.type).toBe('button')
    })
  })

  describe('multiple toasts', () => {
    it('should replace existing toast when new one is shown', () => {
      showToast('First', 'success')
      showToast('Second', 'info')

      const toasts = document.querySelectorAll('.toast')
      expect(toasts.length).toBe(1)
      expect(document.querySelector('.toast__message')?.textContent).toBe('Second')
    })

    it('should clear auto-dismiss timeout when replaced', () => {
      showToast('First', 'success')

      // Advance part of the way
      vi.advanceTimersByTime(1000)

      // Show new toast
      showToast('Second', 'success')

      // Advance past original timeout
      vi.advanceTimersByTime(600)

      // Second toast should still exist (it has its own 1500ms timeout)
      expect(document.querySelector('.toast')).not.toBeNull()
      expect(document.querySelector('.toast__message')?.textContent).toBe('Second')
    })
  })

  describe('hideToast', () => {
    it('should remove toast immediately', () => {
      showToast('Test', 'success')
      expect(document.querySelector('.toast')).not.toBeNull()

      hideToast()

      expect(document.querySelector('.toast')).toBeNull()
    })

    it('should clear pending auto-dismiss timeout', () => {
      showToast('Test', 'success')
      hideToast()

      // Should not error when timeout tries to fire
      vi.advanceTimersByTime(2000)

      // No error means success
      expect(document.querySelector('.toast')).toBeNull()
    })

    it('should handle being called when no toast exists', () => {
      // Should not throw
      expect(() => hideToast()).not.toThrow()
    })
  })

  describe('reduced motion', () => {
    it('should respect prefers-reduced-motion', () => {
      // Set up reduced motion preference
      window.matchMedia = mockMatchMedia(true)

      showToast('Test', 'success')

      // Advance past auto-dismiss delay
      vi.advanceTimersByTime(1500)

      // With reduced motion, toast should be removed immediately (no animation delay)
      expect(document.querySelector('.toast')).toBeNull()
    })
  })
})
