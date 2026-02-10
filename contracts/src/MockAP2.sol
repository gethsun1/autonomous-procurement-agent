// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title MockAP2
 * @dev Simplified AP2 settlement protocol for hackathon demo
 * In production, this would integrate with actual AP2 settlement
 */
contract MockAP2 {
    
    struct Settlement {
        uint256 workflowId;
        bytes32 paymentTxHash;
        uint256 amount;
        uint256 timestamp;
        bool finalized;
    }
    
    mapping(uint256 => Settlement) public settlements;
    
    event SettlementInitiated(uint256 indexed workflowId, bytes32 paymentTxHash, uint256 amount);
    event SettlementFinalized(uint256 indexed workflowId, uint256 timestamp);
    
    /**
     * @dev Initiate settlement for a workflow
     */
    function initiateSettlement(
        uint256 workflowId,
        bytes32 paymentTxHash,
        uint256 amount
    ) external {
        require(settlements[workflowId].timestamp == 0, "Settlement exists");
        require(amount > 0, "Invalid amount");
        
        settlements[workflowId] = Settlement({
            workflowId: workflowId,
            paymentTxHash: paymentTxHash,
            amount: amount,
            timestamp: block.timestamp,
            finalized: false
        });
        
        emit SettlementInitiated(workflowId, paymentTxHash, amount);
    }
    
    /**
     * @dev Finalize settlement
     */
    function finalizeSettlement(uint256 workflowId) external {
        Settlement storage settlement = settlements[workflowId];
        require(settlement.timestamp > 0, "Settlement not found");
        require(!settlement.finalized, "Already finalized");
        
        settlement.finalized = true;
        
        emit SettlementFinalized(workflowId, block.timestamp);
    }
    
    /**
     * @dev Get settlement details
     */
    function getSettlement(uint256 workflowId) external view returns (Settlement memory) {
        return settlements[workflowId];
    }
    
    /**
     * @dev Check if settlement is finalized
     */
    function isFinalized(uint256 workflowId) external view returns (bool) {
        return settlements[workflowId].finalized;
    }
}
