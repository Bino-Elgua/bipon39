/**
 * BIPỌ̀N39 Crypto — Node + Browser wiring
 * SHA-256, PBKDF2-HMAC-SHA512, constant-time compare, zeroize.
 */

const isNode =
  typeof process !== 'undefined' && !!(process as any).versions?.node;

export async function sha256(data: Uint8Array): Promise<Uint8Array> {
  if (
    !isNode &&
    typeof crypto !== 'undefined' &&
    (crypto as any).subtle
  ) {
    const d = await (crypto as any).subtle.digest('SHA-256', data);
    return new Uint8Array(d);
  }
  const { createHash } = await import('crypto');
  const h = createHash('sha256');
  h.update(Buffer.from(data));
  return new Uint8Array(h.digest());
}

export async function pbkdf2_hmac_sha512(
  password: Uint8Array,
  salt: Uint8Array,
  iters = 2048,
  dkLen = 64
): Promise<Uint8Array> {
  try {
    if (
      !isNode &&
      typeof crypto !== 'undefined' &&
      (crypto as any).subtle
    ) {
      const key = await (crypto as any).subtle.importKey(
        'raw',
        password,
        'PBKDF2',
        false,
        ['deriveBits']
      );
      const bits = await (crypto as any).subtle.deriveBits(
        { name: 'PBKDF2', hash: 'SHA-512', iterations: iters, salt },
        key,
        dkLen * 8
      );
      return new Uint8Array(bits);
    }
  } catch (_) {
    /* fall back to Node */
  }
  const { pbkdf2Sync } = await import('crypto');
  const out = pbkdf2Sync(
    Buffer.from(password),
    Buffer.from(salt),
    iters,
    dkLen,
    'sha512'
  );
  return new Uint8Array(out);
}

export function timingSafeEq(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a[i] ^ b[i];
  return r === 0;
}

export function zeroize(buf: Uint8Array): void {
  buf.fill(0);
}

export function bufToHex(b: Uint8Array): string {
  return [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
}

export function hexToBytes(h: string): Uint8Array {
  const clean = h.startsWith('0x') ? h.slice(2) : h;
  return new Uint8Array(clean.match(/../g)!.map((x) => parseInt(x, 16)));
}
