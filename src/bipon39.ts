/**
 * BIPỌ̀N39 — Mnemonic Engine
 * entropy ↔ mnemonic ↔ seed, Odù mapping, elemental signatures, Sabbath gate.
 */

import { BASE256, EXP2048, AFFIX_META, type Mode } from './wordspace';
import { sha256, pbkdf2_hmac_sha512, timingSafeEq, zeroize } from './crypto';

export type { Mode };
export const SALT_PREFIX = 'BIPỌ̀N39 seed'; // NFC preserved
export const PASS_LABEL  = ' Ọ̀RÍ:';        // leading space is normative

export const ALLOWED_ENT_256  = [128, 160, 192, 224, 256];
export const ALLOWED_ENT_2048 = [128, 160, 192, 224, 256];

export function toNFKD(s: string): string { return s.normalize('NFKD'); }
export function toNFC(s: string): string  { return s.normalize('NFC'); }

export function bitsPerWord(mode: Mode): number {
  return mode === '256' ? 8 : 11;
}

export async function entropyToMnemonic(
  entropy: Uint8Array,
  mode: Mode
): Promise<string[]> {
  const ENT = entropy.length * 8;
  const allowed = mode === '256' ? ALLOWED_ENT_256 : ALLOWED_ENT_2048;
  if (!allowed.includes(ENT))
    throw new Error(`Invalid ENT ${ENT} for mode ${mode}`);

  const hash = await sha256(entropy);
  const csBits = ENT / 32;
  const csByte = hash[0];

  const bits: number[] = [];
  for (const b of entropy)
    for (let i = 7; i >= 0; i--) bits.push((b >>> i) & 1);

  // Extract checksum: top csBits bits of hash[0], MSB first (BIP39 standard)
  for (let i = 7; i > 7 - csBits; i--) {
    bits.push((csByte >>> i) & 1);
  }

  const bpw = bitsPerWord(mode);
  const total = ENT + csBits;
  const pad = (bpw - (total % bpw)) % bpw;
  for (let i = 0; i < pad; i++) bits.push(0);

  const indices: number[] = [];
  for (let i = 0; i < bits.length; i += bpw) {
    let v = 0;
    for (let j = 0; j < bpw; j++) v = (v << 1) | bits[i + j];
    indices.push(v);
  }
  return indicesToMnemonic(indices, mode);
}

export function indicesToMnemonic(indices: number[], mode: Mode): string[] {
  if (mode === '256') return indices.map((i) => BASE256[i]);
  return indices.map((i) => EXP2048[i]);
}

export function validateNormalizedSlug(input: string): void {
  if (!input) throw new Error('Empty token');
  if (!/^[a-z0-9~-]+$/.test(input))
    throw new Error('Invalid characters in token');
}

export function mnemonicToIndices(words: string[], mode: Mode): number[] {
  const list = mode === '256' ? BASE256 : EXP2048;
  return words.map((w) => {
    const slug = toNFKD(w).toLowerCase();
    validateNormalizedSlug(slug);
    const idx = list.indexOf(slug);
    if (idx < 0) throw new Error('Unknown token');
    return idx;
  });
}

export async function mnemonicToEntropy(
  words: string[],
  mode: Mode
): Promise<Uint8Array> {
  const bpw = bitsPerWord(mode);
  const idx = mnemonicToIndices(words, mode);
  const totalBits = idx.length * bpw;

  const bits: number[] = [];
  for (const v of idx)
    for (let i = bpw - 1; i >= 0; i--) bits.push((v >>> i) & 1);

  const allowed = (mode === '256' ? ALLOWED_ENT_256 : ALLOWED_ENT_2048)
    .slice()
    .sort((a, b) => b - a);

  for (const ENT of allowed) {
    const csBits = ENT / 32;
    if (ENT + csBits > totalBits) continue;

    const entBits = bits.slice(0, ENT);
    const csGot = bits.slice(ENT, ENT + csBits);

    const bytes: number[] = [];
    for (let i = 0; i < ENT; i += 8) {
      let b = 0;
      for (let j = 0; j < 8; j++) b = (b << 1) | entBits[i + j];
      bytes.push(b);
    }
    const entropy = new Uint8Array(bytes);
    const hash = await sha256(entropy);
    const csExp = hash[0] >>> (8 - csBits);
    const csVal = csGot.reduce((a, b) => (a << 1) | b, 0);

    const a = new Uint8Array([csVal & 0xff]);
    const e = new Uint8Array([csExp & 0xff]);
    if (timingSafeEq(a, e)) return entropy;
  }

  throw new Error('Checksum mismatch or unsupported parameters');
}

export async function reencodeMnemonic(
  words: string[],
  from: Mode,
  to: Mode
): Promise<string[]> {
  const ent = await mnemonicToEntropy(words, from);
  return entropyToMnemonic(ent, to);
}

export async function mnemonicToSeed(
  mnemonic: string | string[],
  passphrase = ''
): Promise<Uint8Array> {
  const phrase = typeof mnemonic === 'string' ? mnemonic : mnemonic.join(' ');
  const m = toNFKD(phrase);
  const saltStr = SALT_PREFIX + (passphrase ? PASS_LABEL + passphrase : '');
  const salt = toNFKD(saltStr);
  const mBytes = new TextEncoder().encode(m);
  const sBytes = new TextEncoder().encode(salt);
  try {
    return await pbkdf2_hmac_sha512(mBytes, sBytes, 2048, 64);
  } finally {
    zeroize(mBytes);
    zeroize(sBytes);
  }
}

// === Ritual metadata resolver ===

export type TokenMeta = {
  id: number;
  word: string;
  root: string;
  affix: string;
  element: 'Fire' | 'Water' | 'Earth' | 'Air' | 'Ether';
  ritual_cue: string;
  ethical_tag: string;
  sigil_seed: string;
};

export function lookupMeta256(id: number): TokenMeta {
  const word = BASE256[id];
  const [root, affix] = word.split('-');
  const m = (AFFIX_META as any)[affix];
  return { id, word, root, affix, ...m } as TokenMeta;
}

// === Odù chain mapping ===

export function oduPrimaryIndex(words: string[], mode: Mode): number {
  const idx = mnemonicToIndices(words, mode);
  return idx.reduce((a, b) => (a ^ b) & 0xff, 0);
}

export function elementalSignature(
  words: string[]
): Record<string, number> {
  const counts: Record<string, number> = {
    Fire: 0, Water: 0, Earth: 0, Air: 0, Ether: 0,
  };
  for (const w of words) {
    const slug = w.split('~')[0];
    const id = BASE256.indexOf(slug);
    if (id < 0) continue;
    const affix = slug.split('-')[1] as keyof typeof AFFIX_META;
    const elem = (AFFIX_META as any)[affix].element as string;
    counts[elem]++;
  }
  return counts;
}

// === Sabbath gate ===

export function sabbathGate(
  now: Date = new Date(),
  councilOverride = false,
  trustedUtcDay?: number
): 'allow' | 'queue' {
  const day =
    typeof trustedUtcDay === 'number' ? trustedUtcDay : now.getUTCDay();
  if (day === 6 && !councilOverride) return 'queue';
  return 'allow';
}
