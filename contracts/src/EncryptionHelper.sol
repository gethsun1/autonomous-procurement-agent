// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title EncryptionHelper
 * @dev Manages encrypted data storage and selective disclosure
 * Simplified SKALE BITE demonstration
 */
contract EncryptionHelper {
    
    struct EncryptedData {
        bytes data;
        bytes32 dataHash;
        uint256 timestamp;
        bool revealed;
    }
    
    mapping(uint256 => EncryptedData) public encryptedConstraints;
    mapping(uint256 => bytes) public decryptedData;
    
    event DataEncrypted(uint256 indexed workflowId, bytes32 dataHash);
    event DataRevealed(uint256 indexed workflowId, uint256 timestamp);
    
    /**
     * @dev Store encrypted constraints
     */
    function storeEncrypted(uint256 workflowId, bytes memory encryptedData) external {
        require(encryptedConstraints[workflowId].timestamp == 0, "Already stored");
        
        bytes32 dataHash = keccak256(encryptedData);
        
        encryptedConstraints[workflowId] = EncryptedData({
            data: encryptedData,
            dataHash: dataHash,
            timestamp: block.timestamp,
            revealed: false
        });
        
        emit DataEncrypted(workflowId, dataHash);
    }
    
    /**
     * @dev Reveal encrypted data post-settlement
     */
    function revealData(uint256 workflowId, bytes memory decrypted) external {
        require(encryptedConstraints[workflowId].timestamp > 0, "No encrypted data");
        require(!encryptedConstraints[workflowId].revealed, "Already revealed");
        
        encryptedConstraints[workflowId].revealed = true;
        decryptedData[workflowId] = decrypted;
        
        emit DataRevealed(workflowId, block.timestamp);
    }
    
    /**
     * @dev Get encrypted data
     */
    function getEncrypted(uint256 workflowId) external view returns (bytes memory) {
        return encryptedConstraints[workflowId].data;
    }
    
    /**
     * @dev Get decrypted data (only if revealed)
     */
    function getDecrypted(uint256 workflowId) external view returns (bytes memory) {
        require(encryptedConstraints[workflowId].revealed, "Not revealed");
        return decryptedData[workflowId];
    }
    
    /**
     * @dev Verify data hash
     */
    function verifyDataHash(uint256 workflowId, bytes memory data) external view returns (bool) {
        return keccak256(data) == encryptedConstraints[workflowId].dataHash;
    }
}
