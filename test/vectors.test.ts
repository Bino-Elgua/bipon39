import { describe, it, expect } from 'vitest';
import {
  entropyToMnemonic,
  mnemonicToEntropy,
  reencodeMnemonic,
  bitsPerWord,
  mnemonicToSeed,
} from '../src/bipon39';
import {
  WORDLIST256_MERKLE_ROOT,
  merkleRoot256 as merkleRoot256Async,
} from '../src/wordspace';
import { masterFromSeed } from '../src/derivation';
import { bufToHex } from '../src/crypto';

function hexToBytes(h: string) {
  return new Uint8Array(h.match(/../g)!.map((x) => parseInt(x, 16)));
}
function bytesToHex(b: Uint8Array) {
  return [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
}

describe('BIPỌ̀N39 conformance', () => {
  it('roundtrip 256-mode (ENT=128..256)', async () => {
    for (const ENT of [128, 160, 192, 224, 256]) {
      const ent = new Uint8Array(ENT / 8).map((_, i) => i);
      const words = await entropyToMnemonic(ent, '256');
      const back = await mnemonicToEntropy(words, '256');
      expect(bytesToHex(back)).toBe(bytesToHex(ent));
      // word count matches ceil((ENT+ENT/32)/8)
      const expected = Math.ceil((ENT + ENT / 32) / bitsPerWord('256'));
      expect(words.length).toBe(expected);
    }
  });

  it('roundtrip 2048-mode (ENT=128..256)', async () => {
    for (const ENT of [128, 160, 192, 224, 256]) {
      const ent = new Uint8Array(ENT / 8).map((_, i) => 255 - i);
      const words = await entropyToMnemonic(ent, '2048');
      const back = await mnemonicToEntropy(words, '2048');
      expect(bytesToHex(back)).toBe(bytesToHex(ent));
    }
  });

  it('reencode 256 → 2048 preserves entropy', async () => {
    const ent = hexToBytes('000102030405060708090a0b0c0d0e0f');
    const w256 = await entropyToMnemonic(ent, '256');
    const w2048 = await reencodeMnemonic(w256, '256', '2048');
    const back = await mnemonicToEntropy(w2048, '2048');
    expect(bytesToHex(back)).toBe(bytesToHex(ent));
  });

  it('merkle root matches pinned constant', async () => {
    const root = await merkleRoot256Async();
    expect(root).toBe(WORDLIST256_MERKLE_ROOT);
  });
});

describe('BIPỌ̀N39 pinned vectors', () => {
  const V256 = {
    entropy: '000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f',
    mnemonic: [
      'esu-gate','esu-volt','esu-forge','esu-stream','esu-tide','esu-veil','esu-crown','esu-mirror',
      'esu-path','esu-seal','esu-code','esu-sigil','esu-drum','esu-thunder','esu-river','esu-dawn',
      'sango-gate','sango-volt','sango-forge','sango-stream','sango-tide','sango-veil','sango-crown','sango-mirror',
      'sango-path','sango-seal','sango-code','sango-sigil','sango-drum','sango-thunder','sango-river','sango-dawn',
      'obatala-stream',
    ],
    seed_no_pass: '7671a6d7ba40d24c3f70826b4e0cc74e5d2db1fb3265579626e426a6110ea7ce74351476e3b855809bcc8a7776ace942eb69093c1d1bfe1bf9fd1cbc6afb75c0',
    master_IL: '1b5aaa24b346dda8f187de09fc8dc3bbd5da6097f1f3004d622be052802aa6b1',
    master_IR: '3779555de6c42cd658a4369765ae5b30df72ebc0e8c32295ec0f541bcae7bb49',
    seed_with_pass: 'c8161d08ad34fbc3e90ff4c51c7ef22e67ad7d62fd9d29aad544d345e51acf6d0383607a9c6ef6d98514e6cd2899d85de95d2b2d0709a80f701a77fd33105723',
    master_pass_IL: 'cb5d5a012a7f69589af9b8a199851ab40e2cbf56c90728f877efc1b7cacb43c1',
    master_pass_IR: 'a950c4470ffa4152b3f0c46459d5f6ce67695c67d8d4a6c5a4bc409903d8f187',
  };

  it('entropy → mnemonic matches pinned vector', async () => {
    const ent = hexToBytes(V256.entropy);
    const words = await entropyToMnemonic(ent, '256');
    expect(words).toEqual(V256.mnemonic);
  });

  it('mnemonic → seed matches (no passphrase)', async () => {
    const seed = await mnemonicToSeed(V256.mnemonic);
    expect(bufToHex(seed)).toBe(V256.seed_no_pass);
  });

  it('master key matches (native, no passphrase)', async () => {
    const seed = hexToBytes(V256.seed_no_pass);
    const master = await masterFromSeed(seed, 'native');
    expect(bufToHex(master.key)).toBe(V256.master_IL);
    expect(bufToHex(master.chainCode)).toBe(V256.master_IR);
  });

  it('seed with passphrase matches', async () => {
    const seed = await mnemonicToSeed(V256.mnemonic, 'river-mother');
    expect(bufToHex(seed)).toBe(V256.seed_with_pass);
  });

  it('master key with passphrase matches', async () => {
    const seed = hexToBytes(V256.seed_with_pass);
    const master = await masterFromSeed(seed, 'native');
    expect(bufToHex(master.key)).toBe(V256.master_pass_IL);
    expect(bufToHex(master.chainCode)).toBe(V256.master_pass_IR);
  });
});
