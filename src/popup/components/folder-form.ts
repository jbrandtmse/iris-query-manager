/**
 * Folder Form Component
 * Story 4-2: Form for creating new folders
 * Pattern: Follows capture-form.ts conventions
 */

import './folder-form.css'

export interface FolderFormOptions {
  onSave: (name: string, parentId: string | null) => Promise<void>
  onCancel: () => void
  parentId?: string | null
}

/**
 * Create the folder form element
 *
 * @param options - Form configuration with save/cancel handlers and optional parentId
 * @returns HTMLDivElement containing the complete form
 */
export function createFolderForm(options: FolderFormOptions): HTMLDivElement {
  const form = document.createElement('div')
  form.className = 'folder-form js-folder-form'
  form.hidden = true
  form.setAttribute('role', 'dialog')
  form.setAttribute('aria-labelledby', 'folder-form-title')

  // Name field
  const nameField = document.createElement('div')
  nameField.className = 'folder-form__field'

  const nameLabel = document.createElement('label')
  nameLabel.className = 'folder-form__label'
  nameLabel.id = 'folder-form-title'
  nameLabel.setAttribute('for', 'folder-name')
  nameLabel.textContent = 'Folder Name'

  const nameInput = document.createElement('input')
  nameInput.type = 'text'
  nameInput.id = 'folder-name'
  nameInput.className = 'folder-form__input js-folder-name'
  nameInput.placeholder = 'Enter folder name'
  nameInput.required = true
  nameInput.maxLength = 100
  nameInput.setAttribute('aria-describedby', 'folder-name-error')

  const nameError = document.createElement('span')
  nameError.id = 'folder-name-error'
  nameError.className = 'folder-form__error js-folder-error'
  nameError.hidden = true
  nameError.textContent = 'Name is required'
  nameError.setAttribute('aria-live', 'polite')

  nameField.appendChild(nameLabel)
  nameField.appendChild(nameInput)
  nameField.appendChild(nameError)

  // Form error message (for API errors)
  const formError = document.createElement('div')
  formError.className = 'folder-form__form-error js-form-error'
  formError.hidden = true
  formError.setAttribute('aria-live', 'polite')

  // Actions
  const actions = document.createElement('div')
  actions.className = 'folder-form__actions'

  const cancelBtn = document.createElement('button')
  cancelBtn.type = 'button'
  cancelBtn.className = 'btn btn--secondary js-cancel-btn'
  cancelBtn.textContent = 'Cancel'

  const saveBtn = document.createElement('button')
  saveBtn.type = 'button'
  saveBtn.className = 'btn btn--primary js-save-btn'
  saveBtn.textContent = 'Create'
  saveBtn.disabled = true

  actions.appendChild(cancelBtn)
  actions.appendChild(saveBtn)

  // Assemble form
  form.appendChild(nameField)
  form.appendChild(formError)
  form.appendChild(actions)

  // Set up event handlers
  let isLoading = false
  const parentId = options.parentId ?? null

  // Store handlers for cleanup
  const handleInput = (): void => {
    const trimmedLength = nameInput.value.trim().length
    // maxLength=100 prevents typing beyond 100, so this only triggers if programmatically set
    const isTooLong = nameInput.value.length > 100
    const isValid = trimmedLength > 0 && !isTooLong
    saveBtn.disabled = !isValid || isLoading

    // Show "Name too long" error only if exceeding max length
    if (isTooLong) {
      nameInput.classList.add('folder-form__input--error')
      nameInput.setAttribute('aria-invalid', 'true')
      nameError.textContent = 'Name too long'
      nameError.hidden = false
    } else if (trimmedLength > 0) {
      // Clear error state when valid
      nameInput.classList.remove('folder-form__input--error')
      nameInput.setAttribute('aria-invalid', 'false')
      nameError.textContent = 'Name is required'
      nameError.hidden = true
      formError.hidden = true
    }
  }

  // Show error on blur if empty
  const handleBlur = (): void => {
    if (nameInput.value.trim().length === 0) {
      nameInput.classList.add('folder-form__input--error')
      nameInput.setAttribute('aria-invalid', 'true')
      nameError.textContent = 'Name is required'
      nameError.hidden = false
    }
  }

  // Save handler
  const handleSave = async (): Promise<void> => {
    const name = nameInput.value.trim()
    if (!name || isLoading) return

    isLoading = true
    saveBtn.disabled = true
    saveBtn.classList.add('btn--loading')

    try {
      await options.onSave(name, parentId)
    } finally {
      isLoading = false
      saveBtn.classList.remove('btn--loading')
      // Re-enable if still valid
      saveBtn.disabled = nameInput.value.trim().length === 0
    }
  }

  // Keyboard handlers
  const handleNameKeydown = (event: KeyboardEvent): void => {
    if (event.key === 'Enter' && nameInput.value.trim().length > 0 && !isLoading) {
      handleSave()
    }
  }

  const handleFormKeydown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') {
      options.onCancel()
    }
  }

  const handleCancelClick = (): void => {
    options.onCancel()
  }

  // Attach event listeners
  nameInput.addEventListener('input', handleInput)
  nameInput.addEventListener('blur', handleBlur)
  saveBtn.addEventListener('click', handleSave)
  cancelBtn.addEventListener('click', handleCancelClick)
  nameInput.addEventListener('keydown', handleNameKeydown)
  form.addEventListener('keydown', handleFormKeydown)

  // Expose helper methods via the form element
  const showError = (message: string): void => {
    formError.textContent = message
    formError.hidden = false
  }

  // Cleanup function to remove event listeners
  const destroy = (): void => {
    nameInput.removeEventListener('input', handleInput)
    nameInput.removeEventListener('blur', handleBlur)
    saveBtn.removeEventListener('click', handleSave)
    cancelBtn.removeEventListener('click', handleCancelClick)
    nameInput.removeEventListener('keydown', handleNameKeydown)
    form.removeEventListener('keydown', handleFormKeydown)
  }

  // Attach methods to form element for external access
  ;(form as any).__showError = showError
  ;(form as any).__destroy = destroy

  return form
}

/**
 * Show the folder form and focus the name input
 */
export function showFolderForm(form: HTMLElement): void {
  form.hidden = false
  form.classList.add('folder-form--visible')

  // Focus name input
  const nameInput = form.querySelector('.js-folder-name') as HTMLInputElement
  nameInput?.focus()
}

/**
 * Hide the folder form and reset its state
 */
export function hideFolderForm(form: HTMLElement): void {
  form.hidden = true
  form.classList.remove('folder-form--visible')

  // Reset form state
  resetForm(form)
}

/**
 * Reset all form fields and error states
 */
function resetForm(form: HTMLElement): void {
  const nameInput = form.querySelector('.js-folder-name') as HTMLInputElement
  const nameError = form.querySelector('.js-folder-error') as HTMLElement
  const formError = form.querySelector('.js-form-error') as HTMLElement
  const saveBtn = form.querySelector('.js-save-btn') as HTMLButtonElement

  if (nameInput) {
    nameInput.value = ''
    nameInput.classList.remove('folder-form__input--error')
    nameInput.removeAttribute('aria-invalid')
  }

  if (nameError) {
    nameError.hidden = true
  }

  if (formError) {
    formError.hidden = true
  }

  if (saveBtn) {
    saveBtn.disabled = true
    saveBtn.classList.remove('btn--loading')
  }
}
