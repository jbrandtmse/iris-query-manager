import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { findSmpTextarea, waitForTextarea, observeForTextarea } from './smp-detector'

describe('smp-detector', () => {
  let container: HTMLElement

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
  })

  afterEach(() => {
    document.body.innerHTML = ''
    vi.restoreAllMocks()
  })

  describe('findSmpTextarea', () => {
    it('finds textarea with primary selector (#QueryText textarea)', () => {
      container.innerHTML = `
        <div id="QueryText">
          <textarea id="queryText">SELECT * FROM Users</textarea>
        </div>
      `

      const result = findSmpTextarea()

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.value).toBe('SELECT * FROM Users')
      }
    })

    it('finds textarea with fallback selector (#queryText)', () => {
      container.innerHTML = `
        <textarea id="queryText">SELECT 1</textarea>
      `

      const result = findSmpTextarea()

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.value).toBe('SELECT 1')
      }
    })

    it('finds textarea with class-based fallback (.queryText textarea)', () => {
      container.innerHTML = `
        <div class="queryText">
          <textarea>SELECT 2</textarea>
        </div>
      `

      const result = findSmpTextarea()

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.value).toBe('SELECT 2')
      }
    })

    it('finds textarea with name attribute fallback', () => {
      container.innerHTML = `
        <textarea name="queryInput">SELECT 3</textarea>
      `

      const result = findSmpTextarea()

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.value).toBe('SELECT 3')
      }
    })

    it('returns error when no textarea found', () => {
      container.innerHTML = `
        <div id="QueryText">
          <input type="text" />
        </div>
      `

      const result = findSmpTextarea()

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('not found')
      }
    })

    it('returns error when page has no matching elements', () => {
      container.innerHTML = `
        <div>
          <p>No query elements here</p>
        </div>
      `

      const result = findSmpTextarea()

      expect(result.success).toBe(false)
    })

    it('prioritizes primary selector over fallbacks', () => {
      container.innerHTML = `
        <div id="QueryText">
          <textarea>PRIMARY</textarea>
        </div>
        <textarea id="queryText">FALLBACK</textarea>
      `

      const result = findSmpTextarea()

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.value).toBe('PRIMARY')
      }
    })
  })

  describe('waitForTextarea', () => {
    it('returns immediately if textarea already exists', async () => {
      container.innerHTML = `
        <div id="QueryText">
          <textarea>EXISTING</textarea>
        </div>
      `

      const result = await waitForTextarea(1000)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.value).toBe('EXISTING')
      }
    })

    it('detects textarea added dynamically', async () => {
      const promise = waitForTextarea(2000)

      // Simulate dynamic content load after 50ms
      setTimeout(() => {
        container.innerHTML = `
          <div id="QueryText">
            <textarea>DYNAMIC</textarea>
          </div>
        `
      }, 50)

      const result = await promise

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.value).toBe('DYNAMIC')
      }
    })

    it('returns error after timeout if textarea never appears', async () => {
      const result = await waitForTextarea(100)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('timeout')
      }
    })
  })

  describe('observeForTextarea', () => {
    it('calls callback when textarea appears', async () => {
      const callback = vi.fn()

      observeForTextarea(callback)

      // Simulate dynamic content load
      setTimeout(() => {
        container.innerHTML = `
          <div id="QueryText">
            <textarea>OBSERVED</textarea>
          </div>
        `
      }, 50)

      // Wait for observer to trigger
      await new Promise((resolve) => setTimeout(resolve, 100))

      expect(callback).toHaveBeenCalled()
      expect(callback.mock.calls[0][0].value).toBe('OBSERVED')
    })

    it('cleanup function stops observing', async () => {
      const callback = vi.fn()

      const cleanup = observeForTextarea(callback)
      cleanup()

      // Add textarea after cleanup
      container.innerHTML = `
        <div id="QueryText">
          <textarea>AFTER_CLEANUP</textarea>
        </div>
      `

      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 100))

      expect(callback).not.toHaveBeenCalled()
    })

    it('only triggers once when textarea found', async () => {
      const callback = vi.fn()

      observeForTextarea(callback)

      // Add textarea
      container.innerHTML = `
        <div id="QueryText">
          <textarea>FIRST</textarea>
        </div>
      `

      // Wait for first callback
      await new Promise((resolve) => setTimeout(resolve, 50))

      // Modify DOM again
      const textarea = document.querySelector('textarea')!
      textarea.value = 'MODIFIED'

      // Wait again
      await new Promise((resolve) => setTimeout(resolve, 50))

      // Should only be called once
      expect(callback).toHaveBeenCalledTimes(1)
    })
  })
})
