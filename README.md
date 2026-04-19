# BIPỌ̀N39

A vanity-cloakseed mnemonic standard built on BIP-39 principles with a culturally-rooted 256-token wordlist derived from Yoruba cosmological archetypes.

## Overview

BIPỌ̀N39 replaces the standard BIP-39 2048-word English list with a compact, deterministic set of **256 canonical tokens** formed from **16 roots** (Orisha/element names) crossed with **16 affixes** (ritual/technical glyphs):

```
esu-gate  esu-volt  esu-forge  esu-stream  ...
sango-gate  sango-volt  sango-forge  ...
...
irawo-gate  irawo-volt  irawo-forge  ...
```

Each token encodes 8 bits (vs. BIP-39's 11 bits per word), yielding longer but more memorable and culturally meaningful mnemonics.

A deterministic expansion to **2048 tokens** is available via 8 subtones (`alpha`..`theta`), providing full BIP-39 entropy compatibility in either mode.

## Features

- **Dual-mode encoding** — `256` (8 bits/word) and `2048` (11 bits/word) with lossless re-encoding between modes
- **Entropy support** — 128, 160, 192, 224, and 256-bit entropy with SHA-256 checksum (BIP-39 standard upper-bit extraction)
- **PBKDF2 seed derivation** — HMAC-SHA512, 2048 iterations, salt = `BIPỌ̀N39 seed` + optional ` Ọ̀RÍ:<passphrase>`, NFKD normalized
- **Master key derivation** — HMAC-SHA512 with key `BIPỌ̀N39 master` (native) or `Bitcoin seed` (BIP-32 compatible)
- **Odù mapping** — XOR reduction of word indices to a 0-255 archetype index
- **Elemental signatures** — Fire/Water/Earth/Air/Ether personality vector from affix metadata
- **Sabbath gate** — Queue irreversible operations on Saturday (Ọbàtálá sabbath, UTC day 6)
- **Merkle integrity** — SHA-256 Merkle tree over all 256 slugs, pinned root: `0ab1fafa...`
- **Node + Browser** — Crypto layer works with both Node.js `crypto` and Web Crypto API

## Installation

```bash
npm install
```

## Usage

### CLI

```bash
# Generate a 256-mode mnemonic (256-bit entropy)
npx ts-node --esm src/cli.ts gen --mode=256 --ent=256

# Generate a 2048-mode mnemonic (128-bit entropy, default)
npx ts-node --esm src/cli.ts gen --mode=2048

# Verify a mnemonic checksum
npx ts-node --esm src/cli.ts check --mode=256 esu-gate esu-volt esu-forge ...
```

### Library

```typescript
import {
  entropyToMnemonic,
  mnemonicToEntropy,
  mnemonicToSeed,
  reencodeMnemonic,
  oduPrimaryIndex,
  elementalSignature,
} from './src';

// Entropy to mnemonic
const entropy = crypto.getRandomValues(new Uint8Array(32));
const words = await entropyToMnemonic(entropy, '256');

// Mnemonic to seed
const seed = await mnemonicToSeed(words, 'optional-passphrase');

// Re-encode between modes
const words2048 = await reencodeMnemonic(words, '256', '2048');

// Ritual metadata
const odu = oduPrimaryIndex(words, '256');     // 0-255 archetype
const elements = elementalSignature(words);     // { Fire, Water, Earth, Air, Ether }
```

### Master Key Derivation

```typescript
import { masterFromSeed } from './src/derivation';

const master = await masterFromSeed(seed, 'native');  // BIPỌ̀N39 master key
// master.key      — 32-byte private key (IL)
// master.chainCode — 32-byte chain code (IR)

const btcMaster = await masterFromSeed(seed, 'bitcoin');  // BIP-32 compatible
```

## Derivation Paths

| Chain    | Path                                     |
|----------|------------------------------------------|
| EVM      | `m/44'/60'/account'/change/index`        |
| Bitcoin  | `m/44'/coin'/account'/change/index`      |
| BTC Bech32 | `m/84'/coin'/account'/change/index`   |
| Solana   | `m/44'/501'/account'/change'/index'`     |
| Sui      | `m/44'/784'/account'/change'/index'`     |

## Wordlist Structure

**16 Roots** — `esu`, `sango`, `ogun`, `oya`, `yemoja`, `osun`, `obatala`, `orunmila`, `egungun`, `ori`, `ile`, `omi`, `ina`, `afeefe`, `igi`, `irawo`

**16 Affixes** — `gate`, `volt`, `forge`, `stream`, `tide`, `veil`, `crown`, `mirror`, `path`, `seal`, `code`, `sigil`, `drum`, `thunder`, `river`, `dawn`

Each affix carries metadata:
- **Element** — Fire, Water, Earth, Air, or Ether
- **Ritual cue** — e.g., "open", "charge", "shape"
- **Ethical tag** — e.g., "threshold", "momentum", "craft"
- **Sigil seed** — Unicode glyph anchor

## Testing

```bash
npm test
```

Runs pinned vector conformance tests covering:
- Roundtrip encoding/decoding (both modes, all entropy lengths)
- Cross-mode re-encoding
- Merkle root verification
- Pinned entropy/mnemonic/seed/master-key vectors

## On-Chain Anchors

### Solidity (`contracts/BIPON39Genesis.sol`)

Publishes protocol and spec hashes, the canonical Merkle root, and optional cross-chain coordinates. Supports Saturday deployment enforcement.

### Move (`sui/sources/genesis.move`)

Sui object publishing protocol hashes and cross-chain anchor references.

### Scripts

| Script | Purpose |
|--------|---------|
| `scripts/deploy-eth.ts` | Deploy genesis contract to EVM chain |
| `scripts/anchor-bitcoin.ts` | Generate OP_RETURN script for Bitcoin anchoring |
| `scripts/anchor-arweave.ts` | Upload canonical spec to Arweave |
| `scripts/util-canonical-json.ts` | Deterministic JSON serialization |

## Project Structure

```
src/
  bipon39.ts       — Mnemonic engine (encode/decode/seed/odu/elements/sabbath)
  wordspace.ts     — Wordlist, Merkle tree, affix metadata
  crypto.ts        — SHA-256, PBKDF2, HMAC-SHA512, timing-safe compare
  derivation.ts    — Master key derivation, path registry
  cli.ts           — CLI entry point
  index.ts         — Barrel exports
test/
  vectors.test.ts  — Pinned vector conformance tests
vectors/
  vectors.json     — Canonical test vectors
contracts/
  BIPON39Genesis.sol — Solidity genesis anchor
scripts/
  deploy-eth.ts, anchor-bitcoin.ts, anchor-arweave.ts, util-canonical-json.ts
sui/
  sources/genesis.move — Sui Move genesis object
```

## License

MIT
