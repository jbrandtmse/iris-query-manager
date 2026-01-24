import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { generateExportFilename, downloadJsonFile } from './file-utils'

describe('file-utils', () => {
  describe('generateExportFilename', () => {
    it('should generate filename with current date in YYYY-MM-DD format', () => {
      // Mock Date to control output
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-01-23T15:30:00.000Z'))

      const filename = generateExportFilename()

      expect(filename).toBe('query-manager-export-2026-01-23.json')

      vi.useRealTimers()
    })

    it('should include "query-manager-export" prefix', () => {
      const filename = generateExportFilename()

      expect(filename).toContain('query-manager-export')
    })

    it('should end with .json extension', () => {
      const filename = generateExportFilename()

      expect(filename).toMatch(/\.json$/)
    })

    it('should match expected pattern', () => {
      const filename = generateExportFilename()

      // Pattern: query-manager-export-YYYY-MM-DD.json
      expect(filename).toMatch(/^query-manager-export-\d{4}-\d{2}-\d{2}\.json$/)
    })
  })

  describe('downloadJsonFile', () => {
    let mockAnchor: {
      href: string
      download: string
      style: { display: string }
      click: ReturnType<typeof vi.fn>
    }
    let mockAppendChild: ReturnType<typeof vi.fn>
    let mockRemoveChild: ReturnType<typeof vi.fn>
    let mockCreateObjectURL: ReturnType<typeof vi.fn>
    let mockRevokeObjectURL: ReturnType<typeof vi.fn>
    let capturedBlobContent: string | undefined
    let capturedBlobType: string | undefined

    beforeEach(() => {
      // Mock anchor element
      mockAnchor = {
        href: '',
        download: '',
        style: { display: '' },
        click: vi.fn(),
      }

      // Mock document.createElement
      vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor as unknown as HTMLElement)

      // Mock document.body.appendChild/removeChild
      mockAppendChild = vi.fn()
      mockRemoveChild = vi.fn()
      vi.spyOn(document.body, 'appendChild').mockImplementation(mockAppendChild as unknown as (node: Node) => Node)
      vi.spyOn(document.body, 'removeChild').mockImplementation(mockRemoveChild as unknown as (child: Node) => Node)

      // Mock URL.createObjectURL/revokeObjectURL
      mockCreateObjectURL = vi.fn().mockReturnValue('blob:test-url')
      mockRevokeObjectURL = vi.fn()
      vi.stubGlobal('URL', {
        createObjectURL: mockCreateObjectURL,
        revokeObjectURL: mockRevokeObjectURL,
      })

      // Capture Blob content for verification
      capturedBlobContent = undefined
      capturedBlobType = undefined
      vi.stubGlobal('Blob', class MockBlob {
        constructor(content: string[], options: { type: string }) {
          capturedBlobContent = content[0]
          capturedBlobType = options.type
        }
      })
    })

    afterEach(() => {
      vi.restoreAllMocks()
      vi.unstubAllGlobals()
    })

    it('should create Blob with application/json MIME type', () => {
      const data = { test: 'data' }

      downloadJsonFile(data, 'test.json')

      expect(capturedBlobType).toBe('application/json')
    })

    it('should call JSON.stringify with pretty-print formatting', () => {
      const data = { key: 'value', nested: { a: 1 } }

      downloadJsonFile(data, 'test.json')

      // Verify pretty-printed (2-space indentation)
      const expected = JSON.stringify(data, null, 2)
      expect(capturedBlobContent).toBe(expected)
    })

    it('should create and click anchor element', () => {
      const data = { test: 'data' }

      downloadJsonFile(data, 'test-file.json')

      expect(document.createElement).toHaveBeenCalledWith('a')
      expect(mockAnchor.download).toBe('test-file.json')
      expect(mockAnchor.href).toBe('blob:test-url')
      expect(mockAnchor.click).toHaveBeenCalled()
    })

    it('should cleanup URL.createObjectURL after download', () => {
      const data = { test: 'data' }

      downloadJsonFile(data, 'test.json')

      expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:test-url')
    })

    it('should append anchor to body and remove after click', () => {
      const data = { test: 'data' }

      downloadJsonFile(data, 'test.json')

      expect(mockAppendChild).toHaveBeenCalledWith(mockAnchor)
      expect(mockRemoveChild).toHaveBeenCalledWith(mockAnchor)
    })

    it('should hide anchor element', () => {
      const data = { test: 'data' }

      downloadJsonFile(data, 'test.json')

      expect(mockAnchor.style.display).toBe('none')
    })
  })
})
