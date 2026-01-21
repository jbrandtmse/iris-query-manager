/**
 * Icon Button Component
 * Creates accessible icon-only buttons with proper states
 */

import './icon-button.css'

export interface IconButtonOptions {
  icon: string
  label: string
  onClick?: () => void
  disabled?: boolean
  className?: string
}

/**
 * Create an icon button element
 *
 * @param options - Button configuration
 * @returns HTMLButtonElement with proper accessibility attributes
 */
export function createIconButton(options: IconButtonOptions): HTMLButtonElement {
  const button = document.createElement('button')
  button.type = 'button' // Prevent form submission if used in form context
  button.className = `icon-button ${options.className ?? ''}`.trim()
  button.setAttribute('aria-label', options.label)
  button.innerHTML = options.icon

  if (options.disabled) {
    button.disabled = true
    button.classList.add('icon-button--disabled')
  }

  if (options.onClick) {
    button.addEventListener('click', options.onClick)
  }

  return button
}
