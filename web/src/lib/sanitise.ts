/**
 * Input sanitisation — two independent layers:
 *   1. sanitisePlainText()  — strip all HTML before writing to DB
 *   2. escapeHtml()         — escape before {@html} rendering (belt + suspenders)
 *
 * No external dependency — pure string transforms that work in Workers runtime.
 */

const HTML_TAG_RE   = /<[^>]*>/g;
const ENTITY_MAP: Record<string, string> = {
  '&lt;':   '<',
  '&gt;':   '>',
  '&amp;':  '&',
  '&quot;': '"',
  '&#x27;': "'",
  '&#39;':  "'",
};

/** Strip all HTML tags and decode common entities.  Use for annotation bodies, bios, comments. */
export function sanitisePlainText(input: string): string {
  if (!input?.trim()) return '';
  return input
    .trim()
    .replace(HTML_TAG_RE, '')                               // remove all tags
    .replace(/&(?:lt|gt|amp|quot|#x27|#39);/g, m => ENTITY_MAP[m] ?? m) // decode entities
    .slice(0, 2000);                                        // hard length cap
}

/** HTML-escape a string for safe injection into {@html} blocks. */
export function escapeHtml(s: string): string {
  return s
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&#x27;');
}
