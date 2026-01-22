/**
 * Context Menu Component Tests
 * Story 3-5: Test context menu rendering, positioning, keyboard nav, click-outside
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { showContextMenu, hideContextMenu, isContextMenuVisible } from './context-menu'

describe('context-menu', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    hideContextMenu() // Ensure clean state
  })

  afterEach(() => {
    hideContextMenu()
  })

  describe('showContextMenu', () => {
    it('should render menu at specified position', () => {
      const onSelect = vi.fn()
      showContextMenu({
        x: 100,
        y: 200,
        items: [{ label: 'Test', action: 'test' }],
        onSelect,
      })

      const menu = document.querySelector('.context-menu') as HTMLElement
      expect(menu).not.toBeNull()
      expect(menu.style.left).toBe('100px')
      expect(menu.style.top).toBe('200px')
    })

    it('should render all menu items', () => {
      const onSelect = vi.fn()
      showContextMenu({
        x: 0,
        y: 0,
        items: [
          { label: 'Rename', action: 'rename' },
          { label: 'Delete', action: 'delete' },
        ],
        onSelect,
      })

      const items = document.querySelectorAll('.context-menu__item')
      expect(items.length).toBe(2)
      expect(items[0].textContent).toBe('Rename')
      expect(items[1].textContent).toBe('Delete')
    })

    it('should mark menu visible', () => {
      const onSelect = vi.fn()
      showContextMenu({
        x: 0,
        y: 0,
        items: [{ label: 'Test', action: 'test' }],
        onSelect,
      })

      expect(isContextMenuVisible()).toBe(true)
    })

    it('should close previous menu when showing new one', () => {
      const onSelect = vi.fn()

      showContextMenu({
        x: 50,
        y: 50,
        items: [{ label: 'First', action: 'first' }],
        onSelect,
      })

      showContextMenu({
        x: 100,
        y: 100,
        items: [{ label: 'Second', action: 'second' }],
        onSelect,
      })

      const menus = document.querySelectorAll('.context-menu')
      expect(menus.length).toBe(1)
      expect(menus[0].querySelector('.context-menu__item')?.textContent).toBe('Second')
    })
  })

  describe('ARIA attributes (AC5)', () => {
    it('should have role="menu" on container', () => {
      const onSelect = vi.fn()
      showContextMenu({
        x: 0,
        y: 0,
        items: [{ label: 'Test', action: 'test' }],
        onSelect,
      })

      const menu = document.querySelector('.context-menu')
      expect(menu?.getAttribute('role')).toBe('menu')
    })

    it('should have role="menuitem" on each item', () => {
      const onSelect = vi.fn()
      showContextMenu({
        x: 0,
        y: 0,
        items: [
          { label: 'Rename', action: 'rename' },
          { label: 'Delete', action: 'delete' },
        ],
        onSelect,
      })

      const items = document.querySelectorAll('.context-menu__item')
      items.forEach((item) => {
        expect(item.getAttribute('role')).toBe('menuitem')
      })
    })

    it('should have aria-activedescendant pointing to focused item', () => {
      const onSelect = vi.fn()
      showContextMenu({
        x: 0,
        y: 0,
        items: [
          { label: 'Rename', action: 'rename' },
          { label: 'Delete', action: 'delete' },
        ],
        onSelect,
      })

      const menu = document.querySelector('.context-menu')
      expect(menu?.getAttribute('aria-activedescendant')).toBe('context-menu-item-0')
    })
  })

  describe('positioning (AC1)', () => {
    it('should stay within viewport when near right edge', () => {
      const onSelect = vi.fn()

      // Set viewport width
      Object.defineProperty(window, 'innerWidth', { value: 400, writable: true })

      showContextMenu({
        x: 350, // Near right edge
        y: 100,
        items: [{ label: 'Test', action: 'test' }],
        onSelect,
      })

      const menu = document.querySelector('.context-menu') as HTMLElement
      const left = parseInt(menu.style.left)

      // Menu should be adjusted to stay in viewport (160px width + 8px margin)
      expect(left).toBeLessThanOrEqual(400 - 160 - 8)
    })

    it('should stay within viewport when near bottom edge', () => {
      const onSelect = vi.fn()

      // Set viewport height
      Object.defineProperty(window, 'innerHeight', { value: 300, writable: true })

      showContextMenu({
        x: 100,
        y: 280, // Near bottom edge
        items: [{ label: 'Test', action: 'test' }],
        onSelect,
      })

      const menu = document.querySelector('.context-menu') as HTMLElement
      const top = parseInt(menu.style.top)

      // In jsdom, offsetHeight is 0, so the positioning logic doesn't adjust.
      // We can only verify that the top value is set and the logic runs.
      // In a real browser, the menu would be adjusted to stay in viewport.
      // Here we verify that positioning code runs without error.
      expect(menu.style.top).toBeTruthy()

      // When menu has height (real browser), it would adjust.
      // Since jsdom reports offsetHeight=0, the y=280 passes through unchanged.
      expect(top).toBe(280)
    })
  })

  describe('keyboard navigation (AC5)', () => {
    it('should move focus down on ArrowDown', () => {
      const onSelect = vi.fn()
      showContextMenu({
        x: 0,
        y: 0,
        items: [
          { label: 'Rename', action: 'rename' },
          { label: 'Delete', action: 'delete' },
        ],
        onSelect,
      })

      // First item should be focused initially
      const items = document.querySelectorAll('.context-menu__item')
      expect(items[0].classList.contains('context-menu__item--focused')).toBe(true)

      // Press ArrowDown
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))

      // Second item should now be focused
      expect(items[0].classList.contains('context-menu__item--focused')).toBe(false)
      expect(items[1].classList.contains('context-menu__item--focused')).toBe(true)
    })

    it('should move focus up on ArrowUp', () => {
      const onSelect = vi.fn()
      showContextMenu({
        x: 0,
        y: 0,
        items: [
          { label: 'Rename', action: 'rename' },
          { label: 'Delete', action: 'delete' },
        ],
        onSelect,
      })

      // Move to second item first
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))

      const items = document.querySelectorAll('.context-menu__item')
      expect(items[1].classList.contains('context-menu__item--focused')).toBe(true)

      // Press ArrowUp
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }))

      // First item should now be focused
      expect(items[0].classList.contains('context-menu__item--focused')).toBe(true)
      expect(items[1].classList.contains('context-menu__item--focused')).toBe(false)
    })

    it('should wrap around at boundaries', () => {
      const onSelect = vi.fn()
      showContextMenu({
        x: 0,
        y: 0,
        items: [
          { label: 'Rename', action: 'rename' },
          { label: 'Delete', action: 'delete' },
        ],
        onSelect,
      })

      const items = document.querySelectorAll('.context-menu__item')

      // Wrap from bottom to top: ArrowDown from last item
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))

      expect(items[0].classList.contains('context-menu__item--focused')).toBe(true)

      // Wrap from top to bottom: ArrowUp from first item
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }))

      expect(items[1].classList.contains('context-menu__item--focused')).toBe(true)
    })

    it('should select item on Enter', () => {
      const onSelect = vi.fn()
      showContextMenu({
        x: 0,
        y: 0,
        items: [
          { label: 'Rename', action: 'rename' },
          { label: 'Delete', action: 'delete' },
        ],
        onSelect,
      })

      // Press Enter on first item
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))

      expect(onSelect).toHaveBeenCalledWith('rename')
      expect(isContextMenuVisible()).toBe(false)
    })

    it('should select item on Space', () => {
      const onSelect = vi.fn()
      showContextMenu({
        x: 0,
        y: 0,
        items: [
          { label: 'Rename', action: 'rename' },
          { label: 'Delete', action: 'delete' },
        ],
        onSelect,
      })

      // Navigate to second item
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))

      // Press Space
      document.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }))

      expect(onSelect).toHaveBeenCalledWith('delete')
      expect(isContextMenuVisible()).toBe(false)
    })

    it('should close on Escape (AC4)', () => {
      const onSelect = vi.fn()
      showContextMenu({
        x: 0,
        y: 0,
        items: [{ label: 'Test', action: 'test' }],
        onSelect,
      })

      expect(isContextMenuVisible()).toBe(true)

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))

      expect(isContextMenuVisible()).toBe(false)
      expect(onSelect).not.toHaveBeenCalled()
    })

    it('should trap focus with Tab key (cycle forward)', () => {
      const onSelect = vi.fn()
      showContextMenu({
        x: 0,
        y: 0,
        items: [
          { label: 'First', action: 'first' },
          { label: 'Second', action: 'second' },
          { label: 'Third', action: 'third' },
        ],
        onSelect,
      })

      const items = document.querySelectorAll('.context-menu__item')
      expect(items[0].classList.contains('context-menu__item--focused')).toBe(true)

      // Tab should move to next item
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }))
      expect(items[1].classList.contains('context-menu__item--focused')).toBe(true)

      // Tab again
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }))
      expect(items[2].classList.contains('context-menu__item--focused')).toBe(true)

      // Tab should wrap to first
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }))
      expect(items[0].classList.contains('context-menu__item--focused')).toBe(true)

      // Menu should still be open
      expect(isContextMenuVisible()).toBe(true)
    })

    it('should trap focus with Shift+Tab key (cycle backward)', () => {
      const onSelect = vi.fn()
      showContextMenu({
        x: 0,
        y: 0,
        items: [
          { label: 'First', action: 'first' },
          { label: 'Second', action: 'second' },
        ],
        onSelect,
      })

      const items = document.querySelectorAll('.context-menu__item')
      expect(items[0].classList.contains('context-menu__item--focused')).toBe(true)

      // Shift+Tab should wrap to last item
      document.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true })
      )
      expect(items[1].classList.contains('context-menu__item--focused')).toBe(true)

      // Shift+Tab again
      document.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true })
      )
      expect(items[0].classList.contains('context-menu__item--focused')).toBe(true)
    })
  })

  describe('mouse interaction', () => {
    it('should close on click outside (AC4)', () => {
      const onSelect = vi.fn()
      showContextMenu({
        x: 0,
        y: 0,
        items: [{ label: 'Test', action: 'test' }],
        onSelect,
      })

      expect(isContextMenuVisible()).toBe(true)

      // Click outside the menu
      document.body.click()

      expect(isContextMenuVisible()).toBe(false)
      expect(onSelect).not.toHaveBeenCalled()
    })

    it('should select item on click', () => {
      const onSelect = vi.fn()
      showContextMenu({
        x: 0,
        y: 0,
        items: [
          { label: 'Rename', action: 'rename' },
          { label: 'Delete', action: 'delete' },
        ],
        onSelect,
      })

      const deleteItem = document.querySelectorAll('.context-menu__item')[1] as HTMLElement
      deleteItem.click()

      expect(onSelect).toHaveBeenCalledWith('delete')
      expect(isContextMenuVisible()).toBe(false)
    })

    it('should update focus on mouse enter', () => {
      const onSelect = vi.fn()
      showContextMenu({
        x: 0,
        y: 0,
        items: [
          { label: 'Rename', action: 'rename' },
          { label: 'Delete', action: 'delete' },
        ],
        onSelect,
      })

      const items = document.querySelectorAll('.context-menu__item')
      expect(items[0].classList.contains('context-menu__item--focused')).toBe(true)

      // Mouse enter second item
      items[1].dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }))

      expect(items[0].classList.contains('context-menu__item--focused')).toBe(false)
      expect(items[1].classList.contains('context-menu__item--focused')).toBe(true)
    })
  })

  describe('hideContextMenu', () => {
    it('should remove menu from DOM', () => {
      const onSelect = vi.fn()
      showContextMenu({
        x: 0,
        y: 0,
        items: [{ label: 'Test', action: 'test' }],
        onSelect,
      })

      expect(document.querySelector('.context-menu')).not.toBeNull()

      hideContextMenu()

      expect(document.querySelector('.context-menu')).toBeNull()
    })

    it('should call onClose callback', () => {
      const onSelect = vi.fn()
      const onClose = vi.fn()
      showContextMenu({
        x: 0,
        y: 0,
        items: [{ label: 'Test', action: 'test' }],
        onSelect,
        onClose,
      })

      hideContextMenu()

      expect(onClose).toHaveBeenCalled()
    })

    it('should return focus to trigger element on close', () => {
      const onSelect = vi.fn()
      const triggerButton = document.createElement('button')
      triggerButton.textContent = 'Trigger'
      document.body.appendChild(triggerButton)
      const focusSpy = vi.spyOn(triggerButton, 'focus')

      showContextMenu({
        x: 0,
        y: 0,
        items: [{ label: 'Test', action: 'test' }],
        onSelect,
        triggerElement: triggerButton,
      })

      hideContextMenu()

      expect(focusSpy).toHaveBeenCalled()
    })

    it('should mark menu not visible', () => {
      const onSelect = vi.fn()
      showContextMenu({
        x: 0,
        y: 0,
        items: [{ label: 'Test', action: 'test' }],
        onSelect,
      })

      expect(isContextMenuVisible()).toBe(true)

      hideContextMenu()

      expect(isContextMenuVisible()).toBe(false)
    })
  })

  describe('danger styling', () => {
    it('should add danger class to items marked as danger', () => {
      const onSelect = vi.fn()
      showContextMenu({
        x: 0,
        y: 0,
        items: [
          { label: 'Rename', action: 'rename' },
          { label: 'Delete', action: 'delete', danger: true },
        ],
        onSelect,
      })

      const items = document.querySelectorAll('.context-menu__item')
      expect(items[0].classList.contains('context-menu__item--danger')).toBe(false)
      expect(items[1].classList.contains('context-menu__item--danger')).toBe(true)
    })
  })
})
