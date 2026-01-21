import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActiveState, setInactiveState } from './icon-state'

// Mock chrome.action API
const mockSetBadgeText = vi.fn()
const mockSetBadgeBackgroundColor = vi.fn()

vi.stubGlobal('chrome', {
  action: {
    setBadgeText: mockSetBadgeText,
    setBadgeBackgroundColor: mockSetBadgeBackgroundColor,
  },
})

describe('icon-state', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('setActiveState', () => {
    it('clears badge text and resets color for specific tab', async () => {
      const result = await setActiveState(123)

      expect(mockSetBadgeText).toHaveBeenCalledWith({ tabId: 123, text: '' })
      expect(mockSetBadgeBackgroundColor).toHaveBeenCalledWith({
        tabId: 123,
        color: [0, 0, 0, 0], // Transparent
      })
      expect(result.success).toBe(true)
    })

    it('returns error when setBadgeText fails', async () => {
      mockSetBadgeText.mockRejectedValueOnce(new Error('Chrome API error'))

      const result = await setActiveState(123)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('Chrome API error')
      }
    })

    it('returns error when setBadgeBackgroundColor fails', async () => {
      mockSetBadgeText.mockResolvedValueOnce(undefined)
      mockSetBadgeBackgroundColor.mockRejectedValueOnce(
        new Error('Badge color error')
      )

      const result = await setActiveState(123)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('Badge color error')
      }
    })
  })

  describe('setInactiveState', () => {
    it('sets badge text to OFF with gray color for specific tab', async () => {
      const result = await setInactiveState(456)

      expect(mockSetBadgeText).toHaveBeenCalledWith({ tabId: 456, text: 'OFF' })
      expect(mockSetBadgeBackgroundColor).toHaveBeenCalledWith({
        tabId: 456,
        color: '#666',
      })
      expect(result.success).toBe(true)
    })

    it('returns error when setBadgeText fails', async () => {
      mockSetBadgeText.mockRejectedValueOnce(new Error('Badge text error'))

      const result = await setInactiveState(456)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('Badge text error')
      }
    })

    it('returns error when setBadgeBackgroundColor fails', async () => {
      mockSetBadgeText.mockResolvedValueOnce(undefined)
      mockSetBadgeBackgroundColor.mockRejectedValueOnce(
        new Error('Badge color error')
      )

      const result = await setInactiveState(456)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('Badge color error')
      }
    })
  })

  describe('default (no tabId) calls', () => {
    it('setActiveState without tabId sets global badge', async () => {
      const result = await setActiveState()

      expect(mockSetBadgeText).toHaveBeenCalledWith({ text: '' })
      expect(mockSetBadgeBackgroundColor).toHaveBeenCalledWith({
        color: [0, 0, 0, 0],
      })
      expect(result.success).toBe(true)
    })

    it('setInactiveState without tabId sets global badge', async () => {
      const result = await setInactiveState()

      expect(mockSetBadgeText).toHaveBeenCalledWith({ text: 'OFF' })
      expect(mockSetBadgeBackgroundColor).toHaveBeenCalledWith({ color: '#666' })
      expect(result.success).toBe(true)
    })
  })
})
