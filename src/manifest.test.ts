import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// Test against the built manifest.json to avoid esbuild issues in jsdom
// Run `npm run build` before running these tests
describe('Manifest Configuration (built output)', () => {
  let manifest: Record<string, unknown>

  try {
    const manifestPath = resolve(__dirname, '../build/manifest.json')
    manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'))
  } catch {
    // Build output may not exist during initial test runs
    manifest = {}
  }

  describe('AC #1: Basic metadata', () => {
    it('should have manifest_version 3', () => {
      expect(manifest.manifest_version).toBe(3)
    })

    it('should have name "IRIS Query Manager"', () => {
      expect(manifest.name).toBe('IRIS Query Manager')
    })

    it('should have version "1.0.0"', () => {
      expect(manifest.version).toBe('1.0.0')
    })
  })

  describe('AC #2: Minimal permissions', () => {
    it('should have exactly storage and activeTab permissions', () => {
      expect(manifest.permissions).toEqual(['storage', 'activeTab'])
    })
  })

  describe('AC #3: SMP host_permissions', () => {
    it('should have SMP URL pattern in host_permissions', () => {
      expect(manifest.host_permissions).toContain(
        '*://*/%25CSP.UI.Portal.SQL.Home.zen*'
      )
    })

    it('should have exactly one host_permission', () => {
      expect(manifest.host_permissions).toHaveLength(1)
    })
  })

  describe('AC #4: Service worker configuration', () => {
    it('should have service_worker configured', () => {
      const background = manifest.background as Record<string, unknown> | undefined
      expect(background?.service_worker).toBeDefined()
    })

    it('should have type module', () => {
      const background = manifest.background as Record<string, unknown> | undefined
      expect(background?.type).toBe('module')
    })
  })
})
