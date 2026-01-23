import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createHeader, type HeaderOptions } from './header'

describe('header', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('createHeader', () => {
    it('should create a header element', () => {
      const header = createHeader()

      expect(header).toBeInstanceOf(HTMLElement)
      expect(header.tagName).toBe('HEADER')
    })

    it('should have header class', () => {
      const header = createHeader()

      expect(header.classList.contains('header')).toBe(true)
    })

    it('should display "IRIS Query Manager" as title', () => {
      const header = createHeader()
      const title = header.querySelector('.header__title')

      expect(title).not.toBeNull()
      expect(title?.textContent).toBe('IRIS Query Manager')
    })

    it('should render title as h1 element', () => {
      const header = createHeader()
      const title = header.querySelector('.header__title')

      expect(title?.tagName).toBe('H1')
    })

    it('should contain actions container', () => {
      const header = createHeader()
      const actions = header.querySelector('.header__actions')

      expect(actions).not.toBeNull()
    })

    it('should have three icon buttons in actions', () => {
      const header = createHeader()
      const buttons = header.querySelectorAll('.icon-button')

      // Capture, New Folder, and Menu buttons
      expect(buttons).toHaveLength(3)
    })

    describe('capture button', () => {
      it('should have js-capture-btn class', () => {
        const header = createHeader()
        const captureBtn = header.querySelector('.js-capture-btn')

        expect(captureBtn).not.toBeNull()
      })

      it('should have aria-label "Capture query"', () => {
        const header = createHeader()
        const captureBtn = header.querySelector('.js-capture-btn')

        expect(captureBtn?.getAttribute('aria-label')).toBe('Capture query')
      })

      it('should contain plus SVG icon', () => {
        const header = createHeader()
        const captureBtn = header.querySelector('.js-capture-btn')
        const svg = captureBtn?.querySelector('svg')

        expect(svg).not.toBeNull()
        // Plus icon has two lines
        expect(captureBtn?.innerHTML).toContain('line')
      })

      it('should call onCaptureClick when clicked', () => {
        const onCaptureClick = vi.fn()
        const header = createHeader({ onCaptureClick })
        const captureBtn = header.querySelector('.js-capture-btn') as HTMLButtonElement

        captureBtn.click()

        expect(onCaptureClick).toHaveBeenCalledTimes(1)
      })

      it('should not throw when onCaptureClick is undefined', () => {
        const header = createHeader()
        const captureBtn = header.querySelector('.js-capture-btn') as HTMLButtonElement

        expect(() => captureBtn.click()).not.toThrow()
      })
    })

    describe('menu button', () => {
      it('should have js-menu-btn class', () => {
        const header = createHeader()
        const menuBtn = header.querySelector('.js-menu-btn')

        expect(menuBtn).not.toBeNull()
      })

      it('should have aria-label "Menu"', () => {
        const header = createHeader()
        const menuBtn = header.querySelector('.js-menu-btn')

        expect(menuBtn?.getAttribute('aria-label')).toBe('Menu')
      })

      it('should contain more-vertical SVG icon', () => {
        const header = createHeader()
        const menuBtn = header.querySelector('.js-menu-btn')
        const svg = menuBtn?.querySelector('svg')

        expect(svg).not.toBeNull()
        // More-vertical icon has three circles
        expect(menuBtn?.innerHTML).toContain('circle')
      })

      it('should call onMenuClick when clicked', () => {
        const onMenuClick = vi.fn()
        const header = createHeader({ onMenuClick })
        const menuBtn = header.querySelector('.js-menu-btn') as HTMLButtonElement

        menuBtn.click()

        expect(onMenuClick).toHaveBeenCalledTimes(1)
      })
    })

    describe('new folder button (Story 4-2)', () => {
      it('should have js-new-folder-btn class', () => {
        const header = createHeader()
        const newFolderBtn = header.querySelector('.js-new-folder-btn')

        expect(newFolderBtn).not.toBeNull()
      })

      it('should have aria-label "Create new folder"', () => {
        const header = createHeader()
        const newFolderBtn = header.querySelector('.js-new-folder-btn')

        expect(newFolderBtn?.getAttribute('aria-label')).toBe('Create new folder')
      })

      it('should contain folder-plus SVG icon', () => {
        const header = createHeader()
        const newFolderBtn = header.querySelector('.js-new-folder-btn')
        const svg = newFolderBtn?.querySelector('svg')

        expect(svg).not.toBeNull()
        // Folder-plus icon has path for folder and lines for plus
        expect(newFolderBtn?.innerHTML).toContain('path')
      })

      it('should call onNewFolderClick when clicked', () => {
        const onNewFolderClick = vi.fn()
        const header = createHeader({ onNewFolderClick })
        const newFolderBtn = header.querySelector('.js-new-folder-btn') as HTMLButtonElement

        newFolderBtn.click()

        expect(onNewFolderClick).toHaveBeenCalledTimes(1)
      })

      it('should not throw when onNewFolderClick is undefined', () => {
        const header = createHeader()
        const newFolderBtn = header.querySelector('.js-new-folder-btn') as HTMLButtonElement

        expect(() => newFolderBtn.click()).not.toThrow()
      })
    })

    describe('button order', () => {
      it('should have capture button, then new folder button, then menu button', () => {
        const header = createHeader()
        const buttons = header.querySelectorAll('.icon-button')

        expect(buttons[0].classList.contains('js-capture-btn')).toBe(true)
        expect(buttons[1].classList.contains('js-new-folder-btn')).toBe(true)
        expect(buttons[2].classList.contains('js-menu-btn')).toBe(true)
      })
    })

    describe('options handling', () => {
      it('should work with empty options object', () => {
        const header = createHeader({})

        expect(header).toBeInstanceOf(HTMLElement)
        expect(header.querySelectorAll('.icon-button')).toHaveLength(3)
      })

      it('should work with no options provided', () => {
        const header = createHeader()

        expect(header).toBeInstanceOf(HTMLElement)
      })

      it('should support both handlers simultaneously', () => {
        const onCaptureClick = vi.fn()
        const onMenuClick = vi.fn()
        const header = createHeader({ onCaptureClick, onMenuClick })

        const captureBtn = header.querySelector('.js-capture-btn') as HTMLButtonElement
        const menuBtn = header.querySelector('.js-menu-btn') as HTMLButtonElement

        captureBtn.click()
        menuBtn.click()

        expect(onCaptureClick).toHaveBeenCalledTimes(1)
        expect(onMenuClick).toHaveBeenCalledTimes(1)
      })
    })
  })
})
