export { htmlToPlainText } from './rich-text';
import { htmlToPlainText } from './rich-text';

/**
 * Return a plain-text preview of Quill HTML, truncated at a word boundary.
 * Appends an ellipsis when the content is longer than maxLength.
 */
export function getPreviewText(html?: string, maxLength = 150): string {
  const text = htmlToPlainText(html);
  if (text.length <= maxLength) return text;
  // Trim back to the last complete word so we don't cut mid-word
  const trimmed = text.slice(0, maxLength).replace(/\s+\S*$/, '');
  return trimmed + '…';
}
