/**
 * BIPỌ̀N39 Derivation — Master key + path registry
 * Master key derivation via HMAC-SHA512.
 * Child key derivation (BIP32/SLIP-0010) is out-of-scope for v1.0.
 */

export type Master = { key: Uint8Array; chainCode: Uint8Array };

export async function masterFromSeed(
  seed: Uint8Array,
  label: 'native' | 'bitcoin' = 'native'
): Promise<Master> {
  const { createHmac } = await import('crypto');
  const key = label === 'bitcoin' ? 'Bitcoin seed' : 'BIPỌ̀N39 master';
  const mac = createHmac('sha512', key);
  mac.update(Buffer.from(seed));
  const I = mac.digest();
  return {
    key: new Uint8Array(I.slice(0, 32)),
    chainCode: new Uint8Array(I.slice(32)),
  };
}

// Path registry (purpose', coin', account', change, index)
export const PATHS = {
  EVM: (acct = 0, ch = 0, idx = 0) =>
    `m/44'/60'/${acct}'/${ch}/${idx}`,
  Bitcoin: {
    p44: (coin = 0, acct = 0, ch = 0, idx = 0) =>
      `m/44'/${coin}'/${acct}'/${ch}/${idx}`,
    p84: (coin = 0, acct = 0, ch = 0, idx = 0) =>
      `m/84'/${coin}'/${acct}'/${ch}/${idx}`, // bech32
  },
  Solana: (acct = 0, ch = 0, idx = 0) =>
    `m/44'/501'/${acct}'/${ch}'/${idx}'`, // ed25519 (SLIP-0010)
  Sui: (acct = 0, ch = 0, idx = 0) =>
    `m/44'/784'/${acct}'/${ch}'/${idx}'`, // ed25519 (SLIP-0010)
} as const;
