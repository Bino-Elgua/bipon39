// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title BIPON39 Genesis Anchor (v1.0)
/// @notice Publishes protocol/spec hashes and the canonical BASE-256 Merkle root.
///         Optionally enforces Saturday deployment (Ọbàtálá sabbath) at construction time.
///         Allows a one-time set of cross-chain "Sacred Coordinates" after other anchors exist.
contract BIPON39Genesis {
    // ===== Immutable protocol facts =====
    bytes32 public immutable PROTOCOL_SHA256;
    bytes32 public immutable PROTOCOL_KECCAK;
    bytes32 public immutable WORDLIST_MERKLE_ROOT;
    string  public immutable VERSION_TAG;
    address public immutable OWNER;
    bool    public immutable SABbathEnforced;

    // ===== Cross-chain sacred coordinates (set once) =====
    struct CosmicCoordinates {
        bytes32 bitcoinTx;
        bytes32 arweaveTx;
        bytes32 suiObject;
        string  arweaveB64;
    }

    bool public coordinatesSet;
    CosmicCoordinates public coords;

    // ===== Events =====
    event GenesisPublished(bytes32 protocolSha256, bytes32 protocolKeccak, bytes32 merkleRoot, string version, bool sabbathEnforced);
    event CoordinatesSet(bytes32 bitcoinTx, bytes32 arweaveTx, bytes32 suiObject, string arweaveB64);
    event CommunityVerification(address indexed verifier, bool protocolValid, bool merkleValid, uint256 timestamp);

    // ===== Constructor =====
    constructor(
        bytes32 protocolSha256,
        bytes32 protocolKeccak,
        bytes32 merkleRoot,
        string memory versionTag,
        bool enforceSaturday
    ) {
        if (enforceSaturday) {
            require(_isSaturday(block.timestamp), "Not Saturday UTC");
        }
        PROTOCOL_SHA256 = protocolSha256;
        PROTOCOL_KECCAK = protocolKeccak;
        WORDLIST_MERKLE_ROOT = merkleRoot;
        VERSION_TAG = versionTag;
        OWNER = msg.sender;
        SABbathEnforced = enforceSaturday;
        emit GenesisPublished(protocolSha256, protocolKeccak, merkleRoot, versionTag, enforceSaturday);
    }

    // ===== Owner-gated one-time coordinate set =====
    function setCoordinates(
        bytes32 bitcoinTx,
        bytes32 arweaveTx,
        bytes32 suiObject,
        string calldata arweaveB64
    ) external {
        require(msg.sender == OWNER, "not owner");
        require(!coordinatesSet, "already set");
        coordinatesSet = true;
        coords = CosmicCoordinates({
            bitcoinTx: bitcoinTx,
            arweaveTx: arweaveTx,
            suiObject: suiObject,
            arweaveB64: arweaveB64
        });
        emit CoordinatesSet(bitcoinTx, arweaveTx, suiObject, arweaveB64);
    }

    // ===== Verifiers =====
    function verifyProtocol(bytes calldata canonicalJson)
        external view returns (bool shaOk, bool keccakOk)
    {
        return (
            sha256(canonicalJson) == PROTOCOL_SHA256,
            keccak256(canonicalJson) == PROTOCOL_KECCAK
        );
    }

    /// @dev Verify inclusion proof for an ASCII slug at index in the BASE-256 Merkle root.
    function verifyWordInclusion(
        string calldata slug,
        uint256 index,
        bytes32[] calldata siblings,
        bool[] calldata siblingOnLeft
    ) external view returns (bool) {
        require(siblings.length == siblingOnLeft.length, "len mismatch");
        bytes32 h = sha256(bytes(slug));
        for (uint256 i = 0; i < siblings.length; i++) {
            bytes32 s = siblings[i];
            h = siblingOnLeft[i]
                ? sha256(abi.encodePacked(s, h))
                : sha256(abi.encodePacked(h, s));
            index >>= 1;
        }
        return h == WORDLIST_MERKLE_ROOT;
    }

    // ===== Community attestations (public) =====
    function publishCommunityVerification(
        bool protocolValid,
        bool merkleValid
    ) external {
        emit CommunityVerification(msg.sender, protocolValid, merkleValid, block.timestamp);
    }

    // ===== Helpers =====
    function _isSaturday(uint256 ts) internal pure returns (bool) {
        uint256 daysSinceEpoch = ts / 1 days;
        uint256 dow = (daysSinceEpoch + 4) % 7;
        return dow == 6;
    }
}
