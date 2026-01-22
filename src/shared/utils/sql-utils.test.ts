/**
 * SQL Utility Tests
 */

import { describe, it, expect } from 'vitest'
import { checkSqlSafety, getDangerousSqlWarning } from './sql-utils'

describe('sql-utils', () => {
  describe('checkSqlSafety', () => {
    it('should detect DELETE statement', () => {
      const result = checkSqlSafety('DELETE FROM users WHERE id = 1')
      expect(result.isDangerous).toBe(true)
      expect(result.keyword).toBe('DELETE')
    })

    it('should detect DROP statement', () => {
      const result = checkSqlSafety('DROP TABLE users')
      expect(result.isDangerous).toBe(true)
      expect(result.keyword).toBe('DROP')
    })

    it('should detect TRUNCATE statement', () => {
      const result = checkSqlSafety('TRUNCATE TABLE logs')
      expect(result.isDangerous).toBe(true)
      expect(result.keyword).toBe('TRUNCATE')
    })

    it('should detect UPDATE statement', () => {
      const result = checkSqlSafety('UPDATE users SET name = "test"')
      expect(result.isDangerous).toBe(true)
      expect(result.keyword).toBe('UPDATE')
    })

    it('should detect ALTER statement', () => {
      const result = checkSqlSafety('ALTER TABLE users ADD COLUMN email')
      expect(result.isDangerous).toBe(true)
      expect(result.keyword).toBe('ALTER')
    })

    it('should detect INSERT statement', () => {
      const result = checkSqlSafety('INSERT INTO users VALUES (1, "test")')
      expect(result.isDangerous).toBe(true)
      expect(result.keyword).toBe('INSERT')
    })

    it('should be case-insensitive', () => {
      expect(checkSqlSafety('delete from users').isDangerous).toBe(true)
      expect(checkSqlSafety('Delete From Users').isDangerous).toBe(true)
      expect(checkSqlSafety('DELETE FROM USERS').isDangerous).toBe(true)
    })

    it('should not flag safe SELECT queries', () => {
      const result = checkSqlSafety('SELECT * FROM users')
      expect(result.isDangerous).toBe(false)
      expect(result.keyword).toBeNull()
    })

    it('should not flag SELECT with WHERE clause', () => {
      const result = checkSqlSafety('SELECT id, name FROM users WHERE status = "active"')
      expect(result.isDangerous).toBe(false)
      expect(result.keyword).toBeNull()
    })

    it('should not flag SELECT with JOIN', () => {
      const result = checkSqlSafety('SELECT u.name FROM users u JOIN orders o ON u.id = o.user_id')
      expect(result.isDangerous).toBe(false)
      expect(result.keyword).toBeNull()
    })

    it('should not match keywords within strings (word boundary check)', () => {
      // "UPDATED_AT" contains "UPDATE" but should not match due to word boundary
      const result = checkSqlSafety('SELECT UPDATED_AT FROM users')
      expect(result.isDangerous).toBe(false)
    })

    it('should detect dangerous keyword in complex query', () => {
      const result = checkSqlSafety(`
        SELECT * FROM users;
        DELETE FROM logs WHERE date < '2020-01-01'
      `)
      expect(result.isDangerous).toBe(true)
      expect(result.keyword).toBe('DELETE')
    })

    it('should handle empty string', () => {
      const result = checkSqlSafety('')
      expect(result.isDangerous).toBe(false)
      expect(result.keyword).toBeNull()
    })

    it('should handle whitespace-only string', () => {
      const result = checkSqlSafety('   \n\t  ')
      expect(result.isDangerous).toBe(false)
      expect(result.keyword).toBeNull()
    })
  })

  describe('getDangerousSqlWarning', () => {
    it('should return warning message with keyword', () => {
      const warning = getDangerousSqlWarning('DELETE')
      expect(warning).toContain('DELETE')
      expect(warning).toContain('modify data')
    })

    it('should include action prompt', () => {
      const warning = getDangerousSqlWarning('DROP')
      expect(warning).toContain('Are you sure')
    })
  })
})
