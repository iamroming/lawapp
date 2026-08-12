const NAMESPACE = "casefiles-firebase-uid";

function simpleHash(str: string): string {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16).padStart(12, "0");
}

function hexToUuid(hex: string): string {
  const full = hex.padEnd(32, "0");
  return [
    full.substring(0, 8),
    full.substring(8, 12),
    `5${full.substring(13, 16)}`,
    full.substring(16, 20),
    full.substring(20, 32),
  ].join("-");
}

export function firebaseUidToUuid(uid: string): string {
  const hash1 = simpleHash(`${NAMESPACE}:${uid}`);
  const hash2 = simpleHash(`${uid}:${NAMESPACE}`);
  return hexToUuid(hash1 + hash2);
}
