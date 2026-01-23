import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  createFolderForm,
  showFolderForm,
  hideFolderForm,
  type FolderFormOptions,
} from './folder-form'

describe('folder-form (Story 4-2)', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('createFolderForm', () => {
    const defaultOptions: FolderFormOptions = {
      onSave: vi.fn(),
      onCancel: vi.fn(),
    }

    it('should create a div element', () => {
      const form = createFolderForm(defaultOptions)

      expect(form).toBeInstanceOf(HTMLDivElement)
      expect(form.tagName).toBe('DIV')
    })

    it('should have folder-form and js-folder-form classes', () => {
      const form = createFolderForm(defaultOptions)

      expect(form.classList.contains('folder-form')).toBe(true)
      expect(form.classList.contains('js-folder-form')).toBe(true)
    })

    it('should be hidden by default', () => {
      const form = createFolderForm(defaultOptions)

      expect(form.hidden).toBe(true)
    })

    it('should have role="dialog" for accessibility', () => {
      const form = createFolderForm(defaultOptions)

      expect(form.getAttribute('role')).toBe('dialog')
    })

    it('should have name input with required attributes', () => {
      const form = createFolderForm(defaultOptions)
      const nameInput = form.querySelector('.js-folder-name') as HTMLInputElement

      expect(nameInput).not.toBeNull()
      expect(nameInput.tagName).toBe('INPUT')
      expect(nameInput.type).toBe('text')
      expect(nameInput.required).toBe(true)
      expect(nameInput.maxLength).toBe(100)
      expect(nameInput.placeholder).toBe('Enter folder name')
    })

    it('should have label for name input', () => {
      const form = createFolderForm(defaultOptions)
      const label = form.querySelector('label[for="folder-name"]')

      expect(label).not.toBeNull()
      expect(label?.textContent).toBe('Folder Name')
    })

    it('should have Save button disabled by default', () => {
      const form = createFolderForm(defaultOptions)
      const saveBtn = form.querySelector('.js-save-btn') as HTMLButtonElement

      expect(saveBtn).not.toBeNull()
      expect(saveBtn.disabled).toBe(true)
      expect(saveBtn.textContent).toBe('Create')
    })

    it('should have Cancel button', () => {
      const form = createFolderForm(defaultOptions)
      const cancelBtn = form.querySelector('.js-cancel-btn') as HTMLButtonElement

      expect(cancelBtn).not.toBeNull()
      expect(cancelBtn.disabled).toBe(false)
      expect(cancelBtn.textContent).toBe('Cancel')
    })

    it('should have error message span hidden by default', () => {
      const form = createFolderForm(defaultOptions)
      const errorSpan = form.querySelector('.js-folder-error') as HTMLSpanElement

      expect(errorSpan).not.toBeNull()
      expect(errorSpan.hidden).toBe(true)
      expect(errorSpan.textContent).toBe('Name is required')
    })

    it('should call onCancel when Cancel clicked', () => {
      const onCancel = vi.fn()
      const form = createFolderForm({ ...defaultOptions, onCancel })
      const cancelBtn = form.querySelector('.js-cancel-btn') as HTMLButtonElement

      cancelBtn.click()

      expect(onCancel).toHaveBeenCalledTimes(1)
    })

    it('should have aria-describedby linking input to error', () => {
      const form = createFolderForm(defaultOptions)
      const nameInput = form.querySelector('.js-folder-name') as HTMLInputElement
      const errorSpan = form.querySelector('.js-folder-error') as HTMLSpanElement

      expect(nameInput.getAttribute('aria-describedby')).toBe(errorSpan.id)
    })

    it('should have aria-live on error for screen reader announcements', () => {
      const form = createFolderForm(defaultOptions)
      const errorSpan = form.querySelector('.js-folder-error') as HTMLSpanElement

      expect(errorSpan.getAttribute('aria-live')).toBe('polite')
    })

    it('should have aria-live on form error for screen reader announcements', () => {
      const form = createFolderForm(defaultOptions)
      const formError = form.querySelector('.js-form-error') as HTMLElement

      expect(formError.getAttribute('aria-live')).toBe('polite')
    })
  })

  describe('validation (Task 6 subtasks)', () => {
    const defaultOptions: FolderFormOptions = {
      onSave: vi.fn(),
      onCancel: vi.fn(),
    }

    it('should enable Save button when name has content (6.3)', () => {
      const form = createFolderForm(defaultOptions)
      const nameInput = form.querySelector('.js-folder-name') as HTMLInputElement
      const saveBtn = form.querySelector('.js-save-btn') as HTMLButtonElement

      nameInput.value = 'My Folder'
      nameInput.dispatchEvent(new Event('input'))

      expect(saveBtn.disabled).toBe(false)
    })

    it('should disable Save button when name is empty (6.2)', () => {
      const form = createFolderForm(defaultOptions)
      const nameInput = form.querySelector('.js-folder-name') as HTMLInputElement
      const saveBtn = form.querySelector('.js-save-btn') as HTMLButtonElement

      // First enable it
      nameInput.value = 'My Folder'
      nameInput.dispatchEvent(new Event('input'))
      expect(saveBtn.disabled).toBe(false)

      // Then clear it
      nameInput.value = ''
      nameInput.dispatchEvent(new Event('input'))
      expect(saveBtn.disabled).toBe(true)
    })

    it('should disable Save button when name is only whitespace', () => {
      const form = createFolderForm(defaultOptions)
      const nameInput = form.querySelector('.js-folder-name') as HTMLInputElement
      const saveBtn = form.querySelector('.js-save-btn') as HTMLButtonElement

      nameInput.value = '   '
      nameInput.dispatchEvent(new Event('input'))

      expect(saveBtn.disabled).toBe(true)
    })

    it('should show error message on blur with empty name (6.6)', () => {
      const form = createFolderForm(defaultOptions)
      const nameInput = form.querySelector('.js-folder-name') as HTMLInputElement
      const errorSpan = form.querySelector('.js-folder-error') as HTMLSpanElement

      nameInput.dispatchEvent(new FocusEvent('blur'))

      expect(errorSpan.hidden).toBe(false)
    })

    it('should hide error message when name is entered after blur', () => {
      const form = createFolderForm(defaultOptions)
      const nameInput = form.querySelector('.js-folder-name') as HTMLInputElement
      const errorSpan = form.querySelector('.js-folder-error') as HTMLSpanElement

      // First show error
      nameInput.dispatchEvent(new FocusEvent('blur'))
      expect(errorSpan.hidden).toBe(false)

      // Then enter name
      nameInput.value = 'My Folder'
      nameInput.dispatchEvent(new Event('input'))
      expect(errorSpan.hidden).toBe(true)
    })

    it('should add error class to input on blur when empty', () => {
      const form = createFolderForm(defaultOptions)
      const nameInput = form.querySelector('.js-folder-name') as HTMLInputElement

      nameInput.dispatchEvent(new FocusEvent('blur'))

      expect(nameInput.classList.contains('folder-form__input--error')).toBe(true)
    })

    it('should remove error class when valid input entered', () => {
      const form = createFolderForm(defaultOptions)
      const nameInput = form.querySelector('.js-folder-name') as HTMLInputElement

      // First add error
      nameInput.dispatchEvent(new FocusEvent('blur'))
      expect(nameInput.classList.contains('folder-form__input--error')).toBe(true)

      // Then enter valid name
      nameInput.value = 'My Folder'
      nameInput.dispatchEvent(new Event('input'))
      expect(nameInput.classList.contains('folder-form__input--error')).toBe(false)
    })

    it('should set aria-invalid on empty blur', () => {
      const form = createFolderForm(defaultOptions)
      const nameInput = form.querySelector('.js-folder-name') as HTMLInputElement

      nameInput.dispatchEvent(new FocusEvent('blur'))

      expect(nameInput.getAttribute('aria-invalid')).toBe('true')
    })

    it('should set aria-invalid=false when valid', () => {
      const form = createFolderForm(defaultOptions)
      const nameInput = form.querySelector('.js-folder-name') as HTMLInputElement

      nameInput.value = 'Valid'
      nameInput.dispatchEvent(new Event('input'))

      expect(nameInput.getAttribute('aria-invalid')).toBe('false')
    })
  })

  describe('keyboard interactions (6.4, 6.5)', () => {
    const defaultOptions: FolderFormOptions = {
      onSave: vi.fn(),
      onCancel: vi.fn(),
    }

    it('should trigger save on Enter key when valid (6.4)', async () => {
      const onSave = vi.fn().mockResolvedValue(undefined)
      const form = createFolderForm({ ...defaultOptions, onSave })
      const nameInput = form.querySelector('.js-folder-name') as HTMLInputElement

      nameInput.value = 'Test Folder'
      nameInput.dispatchEvent(new Event('input'))
      nameInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }))

      // Wait for async handler
      await new Promise((r) => setTimeout(r, 0))

      expect(onSave).toHaveBeenCalledWith('Test Folder', null)
    })

    it('should not trigger save on Enter when name is empty', async () => {
      const onSave = vi.fn()
      const form = createFolderForm({ ...defaultOptions, onSave })
      const nameInput = form.querySelector('.js-folder-name') as HTMLInputElement

      nameInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }))

      await new Promise((r) => setTimeout(r, 0))

      expect(onSave).not.toHaveBeenCalled()
    })

    it('should trigger cancel on Escape key (6.5)', () => {
      const onCancel = vi.fn()
      const form = createFolderForm({ ...defaultOptions, onCancel })

      form.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))

      expect(onCancel).toHaveBeenCalledTimes(1)
    })
  })

  describe('save callback (6.7, 6.8)', () => {
    it('should call onSave with name and parentId when save button clicked (6.7)', async () => {
      const onSave = vi.fn().mockResolvedValue(undefined)
      const form = createFolderForm({ onSave, onCancel: vi.fn() })
      const nameInput = form.querySelector('.js-folder-name') as HTMLInputElement
      const saveBtn = form.querySelector('.js-save-btn') as HTMLButtonElement

      nameInput.value = 'New Folder'
      nameInput.dispatchEvent(new Event('input'))
      saveBtn.click()

      await new Promise((r) => setTimeout(r, 0))

      expect(onSave).toHaveBeenCalledWith('New Folder', null)
    })

    it('should call onCancel when cancel button clicked (6.8)', () => {
      const onCancel = vi.fn()
      const form = createFolderForm({ onSave: vi.fn(), onCancel })
      const cancelBtn = form.querySelector('.js-cancel-btn') as HTMLButtonElement

      cancelBtn.click()

      expect(onCancel).toHaveBeenCalledTimes(1)
    })

    it('should pass parentId from options to onSave', async () => {
      const onSave = vi.fn().mockResolvedValue(undefined)
      const form = createFolderForm({ onSave, onCancel: vi.fn(), parentId: 'parent-123' })
      const nameInput = form.querySelector('.js-folder-name') as HTMLInputElement
      const saveBtn = form.querySelector('.js-save-btn') as HTMLButtonElement

      nameInput.value = 'Subfolder'
      nameInput.dispatchEvent(new Event('input'))
      saveBtn.click()

      await new Promise((r) => setTimeout(r, 0))

      expect(onSave).toHaveBeenCalledWith('Subfolder', 'parent-123')
    })

    it('should trim name before calling onSave', async () => {
      const onSave = vi.fn().mockResolvedValue(undefined)
      const form = createFolderForm({ onSave, onCancel: vi.fn() })
      const nameInput = form.querySelector('.js-folder-name') as HTMLInputElement
      const saveBtn = form.querySelector('.js-save-btn') as HTMLButtonElement

      nameInput.value = '  Trimmed  '
      nameInput.dispatchEvent(new Event('input'))
      saveBtn.click()

      await new Promise((r) => setTimeout(r, 0))

      expect(onSave).toHaveBeenCalledWith('Trimmed', null)
    })
  })

  describe('loading state', () => {
    it('should add loading class to save button during save', async () => {
      let resolvePromise: (value?: unknown) => void = () => {}
      const onSave = vi.fn().mockReturnValue(new Promise((r) => { resolvePromise = r }))
      const form = createFolderForm({ onSave, onCancel: vi.fn() })
      const nameInput = form.querySelector('.js-folder-name') as HTMLInputElement
      const saveBtn = form.querySelector('.js-save-btn') as HTMLButtonElement

      nameInput.value = 'Test'
      nameInput.dispatchEvent(new Event('input'))
      saveBtn.click()

      // During loading
      expect(saveBtn.classList.contains('btn--loading')).toBe(true)
      expect(saveBtn.disabled).toBe(true)

      // Resolve and wait
      resolvePromise()
      await new Promise((r) => setTimeout(r, 0))

      expect(saveBtn.classList.contains('btn--loading')).toBe(false)
    })

    it('should disable save button during async operation', async () => {
      let resolvePromise: (value?: unknown) => void = () => {}
      const onSave = vi.fn().mockReturnValue(new Promise((r) => { resolvePromise = r }))
      const form = createFolderForm({ onSave, onCancel: vi.fn() })
      const nameInput = form.querySelector('.js-folder-name') as HTMLInputElement
      const saveBtn = form.querySelector('.js-save-btn') as HTMLButtonElement

      nameInput.value = 'Test'
      nameInput.dispatchEvent(new Event('input'))
      saveBtn.click()

      expect(saveBtn.disabled).toBe(true)

      resolvePromise()
      await new Promise((r) => setTimeout(r, 0))
    })
  })

  describe('showFolderForm', () => {
    it('should remove hidden attribute', () => {
      const form = createFolderForm({ onSave: vi.fn(), onCancel: vi.fn() })

      showFolderForm(form)

      expect(form.hidden).toBe(false)
    })

    it('should add folder-form--visible class', () => {
      const form = createFolderForm({ onSave: vi.fn(), onCancel: vi.fn() })

      showFolderForm(form)

      expect(form.classList.contains('folder-form--visible')).toBe(true)
    })

    it('should focus name input (6.7 - focus on show)', () => {
      const form = createFolderForm({ onSave: vi.fn(), onCancel: vi.fn() })
      document.body.appendChild(form)

      showFolderForm(form)

      const nameInput = form.querySelector('.js-folder-name') as HTMLInputElement
      expect(document.activeElement).toBe(nameInput)
    })
  })

  describe('hideFolderForm', () => {
    it('should add hidden attribute', () => {
      const form = createFolderForm({ onSave: vi.fn(), onCancel: vi.fn() })
      showFolderForm(form)

      hideFolderForm(form)

      expect(form.hidden).toBe(true)
    })

    it('should remove folder-form--visible class', () => {
      const form = createFolderForm({ onSave: vi.fn(), onCancel: vi.fn() })
      showFolderForm(form)

      hideFolderForm(form)

      expect(form.classList.contains('folder-form--visible')).toBe(false)
    })

    it('should reset name input value', () => {
      const form = createFolderForm({ onSave: vi.fn(), onCancel: vi.fn() })
      const nameInput = form.querySelector('.js-folder-name') as HTMLInputElement
      nameInput.value = 'Test'

      hideFolderForm(form)

      expect(nameInput.value).toBe('')
    })

    it('should reset save button to disabled', () => {
      const form = createFolderForm({ onSave: vi.fn(), onCancel: vi.fn() })
      const nameInput = form.querySelector('.js-folder-name') as HTMLInputElement
      const saveBtn = form.querySelector('.js-save-btn') as HTMLButtonElement

      // Enable it first
      nameInput.value = 'Test'
      nameInput.dispatchEvent(new Event('input'))
      expect(saveBtn.disabled).toBe(false)

      hideFolderForm(form)

      expect(saveBtn.disabled).toBe(true)
    })

    it('should hide error message', () => {
      const form = createFolderForm({ onSave: vi.fn(), onCancel: vi.fn() })
      const nameInput = form.querySelector('.js-folder-name') as HTMLInputElement
      const errorSpan = form.querySelector('.js-folder-error') as HTMLSpanElement

      // Show error first
      nameInput.dispatchEvent(new FocusEvent('blur'))
      expect(errorSpan.hidden).toBe(false)

      hideFolderForm(form)

      expect(errorSpan.hidden).toBe(true)
    })

    it('should remove error class from input', () => {
      const form = createFolderForm({ onSave: vi.fn(), onCancel: vi.fn() })
      const nameInput = form.querySelector('.js-folder-name') as HTMLInputElement

      // Add error first
      nameInput.dispatchEvent(new FocusEvent('blur'))
      expect(nameInput.classList.contains('folder-form__input--error')).toBe(true)

      hideFolderForm(form)

      expect(nameInput.classList.contains('folder-form__input--error')).toBe(false)
    })
  })

  describe('__showError helper method', () => {
    it('should expose __showError method', () => {
      const form = createFolderForm({ onSave: vi.fn(), onCancel: vi.fn() })

      expect(typeof (form as any).__showError).toBe('function')
    })

    it('should display error message in form error area', () => {
      const form = createFolderForm({ onSave: vi.fn(), onCancel: vi.fn() })
      const formError = form.querySelector('.js-form-error') as HTMLElement

      ;(form as any).__showError('Something went wrong')

      expect(formError.hidden).toBe(false)
      expect(formError.textContent).toBe('Something went wrong')
    })
  })

  describe('__destroy helper method', () => {
    it('should expose __destroy method', () => {
      const form = createFolderForm({ onSave: vi.fn(), onCancel: vi.fn() })

      expect(typeof (form as any).__destroy).toBe('function')
    })
  })
})
