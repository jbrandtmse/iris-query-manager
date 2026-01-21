/**
 * URL utility functions for SMP detection
 */

// SMP SQL page URL pattern (URL-encoded)
export const SMP_URL_PATTERN = '%25CSP.UI.Portal.SQL.Home.zen'

/**
 * Check if a URL matches the SMP SQL page pattern
 * @param url - The URL to check
 * @returns true if the URL contains the SMP pattern
 */
export function isSmpUrl(url: string): boolean {
  return url.includes(SMP_URL_PATTERN)
}
