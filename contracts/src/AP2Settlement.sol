// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./X402Escrow.sol";

/**
 * @title AP2Settlement
 * @dev Deterministic settlement protocol — replaces the former MockAP2 stub.
 *
 *      Security properties:
 *      - Only the bound ProcurementWorkflow contract can initiate or finalize settlements.
 *      - Settlement requires on-chain verification that the X402Escrow payment executed.
 *      - Cannot manually settle a payment that hasn't been executed on-chain.
 *      - Idempotent: double-finalization guarded by `finalized` flag.
 */
contract AP2Settlement is Ownable {

    X402Escrow public immutable x402Escrow;
    address    public immutable workflowContract;

    struct Settlement {
        uint256 workflowId;
        bytes32 paymentTxHash;
        uint256 amount;
        uint256 timestamp;
        bool    finalized;
    }

    mapping(uint256 => Settlement) public settlements;

    event SettlementInitiated(
        uint256 indexed workflowId,
        bytes32 paymentTxHash,
        uint256 amount
    );
    event SettlementFinalized(uint256 indexed workflowId, uint256 timestamp);
    // SettlementVerified: confirms on-chain payment proof was verified for indexers
    event SettlementVerified(uint256 indexed workflowId);

    // ── Protocol Version ───────────────────────────────────────────────────────
    function version() external pure returns (string memory) { return "1.0.0"; }

    // ── Modifiers ──────────────────────────────────────────────────────────────

    modifier onlyWorkflowContract() {
        require(
            msg.sender == workflowContract,
            "AP2Settlement: caller is not the bound workflow contract"
        );
        _;
    }

    // ── Constructor ────────────────────────────────────────────────────────────

    /**
     * @param _x402Escrow       Address of the deployed X402Escrow contract
     * @param _workflowContract Address of the ProcurementWorkflow contract
     */
    constructor(address _x402Escrow, address _workflowContract) Ownable(msg.sender) {
        require(_x402Escrow != address(0),       "Invalid X402Escrow address");
        require(_workflowContract != address(0), "Invalid workflow contract address");
        x402Escrow       = X402Escrow(payable(_x402Escrow));
        workflowContract = _workflowContract;
    }

    // ── Settlement functions ───────────────────────────────────────────────────

    /**
     * @dev Initiate settlement. Only callable by workflow contract.
     *      Verifies that the referenced X402Escrow payment was actually executed on-chain.
     */
    function initiateSettlement(
        uint256 workflowId,
        bytes32 paymentTxHash,
        uint256 amount
    ) external onlyWorkflowContract {
        require(settlements[workflowId].timestamp == 0, "AP2Settlement: settlement already exists");
        require(amount > 0,                             "AP2Settlement: invalid amount");
        require(paymentTxHash != bytes32(0),            "AP2Settlement: invalid payment hash");

        // ── CRYPTOGRAPHIC VERIFICATION ──────────────────────────────────────────
        // Query X402Escrow directly to confirm this payment hash was actually executed.
        // This prevents settling against a fabricated or unexecuted txHash.
        X402Escrow.Payment memory payment = x402Escrow.getPayment(paymentTxHash);
        require(payment.blockNumber > 0, "AP2Settlement: payment hash not found in escrow");
        require(payment.executed,        "AP2Settlement: payment has not been executed in escrow");
        require(payment.workflowId == workflowId, "AP2Settlement: payment workflow ID mismatch");

        settlements[workflowId] = Settlement({
            workflowId:    workflowId,
            paymentTxHash: paymentTxHash,
            amount:        amount,
            timestamp:     block.timestamp,
            finalized:     false
        });

        emit SettlementInitiated(workflowId, paymentTxHash, amount);
    }

    /**
     * @dev Finalize settlement. Only callable by workflow contract.
     *      Settlement must have been initiated first.
     */
    function finalizeSettlement(uint256 workflowId) external onlyWorkflowContract {
        Settlement storage settlement = settlements[workflowId];
        require(settlement.timestamp > 0, "AP2Settlement: settlement not found");
        require(!settlement.finalized,    "AP2Settlement: already finalized");

        settlement.finalized = true;

        emit SettlementVerified(workflowId);
        emit SettlementFinalized(workflowId, block.timestamp);
    }

    /**
     * @dev Get settlement details including on-chain verification status.
     */
    function getSettlement(uint256 workflowId) external view returns (Settlement memory) {
        return settlements[workflowId];
    }

    /**
     * @dev Check if settlement is finalized.
     */
    function isFinalized(uint256 workflowId) external view returns (bool) {
        return settlements[workflowId].finalized;
    }

    /**
     * @dev Verify payment is executed on-chain (view, no state change).
     *      Can be called by anyone to independently confirm settlement validity.
     */
    function verifyPaymentExecuted(bytes32 paymentTxHash) external view returns (bool) {
        X402Escrow.Payment memory payment = x402Escrow.getPayment(paymentTxHash);
        return payment.executed;
    }
}
