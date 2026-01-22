/**
 * Toast Notification Component
 * Displays success, error, and info toast messages
 */

import './toast.css'
import { ICONS } from '../icons'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

// Module state
let toastContainer: HTMLDivElement | null = null
let currentToast: HTMLDivElement | null = null
let dismissTimeout: number | null = null

/**
 * Show a toast notification
 * Replaces any existing toast
 */
export function showToast(message: string, type: ToastType = 'success'): void {
  // Remove existing toast if any
  hideToast()

  // Create container if needed
  ensureContainer()

  // Create toast element
  const toast = createToastElement(message, type)
  currentToast = toast

  // Add to container
  toastContainer!.appendChild(toast)

  // Trigger reflow then add visible class for animation
  toast.offsetHeight // Force reflow
  toast.classList.add('toast--visible')

  // Auto-dismiss for non-persistent toasts (error and warning persist)
  if (type !== 'error' && type !== 'warning') {
    const duration = type === 'info' ? 2000 : 1500
    dismissTimeout = window.setTimeout(() => {
      hideToastWithAnimation()
    }, duration)
  }
}

/**
 * Hide the current toast immediately
 */
export function hideToast(): void {
  if (dismissTimeout) {
    clearTimeout(dismissTimeout)
    dismissTimeout = null
  }
  if (currentToast) {
    currentToast.remove()
    currentToast = null
  }
}

/**
 * Hide with fade-out animation
 */
function hideToastWithAnimation(): void {
  if (!currentToast) return

  // Check for reduced motion
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  if (prefersReducedMotion) {
    hideToast()
    return
  }

  currentToast.classList.add('toast--hiding')
  currentToast.classList.remove('toast--visible')

  // Wait for animation to complete
  setTimeout(hideToast, 300)
}

/**
 * Ensure toast container exists in DOM
 */
function ensureContainer(): void {
  if (toastContainer && document.body.contains(toastContainer)) return

  toastContainer = document.createElement('div')
  toastContainer.className = 'toast-container'
  document.body.appendChild(toastContainer)
}

/**
 * Create a toast element with icon, message, and optional dismiss button
 */
function createToastElement(message: string, type: ToastType): HTMLDivElement {
  const toast = document.createElement('div')
  toast.className = `toast toast--${type}`
  const isUrgent = type === 'error' || type === 'warning'
  toast.setAttribute('role', isUrgent ? 'alert' : 'status')
  toast.setAttribute('aria-live', isUrgent ? 'assertive' : 'polite')

  // Icon
  const iconSpan = document.createElement('span')
  iconSpan.className = 'toast__icon'
  iconSpan.innerHTML = getIconForType(type)
  toast.appendChild(iconSpan)

  // Message
  const messageSpan = document.createElement('span')
  messageSpan.className = 'toast__message'
  messageSpan.textContent = message
  toast.appendChild(messageSpan)

  // Dismiss button for persistent toasts (error and warning)
  if (type === 'error' || type === 'warning') {
    const dismissBtn = document.createElement('button')
    dismissBtn.type = 'button'
    dismissBtn.className = 'toast__dismiss'
    dismissBtn.setAttribute('aria-label', 'Dismiss')
    dismissBtn.innerHTML = ICONS.close
    dismissBtn.addEventListener('click', hideToast)
    toast.appendChild(dismissBtn)
  }

  return toast
}

/**
 * Get the appropriate icon for toast type
 */
function getIconForType(type: ToastType): string {
  switch (type) {
    case 'success':
      return ICONS.checkmark
    case 'error':
      return ICONS.errorCircle
    case 'info':
      return ICONS.infoCircle
    case 'warning':
      return ICONS.warningTriangle
  }
}
