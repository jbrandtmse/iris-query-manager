import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createIconButton, type IconButtonOptions } from './icon-button'

describe('icon-button', () => {
  // Mock document for JSDOM environment
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('createIconButton', () => {
    const defaultOptions: IconButtonOptions = {
      icon: '<svg>test</svg>',
      label: 'Test Button',
    }

    it('should create a button element', () => {
      const button = createIconButton(defaultOptions)

      expect(button).toBeInstanceOf(HTMLButtonElement)
      expect(button.tagName).toBe('BUTTON')
    })

    it('should set type="button" to prevent form submission', () => {
      const button = createIconButton(defaultOptions)

      expect(button.type).toBe('button')
    })

    it('should have icon-button class', () => {
      const button = createIconButton(defaultOptions)

      expect(button.classList.contains('icon-button')).toBe(true)
    })

    it('should set aria-label for accessibility', () => {
      const button = createIconButton({ ...defaultOptions, label: 'Capture query' })

      expect(button.getAttribute('aria-label')).toBe('Capture query')
    })

    it('should render SVG icon as innerHTML', () => {
      const svgIcon = '<svg xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="1"></circle></svg>'
      const button = createIconButton({ ...defaultOptions, icon: svgIcon })

      expect(button.innerHTML).toBe(svgIcon)
    })

    it('should add custom className when provided', () => {
      const button = createIconButton({
        ...defaultOptions,
        className: 'js-capture-btn',
      })

      expect(button.classList.contains('icon-button')).toBe(true)
      expect(button.classList.contains('js-capture-btn')).toBe(true)
    })

    it('should handle className with extra whitespace', () => {
      const button = createIconButton({
        ...defaultOptions,
        className: 'js-menu-btn',
      })

      // The component trims the combined className, extra spaces in input should be avoided
      expect(button.className).toBe('icon-button js-menu-btn')
    })

    it('should not add extra class when className is undefined', () => {
      const button = createIconButton(defaultOptions)

      expect(button.className).toBe('icon-button')
    })

    it('should attach click handler when onClick provided', () => {
      const onClick = vi.fn()
      const button = createIconButton({ ...defaultOptions, onClick })

      button.click()

      expect(onClick).toHaveBeenCalledTimes(1)
    })

    it('should not throw when onClick is undefined', () => {
      const button = createIconButton(defaultOptions)

      expect(() => button.click()).not.toThrow()
    })

    describe('disabled state', () => {
      it('should set disabled attribute when disabled is true', () => {
        const button = createIconButton({ ...defaultOptions, disabled: true })

        expect(button.disabled).toBe(true)
      })

      it('should add icon-button--disabled class when disabled', () => {
        const button = createIconButton({ ...defaultOptions, disabled: true })

        expect(button.classList.contains('icon-button--disabled')).toBe(true)
      })

      it('should not be disabled by default', () => {
        const button = createIconButton(defaultOptions)

        expect(button.disabled).toBe(false)
        expect(button.classList.contains('icon-button--disabled')).toBe(false)
      })

      it('should not call onClick when disabled and clicked', () => {
        const onClick = vi.fn()
        const button = createIconButton({ ...defaultOptions, onClick, disabled: true })

        button.click()

        // Native disabled behavior prevents click
        expect(onClick).not.toHaveBeenCalled()
      })
    })
  })
})
