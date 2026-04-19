#!/usr/bin/env ts-node
import Arweave from 'arweave';
import { readFileSync } from 'fs';
import { canonicalize } from './util-canonical-json';
import { createHash } from 'crypto';

async function main() {
  const keyPath =
    process.argv
      .find((a) => a.startsWith('--keyfile='))
      ?.split('=')[1] || './arweave-keyfile.json';
  const specPath =
    process.argv.find((a) => a.startsWith('--spec='))?.split('=')[1] ||
    './SPEC.json';
  const keyfile = JSON.parse(readFileSync(keyPath, 'utf8'));
  const payload = canonicalize(
    JSON.parse(readFileSync(specPath, 'utf8'))
  );

  const arweave = Arweave.init({
    host: 'arweave.net',
    port: 443,
    protocol: 'https',
  });
  const tx = await arweave.createTransaction({ data: payload }, keyfile);
  tx.addTag('Content-Type', 'application/json');
  tx.addTag('App-Name', 'BIPON39');
  tx.addTag('Type', 'ProtocolSpec');
  tx.addTag('Version', 'v1.0');

  await arweave.transactions.sign(tx, keyfile);
  const res = await arweave.transactions.post(tx);
  if (res.status !== 200 && res.status !== 202)
    throw new Error('Arweave post failed: ' + res.status);

  const sha256Hex = createHash('sha256')
    .update(payload, 'utf8')
    .digest('hex');
  console.log('Arweave TX:', tx.id);
  console.log('SHA-256(spec): 0x' + sha256Hex);
  console.log('URL: https://arweave.net/' + tx.id);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
