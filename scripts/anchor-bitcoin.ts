#!/usr/bin/env ts-node
/**
 * Build a Bitcoin tx with OP_RETURN witness:
 *   OP_RETURN "BIPON39" <merkle_root 32B> <protocol_sha256 32B>
 *
 * NOTE: You must provide UTXOs and signing separately (PSBT).
 *       This script creates the OP_RETURN output.
 */
import * as bitcoin from 'bitcoinjs-lib';

const NETWORK = process.env.BTC_TESTNET
  ? bitcoin.networks.testnet
  : bitcoin.networks.bitcoin;

function hexToBytes32(h: string): Buffer {
  if (h.startsWith('0x')) h = h.slice(2);
  if (h.length !== 64) throw new Error('need 32-byte hex');
  return Buffer.from(h, 'hex');
}

async function main() {
  const merkle = process.argv
    .find((a) => a.startsWith('--merkle='))
    ?.split('=')[1];
  const proto = process.argv
    .find((a) => a.startsWith('--sha256='))
    ?.split('=')[1];
  if (!merkle || !proto)
    throw new Error('--merkle=0x.. --sha256=0x.. required');

  const data = bitcoin.script.compile([
    bitcoin.opcodes.OP_RETURN,
    Buffer.from('BIPON39', 'ascii'),
    hexToBytes32(merkle),
    hexToBytes32(proto),
  ]);
  console.log('OP_RETURN script (hex):', data.toString('hex'));
  console.log(
    'Add as a zero-value output in your PSBT and broadcast.'
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
