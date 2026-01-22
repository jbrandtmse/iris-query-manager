/**
 * Capture Form Component
 * Form for capturing SQL queries with name and optional folder selection
 */

import type { Folder } from '../../shared/types/storage.types'
import './capture-form.css'

export interface CaptureFormOptions {
  onSave: (name: string, folderId: string | null) => Promise<void>
  onCancel: () => void
}

interface TreeNode {
  folder: Folder
  children: TreeNode[]
}

/**
 * Create the capture form element
 *
 * @param options - Form configuration with save/cancel handlers
 * @returns HTMLDivElement containing the complete form
 */
export function createCaptureForm(options: CaptureFormOptions): HTMLDivElement {
  const form = document.createElement('div')
  form.className = 'capture-form js-capture-form'
  form.hidden = true

  // Name field
  const nameField = document.createElement('div')
  nameField.className = 'capture-form__field'

  const nameLabel = document.createElement('label')
  nameLabel.className = 'capture-form__label'
  nameLabel.setAttribute('for', 'query-name')
  nameLabel.textContent = 'Query Name'

  const nameInput = document.createElement('input')
  nameInput.type = 'text'
  nameInput.id = 'query-name'
  nameInput.className = 'capture-form__input js-query-name'
  nameInput.placeholder = 'Enter a name for this query'
  nameInput.required = true
  nameInput.maxLength = 100
  nameInput.setAttribute('aria-describedby', 'query-name-error')

  const nameError = document.createElement('span')
  nameError.id = 'query-name-error'
  nameError.className = 'capture-form__error js-name-error'
  nameError.hidden = true
  nameError.textContent = 'Name is required'
  nameError.setAttribute('aria-live', 'polite')

  nameField.appendChild(nameLabel)
  nameField.appendChild(nameInput)
  nameField.appendChild(nameError)

  // Folder field
  const folderField = document.createElement('div')
  folderField.className = 'capture-form__field'

  const folderLabel = document.createElement('label')
  folderLabel.className = 'capture-form__label'
  folderLabel.setAttribute('for', 'folder-select')
  folderLabel.textContent = 'Folder (optional)'

  const folderSelect = document.createElement('select')
  folderSelect.id = 'folder-select'
  folderSelect.className = 'capture-form__dropdown js-folder-select'

  const noFolderOption = document.createElement('option')
  noFolderOption.value = ''
  noFolderOption.textContent = 'No folder'
  folderSelect.appendChild(noFolderOption)

  folderField.appendChild(folderLabel)
  folderField.appendChild(folderSelect)

  // Form error message (for API errors)
  const formError = document.createElement('div')
  formError.className = 'capture-form__form-error js-form-error'
  formError.hidden = true
  formError.setAttribute('aria-live', 'polite')

  // Actions
  const actions = document.createElement('div')
  actions.className = 'capture-form__actions'

  const cancelBtn = document.createElement('button')
  cancelBtn.type = 'button'
  cancelBtn.className = 'btn btn--secondary js-cancel-btn'
  cancelBtn.textContent = 'Cancel'

  const saveBtn = document.createElement('button')
  saveBtn.type = 'button'
  saveBtn.className = 'btn btn--primary js-save-btn'
  saveBtn.textContent = 'Save'
  saveBtn.disabled = true

  actions.appendChild(cancelBtn)
  actions.appendChild(saveBtn)

  // Assemble form
  form.appendChild(nameField)
  form.appendChild(folderField)
  form.appendChild(formError)
  form.appendChild(actions)

  // Set up event handlers
  let isLoading = false

  // Store handlers for cleanup
  const handleInput = (): void => {
    const trimmedLength = nameInput.value.trim().length
    const isTooLong = nameInput.value.length >= 100
    const isValid = trimmedLength > 0 && !isTooLong
    saveBtn.disabled = !isValid || isLoading

    // Show "Name too long" error when at max length
    if (isTooLong) {
      nameInput.classList.add('capture-form__input--error')
      nameInput.setAttribute('aria-invalid', 'true')
      nameError.textContent = 'Name too long'
      nameError.hidden = false
    } else if (trimmedLength > 0) {
      // Clear error state when valid
      nameInput.classList.remove('capture-form__input--error')
      nameInput.setAttribute('aria-invalid', 'false')
      nameError.textContent = 'Name is required'
      nameError.hidden = true
      formError.hidden = true
    }
  }

  // Show error on blur if empty (but not if already showing "too long" error)
  const handleBlur = (): void => {
    if (nameInput.value.trim().length === 0) {
      nameInput.classList.add('capture-form__input--error')
      nameInput.setAttribute('aria-invalid', 'true')
      nameError.textContent = 'Name is required'
      nameError.hidden = false
    }
  }

  // Save handler
  const handleSave = async (): Promise<void> => {
    const name = nameInput.value.trim()
    if (!name || isLoading) return

    const folderId = folderSelect.value || null

    isLoading = true
    saveBtn.disabled = true
    saveBtn.classList.add('btn--loading')

    try {
      await options.onSave(name, folderId)
    } finally {
      isLoading = false
      saveBtn.classList.remove('btn--loading')
      // Re-enable if still valid
      saveBtn.disabled = nameInput.value.trim().length === 0
    }
  }

  // Keyboard handlers
  const handleNameKeydown = (event: KeyboardEvent): void => {
    if (event.key === 'Enter' && nameInput.value.trim().length > 0) {
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

  const populateFolders = (folders: Folder[]): void => {
    // Clear existing options except "No folder"
    folderSelect.innerHTML = ''
    const noFolder = document.createElement('option')
    noFolder.value = ''
    noFolder.textContent = 'No folder'
    folderSelect.appendChild(noFolder)

    // Build tree and add options
    const tree = buildFolderTree(folders)
    addFolderOptions(folderSelect, tree, 0)
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
  ;(form as any).__populateFolders = populateFolders
  ;(form as any).__destroy = destroy

  return form
}

/**
 * Build a hierarchical tree structure from flat folder list
 */
function buildFolderTree(folders: Folder[]): TreeNode[] {
  const nodeMap = new Map<string, TreeNode>()
  const roots: TreeNode[] = []

  // Create nodes for all folders
  for (const folder of folders) {
    nodeMap.set(folder.id, { folder, children: [] })
  }

  // Build tree structure
  for (const folder of folders) {
    const node = nodeMap.get(folder.id)!
    if (folder.parentId === null) {
      roots.push(node)
    } else {
      const parent = nodeMap.get(folder.parentId)
      if (parent) {
        parent.children.push(node)
      } else {
        // Orphan folder - treat as root
        roots.push(node)
      }
    }
  }

  // Sort alphabetically at each level
  const sortNodes = (nodes: TreeNode[]): void => {
    nodes.sort((a, b) => a.folder.name.localeCompare(b.folder.name))
    for (const node of nodes) {
      sortNodes(node.children)
    }
  }
  sortNodes(roots)

  return roots
}

/**
 * Add folder options to select element with indentation
 */
function addFolderOptions(
  select: HTMLSelectElement,
  nodes: TreeNode[],
  depth: number
): void {
  for (const node of nodes) {
    const option = document.createElement('option')
    option.value = node.folder.id
    option.textContent = '—'.repeat(depth) + (depth > 0 ? ' ' : '') + node.folder.name
    select.appendChild(option)

    if (node.children.length > 0) {
      addFolderOptions(select, node.children, depth + 1)
    }
  }
}

/**
 * Show the capture form and focus the name input
 */
export function showCaptureForm(form: HTMLElement): void {
  form.hidden = false
  form.classList.add('capture-form--visible')

  // Focus name input
  const nameInput = form.querySelector('.js-query-name') as HTMLInputElement
  nameInput?.focus()
}

/**
 * Hide the capture form and reset its state
 */
export function hideCaptureForm(form: HTMLElement): void {
  form.hidden = true
  form.classList.remove('capture-form--visible')

  // Reset form state
  resetForm(form)
}

/**
 * Reset all form fields and error states
 */
function resetForm(form: HTMLElement): void {
  const nameInput = form.querySelector('.js-query-name') as HTMLInputElement
  const folderSelect = form.querySelector('.js-folder-select') as HTMLSelectElement
  const nameError = form.querySelector('.js-name-error') as HTMLElement
  const formError = form.querySelector('.js-form-error') as HTMLElement
  const saveBtn = form.querySelector('.js-save-btn') as HTMLButtonElement

  if (nameInput) {
    nameInput.value = ''
    nameInput.classList.remove('capture-form__input--error')
    nameInput.removeAttribute('aria-invalid')
  }

  if (folderSelect) {
    folderSelect.value = ''
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
