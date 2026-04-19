#!/usr/bin/env ts-node
import { readFileSync } from 'fs';
import { ethers } from 'ethers';
import { createHash } from 'crypto';
import { canonicalize } from './util-canonical-json';

/**
 * Usage:
 *
 * ARB_RPC=https://... PRIVATE_KEY=0x... ts-node scripts/deploy-eth.ts \
 *   --spec=./dist/spec.json --merkle=0ab1... --version=v1.0 --sabbath
 */

function hex32(x: Buffer | Uint8Array | string): string {
  if (typeof x === 'string' && x.startsWith('0x') && x.length === 66) return x;
  const b =
    typeof x === 'string'
      ? Buffer.from(x.replace(/^0x/, ''), 'hex')
      : Buffer.from(x);
  if (b.length !== 32) throw new Error('need 32 bytes');
  return '0x' + b.toString('hex');
}

async function main() {
  const args = Object.fromEntries(
    process.argv.slice(2).map((s) => s.split('='))
  );
  const specPath = args['--spec'] ?? './SPEC.json';
  const merkleHex = args['--merkle'];
  const version = args['--version'] ?? 'v1.0';
  const enforceSaturday =
    '--sabbath' in args || process.argv.includes('--sabbath');

  if (!merkleHex) throw new Error('--merkle=<hex32> required');

  const raw = readFileSync(specPath, 'utf8');
  const canonical = canonicalize(JSON.parse(raw));

  const sha256Hex = createHash('sha256')
    .update(canonical, 'utf8')
    .digest('hex');
  const keccakHex = ethers
    .keccak256(ethers.toUtf8Bytes(canonical))
    .slice(2);

  const provider = new ethers.JsonRpcProvider(
    process.env.RPC_URL || 'http://localhost:8545'
  );
  const wallet = new ethers.Wallet(
    process.env.PRIVATE_KEY as string,
    provider
  );

  const factory = await (
    await import(
      '../artifacts/contracts/BIPON39Genesis.sol/BIPON39Genesis.json'
    )
  ).default;
  const abi = factory.abi;
  const bytecode = factory.bytecode;
  const ContractFactory = new ethers.ContractFactory(abi, bytecode, wallet);

  const tx = await ContractFactory.deploy(
    '0x' + sha256Hex,
    '0x' + keccakHex,
    merkleHex,
    version,
    enforceSaturday
  );
  console.log('Deploy sent:', tx.deploymentTransaction()?.hash);
  const contract = await tx.waitForDeployment();
  console.log('Deployed at:', await contract.getAddress());
  console.log('SHA-256:', '0x' + sha256Hex);
  console.log('KECCAK :', '0x' + keccakHex);
  console.log('MERKLE :', merkleHex);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
