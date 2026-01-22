import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  createCaptureForm,
  showCaptureForm,
  hideCaptureForm,
  type CaptureFormOptions,
} from './capture-form'
import type { Folder } from '../../shared/types/storage.types'

describe('capture-form', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('createCaptureForm', () => {
    const defaultOptions: CaptureFormOptions = {
      onSave: vi.fn(),
      onCancel: vi.fn(),
    }

    it('should create a div element', () => {
      const form = createCaptureForm(defaultOptions)

      expect(form).toBeInstanceOf(HTMLDivElement)
      expect(form.tagName).toBe('DIV')
    })

    it('should have capture-form and js-capture-form classes', () => {
      const form = createCaptureForm(defaultOptions)

      expect(form.classList.contains('capture-form')).toBe(true)
      expect(form.classList.contains('js-capture-form')).toBe(true)
    })

    it('should be hidden by default', () => {
      const form = createCaptureForm(defaultOptions)

      expect(form.hidden).toBe(true)
    })

    it('should have name input with required attributes', () => {
      const form = createCaptureForm(defaultOptions)
      const nameInput = form.querySelector('.js-query-name') as HTMLInputElement

      expect(nameInput).not.toBeNull()
      expect(nameInput.tagName).toBe('INPUT')
      expect(nameInput.type).toBe('text')
      expect(nameInput.required).toBe(true)
      expect(nameInput.maxLength).toBe(100)
      expect(nameInput.placeholder).toBe('Enter a name for this query')
    })

    it('should have label for name input', () => {
      const form = createCaptureForm(defaultOptions)
      const label = form.querySelector('label[for="query-name"]')

      expect(label).not.toBeNull()
      expect(label?.textContent).toBe('Query Name')
    })

    it('should have folder dropdown', () => {
      const form = createCaptureForm(defaultOptions)
      const dropdown = form.querySelector('.js-folder-select') as HTMLSelectElement

      expect(dropdown).not.toBeNull()
      expect(dropdown.tagName).toBe('SELECT')
    })

    it('should have "No folder" as default dropdown option', () => {
      const form = createCaptureForm(defaultOptions)
      const dropdown = form.querySelector('.js-folder-select') as HTMLSelectElement

      expect(dropdown.options.length).toBe(1)
      expect(dropdown.options[0].value).toBe('')
      expect(dropdown.options[0].textContent).toBe('No folder')
    })

    it('should have Save button disabled by default', () => {
      const form = createCaptureForm(defaultOptions)
      const saveBtn = form.querySelector('.js-save-btn') as HTMLButtonElement

      expect(saveBtn).not.toBeNull()
      expect(saveBtn.disabled).toBe(true)
      expect(saveBtn.textContent).toBe('Save')
    })

    it('should have Cancel button', () => {
      const form = createCaptureForm(defaultOptions)
      const cancelBtn = form.querySelector('.js-cancel-btn') as HTMLButtonElement

      expect(cancelBtn).not.toBeNull()
      expect(cancelBtn.disabled).toBe(false)
      expect(cancelBtn.textContent).toBe('Cancel')
    })

    it('should have error message span hidden by default', () => {
      const form = createCaptureForm(defaultOptions)
      const errorSpan = form.querySelector('.js-name-error') as HTMLSpanElement

      expect(errorSpan).not.toBeNull()
      expect(errorSpan.hidden).toBe(true)
      expect(errorSpan.textContent).toBe('Name is required')
    })

    it('should call onCancel when Cancel clicked', () => {
      const onCancel = vi.fn()
      const form = createCaptureForm({ ...defaultOptions, onCancel })
      const cancelBtn = form.querySelector('.js-cancel-btn') as HTMLButtonElement

      cancelBtn.click()

      expect(onCancel).toHaveBeenCalledTimes(1)
    })

    it('should have aria-describedby linking input to error', () => {
      const form = createCaptureForm(defaultOptions)
      const nameInput = form.querySelector('.js-query-name') as HTMLInputElement
      const errorSpan = form.querySelector('.js-name-error') as HTMLSpanElement

      expect(nameInput.getAttribute('aria-describedby')).toBe(errorSpan.id)
    })

    it('should have aria-live on name error for screen reader announcements', () => {
      const form = createCaptureForm(defaultOptions)
      const errorSpan = form.querySelector('.js-name-error') as HTMLSpanElement

      expect(errorSpan.getAttribute('aria-live')).toBe('polite')
    })

    it('should have aria-live on form error for screen reader announcements', () => {
      const form = createCaptureForm(defaultOptions)
      const formError = form.querySelector('.js-form-error') as HTMLElement

      expect(formError.getAttribute('aria-live')).toBe('polite')
    })
  })

  describe('validation', () => {
    const defaultOptions: CaptureFormOptions = {
      onSave: vi.fn(),
      onCancel: vi.fn(),
    }

    it('should enable Save button when name has content', () => {
      const form = createCaptureForm(defaultOptions)
      const nameInput = form.querySelector('.js-query-name') as HTMLInputElement
      const saveBtn = form.querySelector('.js-save-btn') as HTMLButtonElement

      nameInput.value = 'My Query'
      nameInput.dispatchEvent(new Event('input'))

      expect(saveBtn.disabled).toBe(false)
    })

    it('should disable Save button when name is empty', () => {
      const form = createCaptureForm(defaultOptions)
      const nameInput = form.querySelector('.js-query-name') as HTMLInputElement
      const saveBtn = form.querySelector('.js-save-btn') as HTMLButtonElement

      // First enable it
      nameInput.value = 'My Query'
      nameInput.dispatchEvent(new Event('input'))
      expect(saveBtn.disabled).toBe(false)

      // Then clear it
      nameInput.value = ''
      nameInput.dispatchEvent(new Event('input'))
      expect(saveBtn.disabled).toBe(true)
    })

    it('should disable Save button when name is only whitespace', () => {
      const form = createCaptureForm(defaultOptions)
      const nameInput = form.querySelector('.js-query-name') as HTMLInputElement
      const saveBtn = form.querySelector('.js-save-btn') as HTMLButtonElement

      nameInput.value = '   '
      nameInput.dispatchEvent(new Event('input'))

      expect(saveBtn.disabled).toBe(true)
    })

    it('should show error message on blur with empty name', () => {
      const form = createCaptureForm(defaultOptions)
      const nameInput = form.querySelector('.js-query-name') as HTMLInputElement
      const errorSpan = form.querySelector('.js-name-error') as HTMLSpanElement

      // Dispatch blur event (JSDOM doesn't automatically fire events from focus()/blur())
      nameInput.dispatchEvent(new FocusEvent('blur'))

      expect(errorSpan.hidden).toBe(false)
    })

    it('should hide error message when name is entered after blur', () => {
      const form = createCaptureForm(defaultOptions)
      const nameInput = form.querySelector('.js-query-name') as HTMLInputElement
      const errorSpan = form.querySelector('.js-name-error') as HTMLSpanElement

      // Show error first
      nameInput.dispatchEvent(new FocusEvent('blur'))
      expect(errorSpan.hidden).toBe(false)

      // Then type a name
      nameInput.value = 'My Query'
      nameInput.dispatchEvent(new Event('input'))

      expect(errorSpan.hidden).toBe(true)
    })

    it('should add error class to input when invalid on blur', () => {
      const form = createCaptureForm(defaultOptions)
      const nameInput = form.querySelector('.js-query-name') as HTMLInputElement

      nameInput.dispatchEvent(new FocusEvent('blur'))

      expect(nameInput.classList.contains('capture-form__input--error')).toBe(true)
    })

    it('should remove error class when valid input entered', () => {
      const form = createCaptureForm(defaultOptions)
      const nameInput = form.querySelector('.js-query-name') as HTMLInputElement

      // Show error first
      nameInput.dispatchEvent(new FocusEvent('blur'))
      expect(nameInput.classList.contains('capture-form__input--error')).toBe(true)

      // Then type valid input
      nameInput.value = 'My Query'
      nameInput.dispatchEvent(new Event('input'))

      expect(nameInput.classList.contains('capture-form__input--error')).toBe(false)
    })

    it('should set aria-invalid when input is invalid', () => {
      const form = createCaptureForm(defaultOptions)
      const nameInput = form.querySelector('.js-query-name') as HTMLInputElement

      nameInput.dispatchEvent(new FocusEvent('blur'))

      expect(nameInput.getAttribute('aria-invalid')).toBe('true')
    })

    it('should remove aria-invalid when input becomes valid', () => {
      const form = createCaptureForm(defaultOptions)
      const nameInput = form.querySelector('.js-query-name') as HTMLInputElement

      nameInput.dispatchEvent(new FocusEvent('blur'))
      expect(nameInput.getAttribute('aria-invalid')).toBe('true')

      nameInput.value = 'My Query'
      nameInput.dispatchEvent(new Event('input'))

      expect(nameInput.getAttribute('aria-invalid')).toBe('false')
    })

    it('should show "Name too long" error when at max length', () => {
      const form = createCaptureForm(defaultOptions)
      const nameInput = form.querySelector('.js-query-name') as HTMLInputElement
      const errorSpan = form.querySelector('.js-name-error') as HTMLSpanElement
      const saveBtn = form.querySelector('.js-save-btn') as HTMLButtonElement

      // Fill with exactly 100 characters
      nameInput.value = 'a'.repeat(100)
      nameInput.dispatchEvent(new Event('input'))

      expect(errorSpan.hidden).toBe(false)
      expect(errorSpan.textContent).toBe('Name too long')
      expect(nameInput.classList.contains('capture-form__input--error')).toBe(true)
      expect(saveBtn.disabled).toBe(true)
    })

    it('should clear "Name too long" error when under max length', () => {
      const form = createCaptureForm(defaultOptions)
      const nameInput = form.querySelector('.js-query-name') as HTMLInputElement
      const errorSpan = form.querySelector('.js-name-error') as HTMLSpanElement
      const saveBtn = form.querySelector('.js-save-btn') as HTMLButtonElement

      // First trigger the too long error
      nameInput.value = 'a'.repeat(100)
      nameInput.dispatchEvent(new Event('input'))
      expect(errorSpan.textContent).toBe('Name too long')

      // Then reduce length
      nameInput.value = 'Valid name'
      nameInput.dispatchEvent(new Event('input'))

      expect(errorSpan.hidden).toBe(true)
      expect(errorSpan.textContent).toBe('Name is required') // Reset to default message
      expect(saveBtn.disabled).toBe(false)
    })
  })

  describe('save action', () => {
    it('should call onSave with name and null folderId when no folder selected', async () => {
      const onSave = vi.fn().mockResolvedValue(undefined)
      const form = createCaptureForm({ onSave, onCancel: vi.fn() })
      const nameInput = form.querySelector('.js-query-name') as HTMLInputElement
      const saveBtn = form.querySelector('.js-save-btn') as HTMLButtonElement

      nameInput.value = 'My Query'
      nameInput.dispatchEvent(new Event('input'))
      saveBtn.click()

      expect(onSave).toHaveBeenCalledWith('My Query', null)
    })

    it('should call onSave with name and folderId when folder selected', async () => {
      const onSave = vi.fn().mockResolvedValue(undefined)
      const form = createCaptureForm({ onSave, onCancel: vi.fn() })
      const nameInput = form.querySelector('.js-query-name') as HTMLInputElement
      const dropdown = form.querySelector('.js-folder-select') as HTMLSelectElement
      const saveBtn = form.querySelector('.js-save-btn') as HTMLButtonElement

      // Add a folder option
      const option = document.createElement('option')
      option.value = 'folder-123'
      option.textContent = 'Work Queries'
      dropdown.appendChild(option)
      dropdown.value = 'folder-123'

      nameInput.value = 'My Query'
      nameInput.dispatchEvent(new Event('input'))
      saveBtn.click()

      expect(onSave).toHaveBeenCalledWith('My Query', 'folder-123')
    })

    it('should trim whitespace from name', async () => {
      const onSave = vi.fn().mockResolvedValue(undefined)
      const form = createCaptureForm({ onSave, onCancel: vi.fn() })
      const nameInput = form.querySelector('.js-query-name') as HTMLInputElement
      const saveBtn = form.querySelector('.js-save-btn') as HTMLButtonElement

      nameInput.value = '  My Query  '
      nameInput.dispatchEvent(new Event('input'))
      saveBtn.click()

      expect(onSave).toHaveBeenCalledWith('My Query', null)
    })

    it('should show loading state on Save button during save', async () => {
      let resolvePromise: () => void
      const onSave = vi.fn().mockReturnValue(new Promise<void>((resolve) => {
        resolvePromise = resolve
      }))
      const form = createCaptureForm({ onSave, onCancel: vi.fn() })
      const nameInput = form.querySelector('.js-query-name') as HTMLInputElement
      const saveBtn = form.querySelector('.js-save-btn') as HTMLButtonElement

      nameInput.value = 'My Query'
      nameInput.dispatchEvent(new Event('input'))
      saveBtn.click()

      expect(saveBtn.classList.contains('btn--loading')).toBe(true)
      expect(saveBtn.disabled).toBe(true)

      resolvePromise!()
      await vi.waitFor(() => {
        expect(saveBtn.classList.contains('btn--loading')).toBe(false)
      })
    })
  })

  describe('form visibility', () => {
    const defaultOptions: CaptureFormOptions = {
      onSave: vi.fn(),
      onCancel: vi.fn(),
    }

    it('should be hidden by default', () => {
      const form = createCaptureForm(defaultOptions)

      expect(form.hidden).toBe(true)
      expect(form.classList.contains('capture-form--visible')).toBe(false)
    })

    it('should show when showCaptureForm called', () => {
      const form = createCaptureForm(defaultOptions)

      showCaptureForm(form)

      expect(form.hidden).toBe(false)
      expect(form.classList.contains('capture-form--visible')).toBe(true)
    })

    it('should hide when hideCaptureForm called', () => {
      const form = createCaptureForm(defaultOptions)
      showCaptureForm(form)

      hideCaptureForm(form)

      expect(form.hidden).toBe(true)
      expect(form.classList.contains('capture-form--visible')).toBe(false)
    })

    it('should focus name input when shown', () => {
      const form = createCaptureForm(defaultOptions)
      document.body.appendChild(form)
      const nameInput = form.querySelector('.js-query-name') as HTMLInputElement

      showCaptureForm(form)

      expect(document.activeElement).toBe(nameInput)
    })

    it('should reset form state when hidden', () => {
      const form = createCaptureForm(defaultOptions)
      const nameInput = form.querySelector('.js-query-name') as HTMLInputElement
      const errorSpan = form.querySelector('.js-name-error') as HTMLSpanElement

      // Set up some state
      nameInput.value = 'Some Query'
      nameInput.classList.add('capture-form__input--error')
      errorSpan.hidden = false

      hideCaptureForm(form)

      expect(nameInput.value).toBe('')
      expect(nameInput.classList.contains('capture-form__input--error')).toBe(false)
      expect(errorSpan.hidden).toBe(true)
    })

    it('should reset folder dropdown when hidden', () => {
      const form = createCaptureForm(defaultOptions)
      const dropdown = form.querySelector('.js-folder-select') as HTMLSelectElement

      // Add and select a folder
      const option = document.createElement('option')
      option.value = 'folder-123'
      dropdown.appendChild(option)
      dropdown.value = 'folder-123'

      hideCaptureForm(form)

      expect(dropdown.value).toBe('')
    })

    it('should reset form error when hidden', () => {
      const form = createCaptureForm(defaultOptions)
      const formError = form.querySelector('.js-form-error') as HTMLElement
      const showError = (form as any).__showError as (message: string) => void

      // Show an error first
      showError('Failed to save query')
      expect(formError.hidden).toBe(false)

      hideCaptureForm(form)

      expect(formError.hidden).toBe(true)
    })
  })

  describe('folder dropdown population', () => {
    const defaultOptions: CaptureFormOptions = {
      onSave: vi.fn(),
      onCancel: vi.fn(),
    }

    it('should populate dropdown with flat folder list (sorted alphabetically)', () => {
      const form = createCaptureForm(defaultOptions)
      const dropdown = form.querySelector('.js-folder-select') as HTMLSelectElement

      const folders: Folder[] = [
        { id: 'folder-1', name: 'Work', parentId: null },
        { id: 'folder-2', name: 'Personal', parentId: null },
      ]

      // Access the populateFolders method through the form's data
      const populateFolders = (form as any).__populateFolders as (folders: Folder[]) => void
      populateFolders(folders)

      // Folders are sorted alphabetically
      expect(dropdown.options.length).toBe(3) // "No folder" + 2 folders
      expect(dropdown.options[0].textContent).toBe('No folder')
      expect(dropdown.options[1].textContent).toBe('Personal')
      expect(dropdown.options[1].value).toBe('folder-2')
      expect(dropdown.options[2].textContent).toBe('Work')
      expect(dropdown.options[2].value).toBe('folder-1')
    })

    it('should show nested folders with indentation', () => {
      const form = createCaptureForm(defaultOptions)
      const dropdown = form.querySelector('.js-folder-select') as HTMLSelectElement

      const folders: Folder[] = [
        { id: 'folder-1', name: 'Work', parentId: null },
        { id: 'folder-2', name: 'Projects', parentId: 'folder-1' },
        { id: 'folder-3', name: 'Active', parentId: 'folder-2' },
      ]

      const populateFolders = (form as any).__populateFolders as (folders: Folder[]) => void
      populateFolders(folders)

      expect(dropdown.options.length).toBe(4) // "No folder" + 3 folders
      expect(dropdown.options[1].textContent).toBe('Work')
      expect(dropdown.options[2].textContent).toBe('— Projects')
      expect(dropdown.options[3].textContent).toBe('—— Active')
    })

    it('should sort folders alphabetically at each level', () => {
      const form = createCaptureForm(defaultOptions)
      const dropdown = form.querySelector('.js-folder-select') as HTMLSelectElement

      const folders: Folder[] = [
        { id: 'folder-1', name: 'Zebra', parentId: null },
        { id: 'folder-2', name: 'Alpha', parentId: null },
        { id: 'folder-3', name: 'Middle', parentId: null },
      ]

      const populateFolders = (form as any).__populateFolders as (folders: Folder[]) => void
      populateFolders(folders)

      expect(dropdown.options[1].textContent).toBe('Alpha')
      expect(dropdown.options[2].textContent).toBe('Middle')
      expect(dropdown.options[3].textContent).toBe('Zebra')
    })

    it('should handle empty folders array', () => {
      const form = createCaptureForm(defaultOptions)
      const dropdown = form.querySelector('.js-folder-select') as HTMLSelectElement

      const populateFolders = (form as any).__populateFolders as (folders: Folder[]) => void
      populateFolders([])

      expect(dropdown.options.length).toBe(1)
      expect(dropdown.options[0].textContent).toBe('No folder')
    })
  })

  describe('keyboard interaction', () => {
    const defaultOptions: CaptureFormOptions = {
      onSave: vi.fn(),
      onCancel: vi.fn(),
    }

    it('should trigger save on Enter key when name is valid', () => {
      const onSave = vi.fn().mockResolvedValue(undefined)
      const form = createCaptureForm({ ...defaultOptions, onSave })
      const nameInput = form.querySelector('.js-query-name') as HTMLInputElement

      nameInput.value = 'My Query'
      nameInput.dispatchEvent(new Event('input'))

      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' })
      nameInput.dispatchEvent(enterEvent)

      expect(onSave).toHaveBeenCalledWith('My Query', null)
    })

    it('should not trigger save on Enter when name is empty', () => {
      const onSave = vi.fn()
      const form = createCaptureForm({ ...defaultOptions, onSave })
      const nameInput = form.querySelector('.js-query-name') as HTMLInputElement

      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' })
      nameInput.dispatchEvent(enterEvent)

      expect(onSave).not.toHaveBeenCalled()
    })

    it('should call onCancel on Escape key', () => {
      const onCancel = vi.fn()
      const form = createCaptureForm({ ...defaultOptions, onCancel })
      document.body.appendChild(form)

      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })
      form.dispatchEvent(escapeEvent)

      expect(onCancel).toHaveBeenCalledTimes(1)
    })
  })

  describe('error display', () => {
    const defaultOptions: CaptureFormOptions = {
      onSave: vi.fn(),
      onCancel: vi.fn(),
    }

    it('should show form error message', () => {
      const form = createCaptureForm(defaultOptions)
      const showError = (form as any).__showError as (message: string) => void
      const formError = form.querySelector('.js-form-error') as HTMLElement

      showError('Failed to save query')

      expect(formError.hidden).toBe(false)
      expect(formError.textContent).toBe('Failed to save query')
    })

    it('should clear form error on successful input', () => {
      const form = createCaptureForm(defaultOptions)
      const showError = (form as any).__showError as (message: string) => void
      const formError = form.querySelector('.js-form-error') as HTMLElement
      const nameInput = form.querySelector('.js-query-name') as HTMLInputElement

      showError('Failed to save query')
      expect(formError.hidden).toBe(false)

      nameInput.value = 'New name'
      nameInput.dispatchEvent(new Event('input'))

      expect(formError.hidden).toBe(true)
    })
  })

  describe('cleanup', () => {
    const defaultOptions: CaptureFormOptions = {
      onSave: vi.fn(),
      onCancel: vi.fn(),
    }

    it('should expose destroy method for cleanup', () => {
      const form = createCaptureForm(defaultOptions)
      const destroy = (form as any).__destroy as () => void

      expect(typeof destroy).toBe('function')
    })

    it('should remove event listeners when destroy is called', () => {
      const onSave = vi.fn().mockResolvedValue(undefined)
      const onCancel = vi.fn()
      const form = createCaptureForm({ onSave, onCancel })
      const nameInput = form.querySelector('.js-query-name') as HTMLInputElement
      const saveBtn = form.querySelector('.js-save-btn') as HTMLButtonElement
      const cancelBtn = form.querySelector('.js-cancel-btn') as HTMLButtonElement
      const destroy = (form as any).__destroy as () => void

      // Call destroy
      destroy()

      // Verify events no longer fire
      nameInput.value = 'Test'
      nameInput.dispatchEvent(new Event('input'))
      saveBtn.click()
      cancelBtn.click()

      // onSave should not be called because listener was removed
      // Note: saveBtn click won't trigger onSave because input listener was removed
      // and save button remains disabled
      expect(onCancel).not.toHaveBeenCalled()
    })
  })
})
