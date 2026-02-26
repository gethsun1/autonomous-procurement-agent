// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title ERC8004Registry
 * @dev On-chain registry for ERC-8004 autonomous agents deployed on SKALE.
 *      Agents self-register by calling registerAgent(). The registry is ownerless
 *      (permissionless registration) — any deployed agent can register itself.
 *      A registration event provides a verifiable on-chain proof of agent identity.
 */
contract ERC8004Registry {

    struct AgentRecord {
        address agentAddress;
        string  agentType;
        string  metadataURI;
        address registrant;
        uint256 registeredAt;
        bool    active;
    }

    mapping(address => AgentRecord) public agents;
    address[] public registeredAgents;

    event AgentRegistered(
        address indexed agentAddress,
        string  agentType,
        string  metadataURI,
        address indexed registrant,
        uint256 timestamp
    );

    event AgentDeactivated(address indexed agentAddress, uint256 timestamp);

    /**
     * @dev Register an agent. The caller (agent contract) registers itself.
     *      Can only register once per address.
     * @param agentAddress  Address of the agent contract
     * @param agentType     Agent type string (e.g. "procurement")
     * @param metadataURI   URI to agent metadata JSON
     */
    function registerAgent(
        address agentAddress,
        string calldata agentType,
        string calldata metadataURI
    ) external returns (uint256 index) {
        require(agentAddress != address(0), "Invalid agent address");
        require(bytes(agentType).length > 0, "Agent type required");
        require(bytes(metadataURI).length > 0, "Metadata URI required");
        require(!agents[agentAddress].active, "Agent already registered");

        agents[agentAddress] = AgentRecord({
            agentAddress: agentAddress,
            agentType:    agentType,
            metadataURI:  metadataURI,
            registrant:   msg.sender,
            registeredAt: block.timestamp,
            active:       true
        });

        registeredAgents.push(agentAddress);
        index = registeredAgents.length - 1;

        emit AgentRegistered(agentAddress, agentType, metadataURI, msg.sender, block.timestamp);
    }

    /**
     * @dev Deactivate an agent. Only the original registrant can deactivate.
     */
    function deactivateAgent(address agentAddress) external {
        AgentRecord storage record = agents[agentAddress];
        require(record.active, "Agent not active");
        require(record.registrant == msg.sender, "Only registrant can deactivate");

        record.active = false;
        emit AgentDeactivated(agentAddress, block.timestamp);
    }

    /**
     * @dev Check if an agent is registered and active.
     */
    function isRegistered(address agentAddress) external view returns (bool) {
        return agents[agentAddress].active;
    }

    /**
     * @dev Get total number of registered agents.
     */
    function totalAgents() external view returns (uint256) {
        return registeredAgents.length;
    }

    /**
     * @dev Get agent record by address.
     */
    function getAgent(address agentAddress) external view returns (AgentRecord memory) {
        return agents[agentAddress];
    }
}
