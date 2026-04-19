module bipon39::genesis {
    use std::string;
    use std::vector;
    use sui::tx_context::{Self, TxContext};

    public struct Genesis has key, store {
        sha256: vector<u8>,
        keccak: vector<u8>,
        merkle_root: vector<u8>,
        version: string::String,
        arweave_tx: vector<u8>,
        bitcoin_tx: vector<u8>,
    }

    public fun publish(
        sha256: vector<u8>,
        keccak: vector<u8>,
        merkle_root: vector<u8>,
        version: string::String,
        arweave_tx: vector<u8>,
        bitcoin_tx: vector<u8>,
        ctx: &mut TxContext
    ) {
        move_to(ctx, Genesis {
            sha256,
            keccak,
            merkle_root,
            version,
            arweave_tx,
            bitcoin_tx,
        });
    }
}
