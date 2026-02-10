// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title MockX402
 * @dev Simplified x402 payment interface for hackathon demo
 * In production, this would integrate with actual x402 protocol
 */
contract MockX402 {
    
    struct Payment {
        uint256 workflowId;
        address from;
        address to;
        uint256 amount;
        uint256 timestamp;
        bool executed;
    }
    
    mapping(bytes32 => Payment) public payments;
    
    event PaymentInitiated(bytes32 indexed txHash, uint256 indexed workflowId, address from, address to, uint256 amount);
    event PaymentExecuted(bytes32 indexed txHash);
    
    /**
     * @dev Initiate a payment
     */
    function initiatePayment(
        uint256 workflowId,
        address to,
        uint256 amount
    ) external payable returns (bytes32) {
        require(msg.value >= amount, "Insufficient payment");
        require(to != address(0), "Invalid recipient");
        
        // Generate transaction hash
        bytes32 txHash = keccak256(abi.encodePacked(
            workflowId,
            msg.sender,
            to,
            amount,
            block.timestamp
        ));
        
        payments[txHash] = Payment({
            workflowId: workflowId,
            from: msg.sender,
            to: to,
            amount: amount,
            timestamp: block.timestamp,
            executed: false
        });
        
        emit PaymentInitiated(txHash, workflowId, msg.sender, to, amount);
        
        return txHash;
    }
    
    /**
     * @dev Execute a payment
     */
    function executePayment(bytes32 txHash) external {
        Payment storage payment = payments[txHash];
        require(!payment.executed, "Already executed");
        require(payment.amount > 0, "Payment not found");
        
        payment.executed = true;
        
        // Transfer funds to recipient
        payable(payment.to).transfer(payment.amount);
        
        emit PaymentExecuted(txHash);
    }
    
    /**
     * @dev Get payment details
     */
    function getPayment(bytes32 txHash) external view returns (Payment memory) {
        return payments[txHash];
    }
}
