import { describe, it, expect } from 'vitest'
import {
  detectDestructiveKeywords,
  DANGER_KEYWORDS,
  CAUTION_KEYWORDS,
} from './sql-detection-service'
import type { DestructiveKeyword, SqlDetectionResult, Severity } from './sql-detection-service'

describe('sql-detection-service', () => {
  describe('detectDestructiveKeywords', () => {
    // AC1: Given the SQL detection service When I pass a query containing DELETE
    // Then it returns { isDestructive: true, keywords: ['DELETE'], severity: 'danger' }
    describe('DELETE detection (AC1, AC2)', () => {
      it('should detect DELETE keyword and return danger severity', () => {
        const result = detectDestructiveKeywords('DELETE FROM users WHERE id = 1')

        expect(result.isDestructive).toBe(true)
        expect(result.keywords).toContain('DELETE')
        expect(result.severity).toBe('danger')
      })

      it('should detect DELETE in lower case', () => {
        const result = detectDestructiveKeywords('delete from users where id = 1')

        expect(result.isDestructive).toBe(true)
        expect(result.keywords).toContain('DELETE')
      })

      it('should detect DELETE in mixed case', () => {
        const result = detectDestructiveKeywords('Delete From users Where id = 1')

        expect(result.isDestructive).toBe(true)
        expect(result.keywords).toContain('DELETE')
      })
    })

    // AC2: Given destructive keyword detection When checking for keywords
    // Then it detects: DELETE, DROP, TRUNCATE, UPDATE, ALTER, INSERT
    describe('DROP detection (AC2)', () => {
      it('should detect DROP TABLE', () => {
        const result = detectDestructiveKeywords('DROP TABLE IF EXISTS temp_data')

        expect(result.isDestructive).toBe(true)
        expect(result.keywords).toContain('DROP')
        expect(result.severity).toBe('danger')
      })

      it('should detect DROP INDEX', () => {
        const result = detectDestructiveKeywords('DROP INDEX idx_users_email')

        expect(result.isDestructive).toBe(true)
        expect(result.keywords).toContain('DROP')
      })

      it('should detect drop in lowercase', () => {
        const result = detectDestructiveKeywords('drop table if exists temp_data')

        expect(result.isDestructive).toBe(true)
        expect(result.keywords).toContain('DROP')
      })
    })

    describe('TRUNCATE detection (AC2)', () => {
      it('should detect TRUNCATE', () => {
        const result = detectDestructiveKeywords('TRUNCATE TABLE audit_logs')

        expect(result.isDestructive).toBe(true)
        expect(result.keywords).toContain('TRUNCATE')
        expect(result.severity).toBe('danger')
      })

      it('should detect truncate in lowercase', () => {
        const result = detectDestructiveKeywords('truncate table audit_logs')

        expect(result.isDestructive).toBe(true)
        expect(result.keywords).toContain('TRUNCATE')
      })
    })

    describe('UPDATE detection (AC2)', () => {
      it('should detect UPDATE', () => {
        const result = detectDestructiveKeywords('UPDATE users SET name = "test" WHERE id = 1')

        expect(result.isDestructive).toBe(true)
        expect(result.keywords).toContain('UPDATE')
        expect(result.severity).toBe('caution')
      })

      it('should detect update in lowercase', () => {
        const result = detectDestructiveKeywords('update users set name = "test"')

        expect(result.isDestructive).toBe(true)
        expect(result.keywords).toContain('UPDATE')
      })
    })

    describe('ALTER detection (AC2)', () => {
      it('should detect ALTER TABLE', () => {
        const result = detectDestructiveKeywords('ALTER TABLE users ADD COLUMN email VARCHAR(255)')

        expect(result.isDestructive).toBe(true)
        expect(result.keywords).toContain('ALTER')
        expect(result.severity).toBe('caution')
      })

      it('should detect alter in lowercase', () => {
        const result = detectDestructiveKeywords('alter table users add column email varchar(255)')

        expect(result.isDestructive).toBe(true)
        expect(result.keywords).toContain('ALTER')
      })
    })

    describe('INSERT detection (AC2)', () => {
      it('should detect INSERT INTO', () => {
        const result = detectDestructiveKeywords('INSERT INTO users (name) VALUES ("test")')

        expect(result.isDestructive).toBe(true)
        expect(result.keywords).toContain('INSERT')
        expect(result.severity).toBe('caution')
      })

      it('should detect insert in lowercase', () => {
        const result = detectDestructiveKeywords('insert into users (name) values ("test")')

        expect(result.isDestructive).toBe(true)
        expect(result.keywords).toContain('INSERT')
      })
    })

    // AC3: Given keyword matching When checking case variations
    // Then detection is case-insensitive
    describe('case insensitivity (AC3)', () => {
      it('should detect UPPERCASE keywords', () => {
        const result = detectDestructiveKeywords('DELETE FROM users')
        expect(result.isDestructive).toBe(true)
        expect(result.keywords).toContain('DELETE')
      })

      it('should detect lowercase keywords', () => {
        const result = detectDestructiveKeywords('delete from users')
        expect(result.isDestructive).toBe(true)
        expect(result.keywords).toContain('DELETE')
      })

      it('should detect MixedCase keywords', () => {
        const result = detectDestructiveKeywords('Delete From users')
        expect(result.isDestructive).toBe(true)
        expect(result.keywords).toContain('DELETE')
      })

      it('should normalize all detected keywords to uppercase', () => {
        const result = detectDestructiveKeywords('delete from users; insert into archive')
        expect(result.keywords).toContain('DELETE')
        expect(result.keywords).toContain('INSERT')
        // All keywords should be uppercase
        result.keywords.forEach((keyword) => {
          expect(keyword).toBe(keyword.toUpperCase())
        })
      })
    })

    // AC4: Given keyword matching When checking for false positives
    // Then it uses word boundaries
    describe('word boundary enforcement (AC4)', () => {
      it('should NOT match DELETED_FLAG (contains DELETE but not word boundary)', () => {
        const result = detectDestructiveKeywords('SELECT * FROM logs WHERE DELETED_FLAG = 1')

        expect(result.isDestructive).toBe(false)
        expect(result.keywords).toEqual([])
        expect(result.severity).toBe('none')
      })

      it('should NOT match DROPDOWN (contains DROP but not word boundary)', () => {
        const result = detectDestructiveKeywords('SELECT * FROM DROPDOWN_OPTIONS')

        expect(result.isDestructive).toBe(false)
        expect(result.keywords).toEqual([])
      })

      it('should NOT match ALTERATIONS (contains ALTER but not word boundary)', () => {
        const result = detectDestructiveKeywords('SELECT * FROM ALTERATIONS_LOG')

        expect(result.isDestructive).toBe(false)
        expect(result.keywords).toEqual([])
      })

      it('should NOT match INSERTS_LOG (contains INSERT but not word boundary)', () => {
        const result = detectDestructiveKeywords('SELECT * FROM INSERTS_LOG')

        expect(result.isDestructive).toBe(false)
        expect(result.keywords).toEqual([])
      })

      it('should NOT match UPDATED_AT (contains UPDATE but not word boundary)', () => {
        const result = detectDestructiveKeywords('SELECT UPDATED_AT FROM users')

        expect(result.isDestructive).toBe(false)
        expect(result.keywords).toEqual([])
      })

      it('should NOT match TRUNCATED (contains TRUNCATE but not word boundary)', () => {
        const result = detectDestructiveKeywords('SELECT TRUNCATED_VALUE FROM data')

        expect(result.isDestructive).toBe(false)
        expect(result.keywords).toEqual([])
      })

      it('should match DELETE as standalone keyword', () => {
        const result = detectDestructiveKeywords('DELETE FROM users')

        expect(result.isDestructive).toBe(true)
        expect(result.keywords).toContain('DELETE')
      })

      it('should match keyword surrounded by whitespace', () => {
        const result = detectDestructiveKeywords('   DELETE   FROM users')

        expect(result.isDestructive).toBe(true)
        expect(result.keywords).toContain('DELETE')
      })

      it('should match keyword at start of string', () => {
        const result = detectDestructiveKeywords('DELETE FROM users WHERE id = 1')

        expect(result.isDestructive).toBe(true)
      })

      it('should match keyword at end of string (edge case)', () => {
        const result = detectDestructiveKeywords('/* comment */ DELETE')

        expect(result.isDestructive).toBe(true)
        expect(result.keywords).toContain('DELETE')
      })
    })

    // Test multiple keywords in single query
    describe('multiple keywords detection', () => {
      it('should detect multiple different keywords', () => {
        const result = detectDestructiveKeywords(
          'DELETE FROM old; INSERT INTO archive SELECT * FROM old'
        )

        expect(result.isDestructive).toBe(true)
        expect(result.keywords).toContain('DELETE')
        expect(result.keywords).toContain('INSERT')
        expect(result.keywords.length).toBe(2)
      })

      it('should deduplicate same keyword appearing multiple times', () => {
        const result = detectDestructiveKeywords(
          'DELETE FROM users WHERE id = 1; DELETE FROM logs WHERE user_id = 1'
        )

        expect(result.isDestructive).toBe(true)
        expect(result.keywords).toEqual(['DELETE'])
        expect(result.keywords.length).toBe(1)
      })

      it('should detect all six keywords in complex query', () => {
        const result = detectDestructiveKeywords(
          'DELETE FROM old; DROP TABLE temp; TRUNCATE audit; UPDATE users SET x=1; ALTER TABLE t ADD col; INSERT INTO log'
        )

        expect(result.isDestructive).toBe(true)
        expect(result.keywords).toContain('DELETE')
        expect(result.keywords).toContain('DROP')
        expect(result.keywords).toContain('TRUNCATE')
        expect(result.keywords).toContain('UPDATE')
        expect(result.keywords).toContain('ALTER')
        expect(result.keywords).toContain('INSERT')
        expect(result.keywords.length).toBe(6)
      })
    })

    // Severity calculation (highest severity wins)
    describe('severity calculation', () => {
      it('should return danger when only danger keywords present', () => {
        const result = detectDestructiveKeywords('DELETE FROM users')
        expect(result.severity).toBe('danger')
      })

      it('should return caution when only caution keywords present', () => {
        const result = detectDestructiveKeywords('UPDATE users SET name = "test"')
        expect(result.severity).toBe('caution')
      })

      it('should return danger when both danger and caution keywords present (danger wins)', () => {
        const result = detectDestructiveKeywords('DELETE FROM old; INSERT INTO archive')

        expect(result.severity).toBe('danger')
      })

      it('should return danger for DROP (danger keyword)', () => {
        const result = detectDestructiveKeywords('DROP TABLE temp')
        expect(result.severity).toBe('danger')
      })

      it('should return danger for TRUNCATE (danger keyword)', () => {
        const result = detectDestructiveKeywords('TRUNCATE TABLE logs')
        expect(result.severity).toBe('danger')
      })

      it('should return caution for ALTER (caution keyword)', () => {
        const result = detectDestructiveKeywords('ALTER TABLE users ADD COLUMN email')
        expect(result.severity).toBe('caution')
      })

      it('should return caution for INSERT (caution keyword)', () => {
        const result = detectDestructiveKeywords('INSERT INTO users VALUES (1)')
        expect(result.severity).toBe('caution')
      })
    })

    // Safe SELECT queries
    describe('safe queries (no destructive keywords)', () => {
      it('should return safe result for SELECT query', () => {
        const result = detectDestructiveKeywords('SELECT * FROM users WHERE id = 1')

        expect(result.isDestructive).toBe(false)
        expect(result.keywords).toEqual([])
        expect(result.severity).toBe('none')
      })

      it('should return safe result for complex SELECT with JOINs', () => {
        const result = detectDestructiveKeywords(`
          SELECT u.name, o.total
          FROM users u
          INNER JOIN orders o ON u.id = o.user_id
          WHERE o.created_at > '2026-01-01'
        `)

        expect(result.isDestructive).toBe(false)
        expect(result.keywords).toEqual([])
        expect(result.severity).toBe('none')
      })

      it('should return safe result for SELECT with subquery', () => {
        const result = detectDestructiveKeywords(
          'SELECT * FROM users WHERE id IN (SELECT user_id FROM orders)'
        )

        expect(result.isDestructive).toBe(false)
      })
    })

    // Edge cases
    describe('edge cases', () => {
      it('should handle empty string', () => {
        const result = detectDestructiveKeywords('')

        expect(result.isDestructive).toBe(false)
        expect(result.keywords).toEqual([])
        expect(result.severity).toBe('none')
      })

      it('should handle whitespace-only string', () => {
        const result = detectDestructiveKeywords('   \t\n   ')

        expect(result.isDestructive).toBe(false)
        expect(result.keywords).toEqual([])
        expect(result.severity).toBe('none')
      })

      it('should handle null input gracefully', () => {
        const result = detectDestructiveKeywords(null as unknown as string)

        expect(result.isDestructive).toBe(false)
        expect(result.keywords).toEqual([])
        expect(result.severity).toBe('none')
      })

      it('should handle undefined input gracefully', () => {
        const result = detectDestructiveKeywords(undefined as unknown as string)

        expect(result.isDestructive).toBe(false)
        expect(result.keywords).toEqual([])
        expect(result.severity).toBe('none')
      })
    })

    // SQL with comments (conservative approach - still detect keywords)
    describe('SQL with comments', () => {
      it('should detect keyword inside single-line comment (conservative)', () => {
        const result = detectDestructiveKeywords('-- DELETE FROM users\nSELECT * FROM users')

        // Conservative approach: still detect DELETE in comment
        expect(result.isDestructive).toBe(true)
        expect(result.keywords).toContain('DELETE')
      })

      it('should detect keyword inside multi-line comment (conservative)', () => {
        const result = detectDestructiveKeywords('/* DROP TABLE users */ SELECT * FROM users')

        // Conservative approach: still detect DROP in comment
        expect(result.isDestructive).toBe(true)
        expect(result.keywords).toContain('DROP')
      })

      it('should detect keyword both in comment and active code', () => {
        const result = detectDestructiveKeywords('-- old: DELETE FROM users\nDELETE FROM users')

        expect(result.isDestructive).toBe(true)
        expect(result.keywords).toContain('DELETE')
        // Should be deduplicated
        expect(result.keywords.length).toBe(1)
      })
    })

    // Verify exported constants
    describe('exported constants', () => {
      it('should export DANGER_KEYWORDS with correct values', () => {
        expect(DANGER_KEYWORDS).toContain('DELETE')
        expect(DANGER_KEYWORDS).toContain('DROP')
        expect(DANGER_KEYWORDS).toContain('TRUNCATE')
        expect(DANGER_KEYWORDS.length).toBe(3)
      })

      it('should export CAUTION_KEYWORDS with correct values', () => {
        expect(CAUTION_KEYWORDS).toContain('UPDATE')
        expect(CAUTION_KEYWORDS).toContain('ALTER')
        expect(CAUTION_KEYWORDS).toContain('INSERT')
        expect(CAUTION_KEYWORDS.length).toBe(3)
      })
    })

    // Verify type exports are accessible
    describe('type exports', () => {
      it('should export Severity type with correct values', () => {
        // Type assertion verifies Severity type is exported and usable
        const noneSeverity: Severity = 'none'
        const cautionSeverity: Severity = 'caution'
        const dangerSeverity: Severity = 'danger'

        expect(noneSeverity).toBe('none')
        expect(cautionSeverity).toBe('caution')
        expect(dangerSeverity).toBe('danger')
      })

      it('should export DestructiveKeyword type with correct values', () => {
        const keywords: DestructiveKeyword[] = ['DELETE', 'DROP', 'TRUNCATE', 'UPDATE', 'ALTER', 'INSERT']
        expect(keywords.length).toBe(6)
      })

      it('should export SqlDetectionResult interface', () => {
        const result: SqlDetectionResult = {
          isDestructive: true,
          keywords: ['DELETE'],
          severity: 'danger',
        }
        expect(result.isDestructive).toBe(true)
        expect(result.keywords).toContain('DELETE')
        expect(result.severity).toBe('danger')
      })
    })

    // Additional edge case tests for non-string types
    describe('non-string input types', () => {
      it('should handle number input gracefully', () => {
        const result = detectDestructiveKeywords(123 as unknown as string)

        expect(result.isDestructive).toBe(false)
        expect(result.keywords).toEqual([])
        expect(result.severity).toBe('none')
      })

      it('should handle object input gracefully', () => {
        const result = detectDestructiveKeywords({ sql: 'DELETE' } as unknown as string)

        expect(result.isDestructive).toBe(false)
        expect(result.keywords).toEqual([])
        expect(result.severity).toBe('none')
      })

      it('should handle array input gracefully', () => {
        const result = detectDestructiveKeywords(['DELETE'] as unknown as string)

        expect(result.isDestructive).toBe(false)
        expect(result.keywords).toEqual([])
        expect(result.severity).toBe('none')
      })

      it('should handle boolean input gracefully', () => {
        const result = detectDestructiveKeywords(true as unknown as string)

        expect(result.isDestructive).toBe(false)
        expect(result.keywords).toEqual([])
        expect(result.severity).toBe('none')
      })
    })
  })
})
