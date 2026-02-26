// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IERC8004Agent
 * @dev Interface for ERC-8004 compliant autonomous agents.
 *
 *      Canonical ERC-8004 on SKALE uses an NFT-based IdentityRegistry
 *      (IdentityRegistry at 0x8004A818BFB912233c491871b3d84c89A494BD9e on SKALE Base Sepolia).
 *      Agents are assigned an agentId NFT for identity + a validation/reputation score.
 *
 *      This interface captures the agent-side contract capability surface:
 *      what a compliant agent contract MUST expose for indexers and frontends.
 *
 *      Interface ID: bytes4(keccak256("agentType()") ^ keccak256("agentMetadataURI()") ^
 *                           keccak256("execute(bytes)") ^ keccak256("supportsInterface(bytes4)") ^
 *                           keccak256("version()"))
 *
 *      Canonical registry addresses (SKALE Base Sepolia):
 *        IdentityRegistry:   0x8004A818BFB912233c491871b3d84c89A494BD9e
 *        ReputationRegistry: 0x8004B663056A597Dffe9eCcC1965A193B7388713
 */
interface IERC8004Agent {
    /// @dev Returns agent type identifier (e.g. "procurement")
    function agentType() external view returns (string memory);

    /// @dev Returns IPFS or HTTPS URI to agent metadata JSON.
    ///      Metadata must include: name, description, version, chain, agentType, repository.
    function agentMetadataURI() external view returns (string memory);

    /// @dev Returns semver version string, e.g. "1.0.0"
    function version() external pure returns (string memory);

    /// @dev Execute an agent action with arbitrary calldata.
    /// @param data ABI-encoded action payload
    /// @return result ABI-encoded result
    function execute(bytes calldata data) external returns (bytes memory result);

    /// @dev ERC-165 interface detection
    function supportsInterface(bytes4 interfaceId) external view returns (bool);

    /// @dev Validate registration against a given registry.
    ///      Allows frontends/indexers to verify on-chain without offchain scripts.
    /// @param registry Address of the registry contract to check against.
    /// @return valid True if this agent is registered and active in the registry.
    function validateRegistry(address registry) external view returns (bool valid);
}
