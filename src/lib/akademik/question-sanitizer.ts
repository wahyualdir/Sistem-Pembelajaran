/**
 * Pembersih HTML untuk Butir Soal & Bank Soal SIAJAR
 * Mencegah XSS, skrip berbahaya, dan atribut event berbahaya.
 */

const ALLOWED_TAGS = new Set([
  'p', 'br', 'b', 'strong', 'i', 'em', 'u', 's', 'strike',
  'sub', 'sup', 'code', 'pre', 'ul', 'ol', 'li', 'blockquote',
  'table', 'thead', 'tbody', 'tr', 'th', 'td', 'img', 'span', 'div',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hr'
]);

const ALLOWED_ATTRS = new Set([
  'src', 'alt', 'title', 'class', 'width', 'height', 'style', 'align', 'colspan', 'rowspan'
]);

export function sanitizeQuestionHtml(html: any): string {
  if (!html) return '';
  const str = typeof html === 'string' ? html : typeof html === 'object' && html?.text ? String(html.text) : String(html);
  if (!str.trim()) return '';

  // 1. Buang tag script, iframe, object, embed, style, applet, form, input
  let cleaned = str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  cleaned = cleaned.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
  cleaned = cleaned.replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '');
  cleaned = cleaned.replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '');
  cleaned = cleaned.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  cleaned = cleaned.replace(/<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi, '');

  // 2. Buang semua event handler on* (seperti onclick, onerror, onload, onmouseover)
  cleaned = cleaned.replace(/\s+on[a-z]+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi, '');

  // 3. Buang javascript: URLs di src atau href
  cleaned = cleaned.replace(/\s+(?:src|href)\s*=\s*(?:['"]\s*javascript:[^'"]*['"]|javascript:[^\s>]+)/gi, '');

  // 4. Filter tag dengan regex whitelist
  cleaned = cleaned.replace(/<\/?([a-z0-9_-]+)([^>]*)>/gi, (match, tagName, attrs) => {
    const lowerTag = tagName.toLowerCase();
    if (!ALLOWED_TAGS.has(lowerTag)) {
      return ''; // Strip tag yang tidak diperbolehkan
    }

    if (match.startsWith('</')) {
      return `</${lowerTag}>`;
    }

    // Bersihkan atribut
    const cleanAttrs: string[] = [];
    const attrRegex = /([a-z0-9_-]+)(?:\s*=\s*(?:'([^']*)'|"([^"]*)"|([^\s>]+)))?/gi;
    let attrMatch;

    while ((attrMatch = attrRegex.exec(attrs)) !== null) {
      const attrName = attrMatch[1].toLowerCase();
      const attrVal = attrMatch[2] ?? attrMatch[3] ?? attrMatch[4] ?? '';

      if (ALLOWED_ATTRS.has(attrName)) {
        // Cegah javascript di style
        if (attrName === 'style' && /expression|javascript:|behavior/i.test(attrVal)) {
          continue;
        }
        cleanAttrs.push(`${attrName}="${attrVal.replace(/"/g, '&quot;')}"`);
      }
    }

    return `<${lowerTag}${cleanAttrs.length > 0 ? ' ' + cleanAttrs.join(' ') : ''}>`;
  });

  return cleaned.trim();
}

/**
 * Normalisasi teks soal untuk deteksi duplikat dengan hash sederhana
 */
export function normalizeQuestionText(text: any): string {
  if (!text) return '';
  const str = typeof text === 'string' ? text : typeof text === 'object' && text?.text ? String(text.text) : String(text);
  return str
    .toLowerCase()
    .replace(/<[^>]+>/g, ' ')
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function computeQuestionHash(text: string): string {
  const norm = normalizeQuestionText(text);
  let hash = 0;
  for (let i = 0; i < norm.length; i++) {
    const char = norm.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return hash.toString(16);
}
