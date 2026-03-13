// frontend/src/utils/sanitizeHtml.js
//
// Lightweight HTML sanitizer using the browser's DOMParser.
// Whitelists a safe subset of elements and attributes.
// No external dependencies.
//
// The HTML we're sanitizing comes from our own WordPress instance,
// so XSS risk is low — this is a belt-and-suspenders measure.
// If the source ever changes to user-generated input, swap in DOMPurify.

const ALLOWED_ELEMENTS = new Set([
  'strong', 'em', 'b', 'i',
  'a', 'span',
  'p', 'br',
  'ul', 'ol', 'li',
  'h1', 'h2', 'h3', 'h4',
]);

// Per-element allowed attributes. '*' key applies to all elements.
const ALLOWED_ATTRIBUTES = {
  '*':  ['class'],
  'a':  ['href', 'target', 'rel'],
};

/**
 * Sanitize an HTML string and return a safe HTML string.
 * Strips disallowed elements (keeping their text content) and
 * strips disallowed attributes. Forces all <a> tags to open in
 * a new tab with rel="noopener noreferrer".
 *
 * @param {string} dirty - Raw HTML string from the API
 * @returns {string} - Safe HTML string for use with dangerouslySetInnerHTML
 */
export function sanitizeHtml(dirty) {
  if (!dirty || typeof dirty !== 'string') return '';

  const parser = new DOMParser();
  const doc = parser.parseFromString(dirty, 'text/html');

  sanitizeNode(doc.body);

  return doc.body.innerHTML;
}

function sanitizeNode(node) {
  // Work on a static copy of childNodes since we may mutate the tree.
  const children = Array.from(node.childNodes);

  for (const child of children) {
    if (child.nodeType === Node.TEXT_NODE) {
      // Text nodes are always safe.
      continue;
    }

    if (child.nodeType === Node.ELEMENT_NODE) {
      const tag = child.tagName.toLowerCase();

      if (!ALLOWED_ELEMENTS.has(tag)) {
        // Disallowed element — replace with its children (keep text content).
        while (child.firstChild) {
          node.insertBefore(child.firstChild, child);
        }
        node.removeChild(child);
        continue;
      }

      // Strip disallowed attributes.
      const attrsToRemove = [];
      for (const attr of Array.from(child.attributes)) {
        const globalAllowed = ALLOWED_ATTRIBUTES['*'] || [];
        const tagAllowed    = ALLOWED_ATTRIBUTES[tag]  || [];
        if (!globalAllowed.includes(attr.name) && !tagAllowed.includes(attr.name)) {
          attrsToRemove.push(attr.name);
        }
      }
      for (const attr of attrsToRemove) {
        child.removeAttribute(attr);
      }

      // Force all links to open in a new tab safely.
      if (tag === 'a') {
        child.setAttribute('target', '_blank');
        child.setAttribute('rel',    'noopener noreferrer');
      }

      // Recurse into allowed children.
      sanitizeNode(child);
    } else {
      // Remove comments, processing instructions, etc.
      node.removeChild(child);
    }
  }
}