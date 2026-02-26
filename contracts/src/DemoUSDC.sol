// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title DemoUSDC
 * @dev Custom ERC-20 token used to demonstrate procurement payment flows
 *      on SKALE Base Sepolia testnet where real USDC is not easily available.
 *
 *      Properties:
 *      - 6 decimals (matches USDC convention)
 *      - Owner can mint freely (for demo/faucet purposes)
 *      - 10,000,000 initial supply minted to deployer
 *      - Public faucet: anyone can claim 1,000 USDC per address (once)
 *
 *      Symbol: USDC  (to make demo UI look realistic)
 *      Name:   Demo USDC
 *
 *      ⚠️  NOT a real USDC. For local demo and testnet only.
 */
contract DemoUSDC is ERC20, Ownable {

    uint8 private constant _DECIMALS = 6;
    uint256 public constant INITIAL_SUPPLY = 10_000_000 * 10 ** 6; // 10M USDC
    uint256 public constant FAUCET_AMOUNT  =      1_000 * 10 ** 6; // 1,000 USDC per claim

    // Faucet: one free claim per address
    mapping(address => bool) public faucetClaimed;

    event FaucetClaimed(address indexed recipient, uint256 amount);
    event TokensMinted(address indexed to, uint256 amount);

    constructor(address initialOwner) ERC20("Demo USDC", "USDC") Ownable(initialOwner) {
        _mint(initialOwner, INITIAL_SUPPLY);
    }

    /// @dev Returns 6 decimals (matching USDC convention)
    function decimals() public pure override returns (uint8) {
        return _DECIMALS;
    }

    /// @dev Owner can mint additional tokens (for demo scenarios)
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
        emit TokensMinted(to, amount);
    }

    /**
     * @dev Free faucet — anyone can claim 1,000 USDC once.
     *      Used so vendor wallets can be pre-funded for demo.
     */
    function claimFaucet() external {
        require(!faucetClaimed[msg.sender], "DemoUSDC: already claimed");
        faucetClaimed[msg.sender] = true;
        _mint(msg.sender, FAUCET_AMOUNT);
        emit FaucetClaimed(msg.sender, FAUCET_AMOUNT);
    }

    /**
     * @dev Batch pre-fund multiple addresses (owner only).
     *      Used in deploy to pre-fund simulated vendor wallets.
     */
    function batchMint(address[] calldata recipients, uint256 amountEach) external onlyOwner {
        for (uint256 i = 0; i < recipients.length; i++) {
            _mint(recipients[i], amountEach);
            emit TokensMinted(recipients[i], amountEach);
        }
    }

    /// @dev Version identifier
    function version() external pure returns (string memory) { return "1.0.0"; }
}
