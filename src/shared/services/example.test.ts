import { describe, it, expect } from 'vitest'

describe('Test Framework Setup', () => {
  it('should run a basic test', () => {
    expect(1 + 1).toBe(2)
  })

  it('should have access to DOM APIs via jsdom', () => {
    const div = document.createElement('div')
    div.textContent = 'Hello'
    expect(div.textContent).toBe('Hello')
  })
})
