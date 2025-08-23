// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title FocusToken
 * @dev ERC-20 token for Defeat the Dragon focus rewards
 * Players earn FOCUS tokens by completing focus sessions
 */
contract FocusToken is ERC20, Ownable, Pausable {
    // Game contract that can mint tokens
    address public gameContract;
    
    // Events
    event GameContractUpdated(address indexed oldContract, address indexed newContract);
    event TokensMinted(address indexed to, uint256 amount, string reason);
    event TokensBurned(address indexed from, uint256 amount, string reason);
    
    constructor() ERC20("Focus Token", "FOCUS") Ownable(msg.sender) {
        // Initial supply: 1,000,000 FOCUS tokens
        _mint(msg.sender, 1000000 * 10**decimals());
    }
    
    /**
     * @dev Set the game contract address (only owner)
     */
    function setGameContract(address _gameContract) external onlyOwner {
        require(_gameContract != address(0), "Invalid game contract address");
        address oldContract = gameContract;
        gameContract = _gameContract;
        emit GameContractUpdated(oldContract, _gameContract);
    }
    
    /**
     * @dev Mint tokens for focus session completion (only game contract)
     */
    function mintForFocusSession(address to, uint256 amount, string memory reason) external {
        require(msg.sender == gameContract, "Only game contract can mint");
        require(to != address(0), "Cannot mint to zero address");
        require(amount > 0, "Amount must be greater than 0");
        
        _mint(to, amount);
        emit TokensMinted(to, amount, reason);
    }
    
    /**
     * @dev Burn tokens (for shop purchases, etc.)
     */
    function burn(uint256 amount, string memory reason) external {
        require(amount > 0, "Amount must be greater than 0");
        _burn(msg.sender, amount);
        emit TokensBurned(msg.sender, amount, reason);
    }
    
    /**
     * @dev Pause token transfers (only owner)
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause token transfers (only owner)
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Override transfer to check if paused
     */
    function transfer(address to, uint256 amount) public override whenNotPaused returns (bool) {
        return super.transfer(to, amount);
    }
    
    /**
     * @dev Override transferFrom to check if paused
     */
    function transferFrom(address from, address to, uint256 amount) public override whenNotPaused returns (bool) {
        return super.transferFrom(from, to, amount);
    }
}
