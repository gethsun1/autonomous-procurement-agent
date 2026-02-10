// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title ProcurementWorkflow
 * @dev ERC-8004 compliant autonomous procurement workflow
 * Manages state transitions from request to settlement
 */
contract ProcurementWorkflow {
    
    // Workflow states following ERC-8004
    enum WorkflowState {
        Initialized,
        Discovery,
        Evaluation,
        Selection,
        PaymentPending,
        Settled,
        Completed
    }
    
    struct Workflow {
        uint256 id;
        address requester;
        string procurementBrief;
        bytes encryptedConstraints; // Budget, weights, thresholds
        bytes32 decisionHash; // Commitment to Gemini evaluation
        string selectedVendorId;
        uint256 paymentAmount;
        bytes32 paymentTxHash;
        WorkflowState state;
        uint256 createdAt;
        uint256 completedAt;
    }
    
    // State storage
    mapping(uint256 => Workflow) public workflows;
    uint256 public workflowCounter;
    
    // Contract references
    address public x402Payment;
    address public ap2Settlement;
    address public encryptionHelper;
    
    // Events
    event WorkflowCreated(uint256 indexed workflowId, address indexed requester, string brief);
    event StateTransitioned(uint256 indexed workflowId, WorkflowState from, WorkflowState to);
    event VendorSelected(uint256 indexed workflowId, string vendorId, uint256 amount);
    event PaymentExecuted(uint256 indexed workflowId, bytes32 txHash);
    event SettlementCompleted(uint256 indexed workflowId);
    event WorkflowCompleted(uint256 indexed workflowId, uint256 completedAt);
    
    // Modifiers
    modifier onlyRequester(uint256 workflowId) {
        require(workflows[workflowId].requester == msg.sender, "Not requester");
        _;
    }
    
    modifier inState(uint256 workflowId, WorkflowState expectedState) {
        require(workflows[workflowId].state == expectedState, "Invalid state");
        _;
    }
    
    constructor(address _x402Payment, address _ap2Settlement, address _encryptionHelper) {
        x402Payment = _x402Payment;
        ap2Settlement = _ap2Settlement;
        encryptionHelper = _encryptionHelper;
    }
    
    /**
     * @dev Create a new procurement workflow
     */
    function createWorkflow(
        string memory procurementBrief,
        bytes memory encryptedConstraints
    ) external returns (uint256) {
        workflowCounter++;
        uint256 workflowId = workflowCounter;
        
        Workflow storage workflow = workflows[workflowId];
        workflow.id = workflowId;
        workflow.requester = msg.sender;
        workflow.procurementBrief = procurementBrief;
        workflow.encryptedConstraints = encryptedConstraints;
        workflow.state = WorkflowState.Initialized;
        workflow.createdAt = block.timestamp;
        
        emit WorkflowCreated(workflowId, msg.sender, procurementBrief);
        
        return workflowId;
    }
    
    /**
     * @dev Transition to Discovery state
     */
    function startDiscovery(uint256 workflowId) 
        external 
        onlyRequester(workflowId)
        inState(workflowId, WorkflowState.Initialized) 
    {
        _transitionState(workflowId, WorkflowState.Discovery);
    }
    
    /**
     * @dev Transition to Evaluation state with decision commitment
     */
    function startEvaluation(uint256 workflowId, bytes32 decisionHash) 
        external 
        onlyRequester(workflowId)
        inState(workflowId, WorkflowState.Discovery) 
    {
        workflows[workflowId].decisionHash = decisionHash;
        _transitionState(workflowId, WorkflowState.Evaluation);
    }
    
    /**
     * @dev Select vendor and prepare for payment
     */
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
        require(paymentAmount > 0, "Invalid amount");
        
        workflows[workflowId].selectedVendorId = vendorId;
        workflows[workflowId].paymentAmount = paymentAmount;
        
        emit VendorSelected(workflowId, vendorId, paymentAmount);
        _transitionState(workflowId, WorkflowState.Selection);
    }
    
    /**
     * @dev Execute payment via x402
     */
    function executePayment(uint256 workflowId, bytes32 txHash) 
        external 
        onlyRequester(workflowId)
        inState(workflowId, WorkflowState.Selection) 
    {
        workflows[workflowId].paymentTxHash = txHash;
        
        emit PaymentExecuted(workflowId, txHash);
        _transitionState(workflowId, WorkflowState.PaymentPending);
    }
    
    /**
     * @dev Finalize settlement via AP2
     */
    function finalizeSettlement(uint256 workflowId) 
        external 
        onlyRequester(workflowId)
        inState(workflowId, WorkflowState.PaymentPending) 
    {
        emit SettlementCompleted(workflowId);
        _transitionState(workflowId, WorkflowState.Settled);
    }
    
    /**
     * @dev Mark workflow as completed
     */
    function completeWorkflow(uint256 workflowId) 
        external 
        onlyRequester(workflowId)
        inState(workflowId, WorkflowState.Settled) 
    {
        workflows[workflowId].completedAt = block.timestamp;
        
        emit WorkflowCompleted(workflowId, block.timestamp);
        _transitionState(workflowId, WorkflowState.Completed);
    }
    
    /**
     * @dev Internal state transition function
     */
    function _transitionState(uint256 workflowId, WorkflowState newState) private {
        WorkflowState oldState = workflows[workflowId].state;
        workflows[workflowId].state = newState;
        
        emit StateTransitioned(workflowId, oldState, newState);
    }
    
    /**
     * @dev Get full workflow details
     */
    function getWorkflow(uint256 workflowId) 
        external 
        view 
        returns (Workflow memory) 
    {
        return workflows[workflowId];
    }
    
    /**
     * @dev Get current state
     */
    function getState(uint256 workflowId) external view returns (WorkflowState) {
        return workflows[workflowId].state;
    }
}
