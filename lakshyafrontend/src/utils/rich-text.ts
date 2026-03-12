/**
 * Rich-text helpers for handling Quill HTML output throughout the Job Seeker UI.
 *
 * htmlToPlainText  – strip tags → clean snippet for cards / previews
 * arrayToHtmlList  – convert legacy string[] → <ul><li>...</li></ul>
 * normalizeRichContent – accept either format and return an HTML string
 */

/**
 * Strip HTML tags and return trimmed plain text.
 * Uses the browser's DOMParser so tag-stripping is 100% accurate.
 * Falls back to a simple regex on non-browser environments.
 */
export function htmlToPlainText(html?: string): string {
  if (!html) return '';
  if (typeof window === 'undefined') {
    return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  }
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent?.replace(/\s+/g, ' ').trim() || '';
}

/**
 * Convert a plain-text string array (legacy DB format) into an HTML unordered list.
 */
export function arrayToHtmlList(items?: string[]): string {
  if (!items || items.length === 0) return '';
  return `<ul>${items.map(item => `<li>${item}</li>`).join('')}</ul>`;
}

/**
 * Normalise job content that may arrive as either:
 *   - string   (Quill HTML)           → return as-is
 *   - string[] (legacy plain-text)    → convert to <ul><li> HTML
 *   - undefined / empty               → return ""
 */
export function normalizeRichContent(content: string | string[] | undefined): string {
  if (!content) return '';
  if (Array.isArray(content)) return arrayToHtmlList(content);
  return content;
}
