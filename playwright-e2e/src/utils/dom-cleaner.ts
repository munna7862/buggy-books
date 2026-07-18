import { Page } from '@playwright/test';

/**
 * Capture and return a simplified accessibility snapshot of the page using the modern ARIA snapshot API.
 */
export async function getAccessibilityTree(page: Page): Promise<string> {
  return await page.locator('body').ariaSnapshot();
}

/**
 * Returns a highly-simplified HTML string representation of the current page DOM.
 * Strips out script, style, SVG path data, and non-interactive/empty layout containers.
 * Keeps attributes relevant for locators (id, class, data-testid, placeholder, roles, labels).
 */
export async function getCleanDom(page: Page): Promise<string> {
  return await page.evaluate(() => {
    interface CleanNode {
      type: 'element' | 'text';
      tagName?: string;
      attributes?: Record<string, string>;
      text?: string;
      children: CleanNode[];
    }

    function cleanNode(node: Node): CleanNode | null {
      // Handle text nodes
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent?.trim() || '';
        return text ? { type: 'text', text, children: [] } : null;
      }

      // Skip non-element nodes (comments, document types, etc.)
      if (node.nodeType !== Node.ELEMENT_NODE) {
        return null;
      }

      const el = node as HTMLElement;
      const tagName = el.tagName.toLowerCase();

      // Blacklist non-UI/overhead tags
      const tagBlacklist = ['script', 'style', 'noscript', 'iframe', 'head', 'link', 'meta'];
      if (tagBlacklist.includes(tagName)) {
        return null;
      }

      // Check visibility (skip elements that are hidden/zero size)
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      const isVisible = rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
      if (!isVisible) {
        return null;
      }

      // Extract attributes we care about for creating locators
      const attrs: Record<string, string> = {};
      const allowedAttrs = [
        'id', 'class', 'name', 'type', 'placeholder', 'value',
        'href', 'data-testid', 'data-qa', 'role',
        'aria-label', 'aria-expanded', 'aria-selected', 'disabled'
      ];

      for (const attr of allowedAttrs) {
        if (el.hasAttribute(attr)) {
          attrs[attr] = el.getAttribute(attr) || '';
        }
      }

      // Special case for SVG: strip paths, keep only structure and potential accessibility attributes
      if (tagName === 'svg') {
        const role = el.getAttribute('role') || 'img';
        const ariaLabel = el.getAttribute('aria-label') || '';
        const className = el.getAttribute('class') || '';
        return {
          type: 'element',
          tagName: 'svg',
          attributes: {
            ...(role ? { role } : {}),
            ...(ariaLabel ? { 'aria-label': ariaLabel } : {}),
            ...(className ? { class: className } : {})
          },
          children: []
        };
      }

      // Recursively clean child nodes
      const children: CleanNode[] = [];
      for (let i = 0; i < el.childNodes.length; i++) {
        const childVal = cleanNode(el.childNodes[i]);
        if (childVal) {
          children.push(childVal);
        }
      }

      // Filter out redundant containers to reduce token size.
      // A div or span with no relevant attributes, no text, and 0 or 1 children can be optimized/flattened.
      const isSemanticTag = ['button', 'input', 'select', 'textarea', 'a', 'form', 'table', 'tr', 'td', 'th', 'label', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li'].includes(tagName);
      const hasSemanticAttr = attrs.id || attrs['data-testid'] || attrs['data-qa'] || attrs.role || attrs.name || attrs.placeholder;

      if ((tagName === 'div' || tagName === 'span') && !hasSemanticAttr) {
        if (children.length === 0) {
          return null;
        }
        // If it only wraps a single element, bypass the wrapper
        if (children.length === 1 && children[0].type === 'element') {
          return children[0];
        }
      }

      return {
        type: 'element',
        tagName,
        attributes: attrs,
        children
      };
    }

    function serializeToHtml(node: CleanNode): string {
      if (node.type === 'text') {
        return (node.text || '')
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
      }

      const attrStr = Object.entries(node.attributes || {})
        .map(([k, v]) => ` ${k}="${v}"`)
        .join('');

      const childrenStr = node.children
        .map(c => serializeToHtml(c))
        .join('');

      return `<${node.tagName}${attrStr}>${childrenStr}</${node.tagName}>`;
    }

    const cleaned = cleanNode(document.body);
    return cleaned ? serializeToHtml(cleaned) : '';
  });
}
