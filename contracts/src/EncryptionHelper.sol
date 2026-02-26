// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title EncryptionHelper
 * @dev Manages encrypted data storage and selective disclosure.
 *      Privacy-preserving constraint storage for procurement workflows.
 *
 *      Access control:
 *      - Only the address that stored the encrypted data can reveal it.
 *      - Prevents any external EOA from overwriting revealed data.
 */
contract EncryptionHelper {

    struct EncryptedData {
        bytes   data;
        bytes32 dataHash;
        uint256 timestamp;
        bool    revealed;
    }

    mapping(uint256 => EncryptedData) public encryptedConstraints;
    mapping(uint256 => bytes)         public decryptedData;
    // Tracks who stored the data — only they can reveal it
    mapping(uint256 => address)       public storageRequester;

    event DataEncrypted(uint256 indexed workflowId, bytes32 dataHash, address indexed requester);
    event DataRevealed(uint256 indexed workflowId, uint256 timestamp);

    // ── Modifiers ──────────────────────────────────────────────────────────────

    modifier onlyStorageRequester(uint256 workflowId) {
        require(
            storageRequester[workflowId] == msg.sender,
            "EncryptionHelper: caller is not the original data requester"
        );
        _;
    }

    // ── Functions ──────────────────────────────────────────────────────────────

    /**
     * @dev Store encrypted constraints. Records msg.sender as the authorized requester.
     *      Can only be stored once per workflowId.
     */
    function storeEncrypted(uint256 workflowId, bytes memory encryptedData) external {
        require(encryptedConstraints[workflowId].timestamp == 0, "EncryptionHelper: already stored");
        require(encryptedData.length > 0, "EncryptionHelper: empty data");

        bytes32 dataHash = keccak256(encryptedData);

        encryptedConstraints[workflowId] = EncryptedData({
            data:      encryptedData,
            dataHash:  dataHash,
            timestamp: block.timestamp,
            revealed:  false
        });
        storageRequester[workflowId] = msg.sender;

        emit DataEncrypted(workflowId, dataHash, msg.sender);
    }

    /**
     * @dev Reveal encrypted data post-settlement.
     *      Only callable by the address that originally stored the data.
     */
    function revealData(uint256 workflowId, bytes memory decrypted)
        external
        onlyStorageRequester(workflowId)
    {
        require(encryptedConstraints[workflowId].timestamp > 0, "EncryptionHelper: no encrypted data");
        require(!encryptedConstraints[workflowId].revealed,     "EncryptionHelper: already revealed");

        encryptedConstraints[workflowId].revealed = true;
        decryptedData[workflowId] = decrypted;

        emit DataRevealed(workflowId, block.timestamp);
    }

    /**
     * @dev Get raw encrypted data bytes.
     */
    function getEncrypted(uint256 workflowId) external view returns (bytes memory) {
        return encryptedConstraints[workflowId].data;
    }

    /**
     * @dev Get decrypted data — only accessible after requester has revealed it.
     */
    function getDecrypted(uint256 workflowId) external view returns (bytes memory) {
        require(encryptedConstraints[workflowId].revealed, "EncryptionHelper: not yet revealed");
        return decryptedData[workflowId];
    }

    /**
     * @dev Verify data integrity by checking keccak256 hash.
     */
    function verifyDataHash(uint256 workflowId, bytes memory data) external view returns (bool) {
        return keccak256(data) == encryptedConstraints[workflowId].dataHash;
    }
}
