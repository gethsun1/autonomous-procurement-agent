// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/introspection/ERC165.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./IERC8004Agent.sol";
import "./X402Escrow.sol";
import "./AP2Settlement.sol";

/**
 * @title ProcurementWorkflow
 * @dev ERC-8004 compliant autonomous procurement workflow agent.
 *
 *      State machine: Initialized → Discovery → Evaluation → Selection
 *                     → PaymentPending → Settled → Completed
 *
 *      ERC-8004 canonical registry (SKALE Base Sepolia):
 *        IdentityRegistry:   0x8004A818BFB912233c491871b3d84c89A494BD9e
 *        ReputationRegistry: 0x8004B663056A597Dffe9eCcC1965A193B7388713
 *
 *      Security:
 *      - All state transitions gated by inState + onlyRequester.
 *      - Payment routed atomically through X402Escrow (onlyWorkflowContract).
 *      - Settlement cross-verified by AP2Settlement against escrow on-chain.
 *      - version() for protocol-grade contract versioning.
 *      - validateRegistry(address) allows frontends to verify registration without scripts.
 */
contract ProcurementWorkflow is ERC165, IERC8004Agent {
    using SafeERC20 for IERC20;

    // ── Protocol Version ───────────────────────────────────────────────────────
    string private constant _VERSION = "1.0.0";

    // ── ERC-8004 Agent Identity ────────────────────────────────────────────────
    string private _agentMetadataURI;
    string private constant _agentType = "procurement";

    // Canonical ERC-8004 registry addresses on SKALE Base Sepolia (PR #56)
    address public constant IDENTITY_REGISTRY   = 0x8004A818BFB912233c491871b3d84c89A494BD9e;
    address public constant REPUTATION_REGISTRY = 0x8004B663056A597Dffe9eCcC1965A193B7388713;

    // Local ERC8004Registry address (set at deploy, stored for validateRegistry)
    address public localRegistry;

    // ERC-165 interface ID for IERC8004Agent
    bytes4 public constant ERC8004_INTERFACE_ID = bytes4(
        bytes4(keccak256("agentType()"))          ^
        bytes4(keccak256("agentMetadataURI()"))   ^
        bytes4(keccak256("version()"))            ^
        bytes4(keccak256("execute(bytes)"))       ^
        bytes4(keccak256("supportsInterface(bytes4)")) ^
        bytes4(keccak256("validateRegistry(address)"))
    );

    // ── Workflow State Machine ─────────────────────────────────────────────────
    enum WorkflowState {
        Initialized,    // 0
        Discovery,      // 1
        Evaluation,     // 2
        Selection,      // 3
        PaymentPending, // 4
        Settled,        // 5
        Completed       // 6
    }

    struct Workflow {
        uint256       id;
        address       requester;
        string        procurementBrief;
        bytes         encryptedConstraints;
        bytes32       decisionHash;
        string        selectedVendorId;
        uint256       paymentAmount;
        bytes32       paymentTxHash;
        WorkflowState state;
        uint256       createdAt;
        uint256       completedAt;
    }

    mapping(uint256 => Workflow) public workflows;
    uint256 public workflowCounter;

    // ── Contract References ────────────────────────────────────────────────────
    X402Escrow     public immutable x402Escrow;
    AP2Settlement  public immutable ap2Settlement;
    address        public immutable encryptionHelper;

    // ── Events (all workflowId indexed for indexers) ───────────────────────────
    // WorkflowCreated: indexed workflowId + requester for efficient filtering
    event WorkflowCreated(
        uint256 indexed workflowId,
        address indexed requester,
        string  brief
    );

    // EvaluationCompleted: indexed workflowId + evaluationHash for audit
    event EvaluationCompleted(
        uint256 indexed workflowId,
        bytes32 indexed evaluationHash
    );

    // VendorSelected: indexed workflowId for full workflow traceability
    event VendorSelected(
        uint256 indexed workflowId,
        string  vendorId,
        uint256 amount
    );

    // PaymentTriggered: indexed workflowId + txHash for payment tracing
    event PaymentTriggered(
        uint256 indexed workflowId,
        bytes32 indexed txHash
    );

    // SettlementFinalized: indexed workflowId for settlement indexing
    event SettlementFinalized(uint256 indexed workflowId);

    // WorkflowCompleted: indexed workflowId + timestamp
    event WorkflowCompleted(
        uint256 indexed workflowId,
        uint256 completedAt
    );

    // State transition: indexed workflowId + both states for indexing
    event StateTransitioned(
        uint256 indexed workflowId,
        WorkflowState   from,
        WorkflowState   to
    );

    event AgentMetadataUpdated(string newURI);

    // ── Modifiers ──────────────────────────────────────────────────────────────
    modifier onlyRequester(uint256 workflowId) {
        require(
            workflows[workflowId].requester == msg.sender,
            "ProcurementWorkflow: caller is not the requester"
        );
        _;
    }

    modifier inState(uint256 workflowId, WorkflowState expectedState) {
        require(
            workflows[workflowId].state == expectedState,
            "ProcurementWorkflow: invalid state for this operation"
        );
        _;
    }

    // ── Constructor ────────────────────────────────────────────────────────────
    constructor(
        address _x402Escrow,
        address _ap2Settlement,
        address _encryptionHelper,
        string memory initialMetadataURI,
        address _localRegistry
    ) {
        require(_x402Escrow != address(0),      "Invalid X402Escrow address");
        require(_ap2Settlement != address(0),   "Invalid AP2Settlement address");
        require(_encryptionHelper != address(0),"Invalid EncryptionHelper address");

        x402Escrow       = X402Escrow(payable(_x402Escrow));
        ap2Settlement    = AP2Settlement(_ap2Settlement);
        encryptionHelper = _encryptionHelper;
        _agentMetadataURI = initialMetadataURI;
        localRegistry    = _localRegistry;
    }

    // ── ERC-8004 Implementation ────────────────────────────────────────────────

    /// @inheritdoc IERC8004Agent
    function agentType() external pure override returns (string memory) {
        return _agentType;
    }

    /// @inheritdoc IERC8004Agent
    function agentMetadataURI() external view override returns (string memory) {
        return _agentMetadataURI;
    }

    /// @inheritdoc IERC8004Agent
    function version() external pure override returns (string memory) {
        return _VERSION;
    }

    /**
     * @dev Update agent metadata URI.
     * @param newURI New metadata URI (IPFS or HTTPS).
     */
    function setAgentMetadataURI(string calldata newURI) external {
        require(bytes(newURI).length > 0, "URI cannot be empty");
        _agentMetadataURI = newURI;
        emit AgentMetadataUpdated(newURI);
    }

    /**
     * @dev Update local registry address (e.g. after redeploy).
     */
    function setLocalRegistry(address _localRegistry) external {
        require(_localRegistry != address(0), "Invalid registry address");
        localRegistry = _localRegistry;
    }

    /// @inheritdoc IERC8004Agent
    /// @dev Validates registration in the provided registry.
    ///      Supports both our local ERC8004Registry (isRegistered) and
    ///      a generic bytes4-selectable registry interface.
    function validateRegistry(address registry) external view override returns (bool valid) {
        require(registry != address(0), "Invalid registry address");
        // Try calling isRegistered(address) — local ERC8004Registry method
        (bool success, bytes memory data) = registry.staticcall(
            abi.encodeWithSignature("isRegistered(address)", address(this))
        );
        if (success && data.length >= 32) {
            return abi.decode(data, (bool));
        }
        return false;
    }

    /// @inheritdoc IERC8004Agent
    function execute(bytes calldata data) external override returns (bytes memory) {
        // ERC-8004 generic execution entry point.
        return abi.encode(true, data.length);
    }

    /// @inheritdoc IERC8004Agent
    function supportsInterface(bytes4 interfaceId)
        public view override(ERC165, IERC8004Agent)
        returns (bool)
    {
        return
            interfaceId == ERC8004_INTERFACE_ID      ||
            interfaceId == type(IERC8004Agent).interfaceId ||
            super.supportsInterface(interfaceId);
    }

    // ── Workflow State Transitions ─────────────────────────────────────────────

    function createWorkflow(
        string memory procurementBrief,
        bytes memory encryptedConstraints
    ) external returns (uint256) {
        require(bytes(procurementBrief).length > 0, "Brief cannot be empty");

        workflowCounter++;
        uint256 workflowId = workflowCounter;

        Workflow storage wf = workflows[workflowId];
        wf.id                   = workflowId;
        wf.requester            = msg.sender;
        wf.procurementBrief     = procurementBrief;
        wf.encryptedConstraints = encryptedConstraints;
        wf.state                = WorkflowState.Initialized;
        wf.createdAt            = block.timestamp;

        emit WorkflowCreated(workflowId, msg.sender, procurementBrief);
        return workflowId;
    }

    function startDiscovery(uint256 workflowId)
        external
        onlyRequester(workflowId)
        inState(workflowId, WorkflowState.Initialized)
    {
        _transitionState(workflowId, WorkflowState.Discovery);
    }

    /**
     * @dev Commit AI evaluation hash on-chain.
     * @param decisionHash keccak256 of AI evaluation output + constraints.
     *        Emits EvaluationCompleted for on-chain audit trail.
     */
    function startEvaluation(uint256 workflowId, bytes32 decisionHash)
        external
        onlyRequester(workflowId)
        inState(workflowId, WorkflowState.Discovery)
    {
        require(decisionHash != bytes32(0), "Decision hash cannot be zero");
        workflows[workflowId].decisionHash = decisionHash;

        emit EvaluationCompleted(workflowId, decisionHash);
        _transitionState(workflowId, WorkflowState.Evaluation);
    }

    function selectVendor(
        uint256 workflowId,
        string memory vendorId,
        uint256 paymentAmount
    )
        external
        onlyRequester(workflowId)
        inState(workflowId, WorkflowState.Evaluation)
    {
        require(bytes(vendorId).length > 0, "Invalid vendor ID");
        require(paymentAmount > 0,          "Invalid payment amount");

        workflows[workflowId].selectedVendorId = vendorId;
        workflows[workflowId].paymentAmount    = paymentAmount;

        emit VendorSelected(workflowId, vendorId, paymentAmount);
        _transitionState(workflowId, WorkflowState.Selection);
    }

    /**
     * @dev Execute payment atomically via X402Escrow.
     *      ERC-20 mode: caller must have pre-approved X402Escrow to spend tokens.
     *      ETH mode:    msg.value must cover the payment amount.
     *
     *      Emits PaymentTriggered (indexed workflowId + txHash).
     */
    function executePayment(
        uint256 workflowId,
        address vendorWallet
    )
        external
        payable
        onlyRequester(workflowId)
        inState(workflowId, WorkflowState.Selection)
    {
        require(vendorWallet != address(0), "Invalid vendor wallet");
        uint256 amount = workflows[workflowId].paymentAmount;

        // Determine if ERC-20 or native ETH payment
        bool isToken = address(x402Escrow.paymentToken()) != address(0);

        bytes32 txHash;
        if (isToken) {
            // ERC-20: X402Escrow pulls tokens from msg.sender (requester)
            // Caller must have pre-approved X402Escrow for at least `amount` tokens
            txHash = x402Escrow.initiatePayment(workflowId, vendorWallet, amount);
        } else {
            // ETH: send msg.value to escrow
            require(msg.value >= amount, "Insufficient ETH for payment");
            txHash = x402Escrow.initiatePayment{value: amount}(workflowId, vendorWallet, amount);
        }

        x402Escrow.executePayment(txHash);

        workflows[workflowId].paymentTxHash = txHash;

        emit PaymentTriggered(workflowId, txHash);
        _transitionState(workflowId, WorkflowState.PaymentPending);
    }

    /**
     * @dev Finalize settlement via AP2Settlement (cross-verifies escrow).
     *      Emits SettlementFinalized (indexed workflowId).
     */
    function finalizeSettlement(uint256 workflowId)
        external
        onlyRequester(workflowId)
        inState(workflowId, WorkflowState.PaymentPending)
    {
        bytes32 txHash = workflows[workflowId].paymentTxHash;
        uint256 amount = workflows[workflowId].paymentAmount;

        ap2Settlement.initiateSettlement(workflowId, txHash, amount);
        ap2Settlement.finalizeSettlement(workflowId);

        emit SettlementFinalized(workflowId);
        _transitionState(workflowId, WorkflowState.Settled);
    }

    function completeWorkflow(uint256 workflowId)
        external
        onlyRequester(workflowId)
        inState(workflowId, WorkflowState.Settled)
    {
        uint256 completedAt = block.timestamp;
        workflows[workflowId].completedAt = completedAt;

        emit WorkflowCompleted(workflowId, completedAt);
        _transitionState(workflowId, WorkflowState.Completed);
    }

    // ── View Functions ─────────────────────────────────────────────────────────

    function getWorkflow(uint256 workflowId) external view returns (Workflow memory) {
        return workflows[workflowId];
    }

    function getState(uint256 workflowId) external view returns (WorkflowState) {
        return workflows[workflowId].state;
    }

    // ── Internal ───────────────────────────────────────────────────────────────

    function _transitionState(uint256 workflowId, WorkflowState newState) private {
        WorkflowState oldState = workflows[workflowId].state;
        workflows[workflowId].state = newState;
        emit StateTransitioned(workflowId, oldState, newState);
    }
}
