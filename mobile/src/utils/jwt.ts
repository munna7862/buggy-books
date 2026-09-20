export interface DecodedJwtPayload {
  username?: string;
  fullName?: string;
  type?: string;
  exp?: number;
  iat?: number;
  [key: string]: unknown;
}

/**
 * Robust base64 decoder that works across React Native, Hermes, browsers, and Node.js test runners.
 */
function base64Decode(str: string): string {
  // Normalize base64url characters
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4 !== 0) {
    base64 += '=';
  }

  // Safe check for Node.js Buffer in test environments
  const maybeBuffer = (globalThis as unknown as { Buffer?: { from: (s: string, enc: string) => { toString: (enc: string) => string } } }).Buffer;
  if (maybeBuffer && typeof maybeBuffer.from === 'function') {
    return maybeBuffer.from(base64, 'base64').toString('utf-8');
  }

  // Browser / React Native global.atob
  if (typeof atob === 'function') {
    return decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
  }

  // Fallback pure JS base64 table decoder
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let output = '';
  let i = 0;
  base64 = base64.replace(/[^A-Za-z0-9+/=]/g, '');

  while (i < base64.length) {
    const enc1 = chars.indexOf(base64.charAt(i++));
    const enc2 = chars.indexOf(base64.charAt(i++));
    const enc3 = chars.indexOf(base64.charAt(i++));
    const enc4 = chars.indexOf(base64.charAt(i++));

    const chr1 = (enc1 << 2) | (enc2 >> 4);
    const chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
    const chr3 = ((enc3 & 3) << 6) | enc4;

    output += String.fromCharCode(chr1);
    if (enc3 !== 64) output += String.fromCharCode(chr2);
    if (enc4 !== 64) output += String.fromCharCode(chr3);
  }

  return decodeURIComponent(escape(output));
}

/**
 * Decodes the payload portion of a standard JWT token without verifying cryptographic signature.
 * Used for client-side session hydration.
 */
export function decodeJwtPayload(token: string): DecodedJwtPayload | null {
  try {
    if (!token || typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payloadJson = base64Decode(parts[1]);
    return JSON.parse(payloadJson) as DecodedJwtPayload;
  } catch {
    return null;
  }
}
