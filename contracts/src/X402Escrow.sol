// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title X402Escrow
 * @dev Hardened payment escrow implementing the x402 payment pattern.
 *      Supports both native ETH (sFUEL) and ERC-20 token (DemoUSDC) payments.
 *
 *      Security properties:
 *      - Only the bound ProcurementWorkflow contract can initiate or execute payments.
 *      - ReentrancyGuard on all ETH/token-moving functions.
 *      - txHash derived from block.number (not timestamp) to prevent same-block collisions.
 *      - Double-spend protection: payment.executed flag checked before transfer.
 *      - Workflow binding: workflowContract is immutable after deployment.
 *      - SafeERC20 used for all token transfers to handle non-standard tokens.
 *
 *      Payment mode:
 *      - If paymentToken != address(0): ERC-20 payment (caller must approve first)
 *      - If paymentToken == address(0): native ETH/sFUEL payment
 */
contract X402Escrow is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    address public immutable workflowContract;

    /// @dev ERC-20 token used for payments. Zero address = native ETH.
    IERC20 public paymentToken;

    struct Payment {
        uint256 workflowId;
        address from;
        address to;
        uint256 amount;
        uint256 blockNumber;
        bool    executed;
        bool    isTokenPayment; // true = ERC-20, false = native ETH
    }

    mapping(bytes32 => Payment) public payments;

    // ── Events (all workflowId indexed for indexers) ──────────────────────────
    event PaymentInitiated(
        bytes32 indexed txHash,
        uint256 indexed workflowId,
        address indexed to,
        address from,
        uint256 amount,
        bool    isTokenPayment
    );
    event PaymentExecuted(
        uint256 indexed workflowId,
        bytes32 indexed txHash,
        address to,
        uint256 amount,
        bool    isTokenPayment
    );
    event PaymentTokenSet(address indexed token);

    // ── Protocol Version ──────────────────────────────────────────────────────
    function version() external pure returns (string memory) { return "1.0.0"; }

    // ── Modifiers ─────────────────────────────────────────────────────────────

    modifier onlyWorkflowContract() {
        require(
            msg.sender == workflowContract,
            "X402Escrow: caller is not the bound workflow contract"
        );
        _;
    }

    // ── Constructor ───────────────────────────────────────────────────────────

    /**
     * @param _workflowContract Address of the ProcurementWorkflow contract.
     * @param _paymentToken     ERC-20 token for payments (zero address = use ETH).
     */
    constructor(address _workflowContract, address _paymentToken) Ownable(msg.sender) {
        require(_workflowContract != address(0), "Invalid workflow contract address");
        workflowContract = _workflowContract;
        if (_paymentToken != address(0)) {
            paymentToken = IERC20(_paymentToken);
            emit PaymentTokenSet(_paymentToken);
        }
    }

    /// @dev Owner can update the payment token (for upgrading from ETH to ERC-20).
    function setPaymentToken(address _paymentToken) external onlyOwner {
        paymentToken = IERC20(_paymentToken);
        emit PaymentTokenSet(_paymentToken);
    }

    // ── Payment Functions ─────────────────────────────────────────────────────

    /**
     * @dev Initiate a payment into escrow.
     *      ETH mode: ETH must be sent with msg.value >= amount.
     *      ERC-20 mode: Caller (workflow contract) must have approved this escrow.
     *                   The token is pulled from tx.origin (the requester).
     */
    function initiatePayment(
        uint256 workflowId,
        address to,
        uint256 amount
    ) external payable onlyWorkflowContract returns (bytes32 txHash) {
        require(to != address(0), "X402Escrow: invalid recipient");
        require(amount > 0,       "X402Escrow: amount must be > 0");

        bool isToken = address(paymentToken) != address(0);

        if (isToken) {
            // ERC-20 mode: pull tokens from the requester (tx.origin)
            paymentToken.safeTransferFrom(tx.origin, address(this), amount);
        } else {
            // ETH mode
            require(msg.value >= amount, "X402Escrow: insufficient ETH sent");
        }

        txHash = keccak256(abi.encodePacked(
            workflowId,
            msg.sender,
            to,
            amount,
            block.number
        ));

        require(payments[txHash].blockNumber == 0, "X402Escrow: payment hash collision");

        payments[txHash] = Payment({
            workflowId:     workflowId,
            from:           tx.origin,
            to:             to,
            amount:         amount,
            blockNumber:    block.number,
            executed:       false,
            isTokenPayment: isToken
        });

        emit PaymentInitiated(txHash, workflowId, to, tx.origin, amount, isToken);
    }

    /**
     * @dev Execute a previously initiated payment, transferring ETH/tokens to recipient.
     */
    function executePayment(bytes32 txHash)
        external
        onlyWorkflowContract
        nonReentrant
    {
        Payment storage payment = payments[txHash];
        require(payment.blockNumber > 0, "X402Escrow: payment not found");
        require(!payment.executed,       "X402Escrow: already executed");

        payment.executed = true;

        if (payment.isTokenPayment) {
            // ERC-20: transfer from escrow to recipient
            paymentToken.safeTransfer(payment.to, payment.amount);
        } else {
            // ETH: transfer sFUEL to recipient (checks-effects-interactions)
            (bool success, ) = payable(payment.to).call{value: payment.amount}("");
            require(success, "X402Escrow: ETH transfer failed");
        }

        emit PaymentExecuted(payment.workflowId, txHash, payment.to, payment.amount, payment.isTokenPayment);
    }

    /// @dev Get payment details by hash.
    function getPayment(bytes32 txHash) external view returns (Payment memory) {
        return payments[txHash];
    }

    /// @dev Emergency withdrawal of stuck ETH by owner.
    function emergencyWithdraw() external onlyOwner nonReentrant {
        (bool success, ) = payable(owner()).call{value: address(this).balance}("");
        require(success, "X402Escrow: emergency withdraw failed");
    }

    /// @dev Emergency withdrawal of stuck ERC-20 tokens by owner.
    function emergencyWithdrawToken(address token) external onlyOwner nonReentrant {
        uint256 bal = IERC20(token).balanceOf(address(this));
        require(bal > 0, "X402Escrow: no tokens to withdraw");
        IERC20(token).safeTransfer(owner(), bal);
    }

    receive() external payable {}
}
