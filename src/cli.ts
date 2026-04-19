#!/usr/bin/env node
/**
 * BIPỌ̀N39 CLI — Generate and verify mnemonics
 */

import {
  entropyToMnemonic,
  mnemonicToEntropy,
  mnemonicToSeed,
  elementalSignature,
  oduPrimaryIndex,
} from './bipon39';
import { randomBytes } from 'crypto';
import qr from 'qrcode-terminal';
import { readFileSync, existsSync } from 'fs';

function validateEntropyQuality(entropy: Uint8Array): void {
  const unique = new Set(entropy).size;
  if (unique < entropy.length * 0.7)
    console.warn('⚠️  Low byte-variance observed in entropy (check RNG)');
}

function warnSystemEntropyLinux(): void {
  try {
    if (
      process.platform === 'linux' &&
      existsSync('/proc/sys/kernel/random/entropy_avail')
    ) {
      const n = parseInt(
        readFileSync('/proc/sys/kernel/random/entropy_avail', 'utf8').trim(),
        10
      );
      if (Number.isFinite(n) && n < 1000)
        console.warn('⚠️  Low system entropy reported on Linux');
    }
  } catch {}
}

async function main() {
  const mode = (process.argv
    .find((a) => a.startsWith('--mode='))
    ?.split('=')[1] ?? '2048') as '256' | '2048';
  const ent = parseInt(
    process.argv.find((a) => a.startsWith('--ent='))?.split('=')[1] ??
      (mode === '256' ? '256' : '128'),
    10
  );
  const pass =
    process.argv.find((a) => a.startsWith('--pass='))?.split('=')[1] ?? '';
  const action = process.argv[2] ?? 'gen'; // gen | check

  if (action === 'gen') {
    warnSystemEntropyLinux();
    const bytes = new Uint8Array(randomBytes(ent / 8));
    validateEntropyQuality(bytes);
    const words = await entropyToMnemonic(bytes, mode);
    const phrase = words.join(' ');
    console.log(`🔑 Mnemonic (${mode}): ${phrase}`);
    const seed = await mnemonicToSeed(phrase, pass);
    console.log(`🌱 Seed: ${Buffer.from(seed).toString('hex')}`);
    console.log(' 📊 Elemental signature:', elementalSignature(words));
    console.log(`🔮 Primary Odù index: ${oduPrimaryIndex(words, mode)}`);
    console.log(' 🧾 QR (mnemonic):');
    qr.generate(phrase, { small: true });
    return;
  }

  if (action === 'check') {
    const phrase =
      process.argv.slice(3).join(' ') || process.argv[3] || '';
    if (!phrase) throw new Error("Provide mnemonic after 'check'");
    const words = phrase.trim().split(/\s+/);
    const recovered = await mnemonicToEntropy(words, mode);
    console.log('✅ Checksum OK. ENT:', recovered.length * 8, 'bits');
    return;
  }
}

main().catch((e) => {
  console.error('❌', e?.message || e);
  process.exit(1);
});
