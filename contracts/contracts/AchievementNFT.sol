// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title AchievementNFT
 * @dev ERC-721 NFTs for Defeat the Dragon achievements
 * Players earn achievement NFTs by completing milestones
 */
contract AchievementNFT is ERC721, ERC721URIStorage, Ownable, Pausable {
    using Counters for Counters.Counter;
    
    Counters.Counter private _tokenIds;
    
    // Game contract that can mint achievements
    address public gameContract;
    
    // Achievement types
    enum AchievementType {
        FIRST_SESSION,      // Complete first focus session
        STREAK_7,           // 7-day streak
        STREAK_30,          // 30-day streak
        STREAK_100,         // 100-day streak
        LEVEL_5,            // Reach level 5
        LEVEL_10,           // Reach level 10
        LEVEL_25,           // Reach level 25
        SESSIONS_10,        // Complete 10 sessions
        SESSIONS_50,        // Complete 50 sessions
        SESSIONS_100,       // Complete 100 sessions
        PERFECT_SESSION,    // Complete session without disturbance
        EARLY_BIRD,         // Complete session before 8 AM
        NIGHT_OWL,          // Complete session after 10 PM
        WEEKEND_WARRIOR,    // Complete session on weekend
        FOCUS_MASTER        // Complete 5 sessions in one day
    }
    
    // Achievement metadata
    struct Achievement {
        AchievementType achievementType;
        string name;
        string description;
        string imageURI;
        uint256 timestamp;
        bool isRare;
    }
    
    // Mapping from token ID to achievement
    mapping(uint256 => Achievement) public achievements;
    
    // Mapping to track if user has earned specific achievement
    mapping(address => mapping(AchievementType => bool)) public userAchievements;
    
    // Events
    event GameContractUpdated(address indexed oldContract, address indexed newContract);
    event AchievementMinted(address indexed to, uint256 tokenId, AchievementType achievementType);
    event AchievementMetadataUpdated(uint256 tokenId, string name, string description);
    
    constructor() ERC721("Defeat the Dragon Achievements", "DDA") Ownable(msg.sender) {}
    
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
     * @dev Mint achievement NFT (only game contract)
     */
    function mintAchievement(
        address to,
        AchievementType achievementType,
        string memory name,
        string memory description,
        string memory imageURI,
        bool isRare
    ) external returns (uint256) {
        require(msg.sender == gameContract, "Only game contract can mint");
        require(to != address(0), "Cannot mint to zero address");
        require(!userAchievements[to][achievementType], "Achievement already earned");
        
        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();
        
        // Create achievement
        Achievement memory achievement = Achievement({
            achievementType: achievementType,
            name: name,
            description: description,
            imageURI: imageURI,
            timestamp: block.timestamp,
            isRare: isRare
        });
        
        achievements[newTokenId] = achievement;
        userAchievements[to][achievementType] = true;
        
        _mint(to, newTokenId);
        _setTokenURI(newTokenId, imageURI);
        
        emit AchievementMinted(to, newTokenId, achievementType);
        return newTokenId;
    }
    
    /**
     * @dev Get achievement by token ID
     */
    function getAchievement(uint256 tokenId) external view returns (Achievement memory) {
        require(_exists(tokenId), "Token does not exist");
        return achievements[tokenId];
    }
    
    /**
     * @dev Get user's achievements
     */
    function getUserAchievements(address user) external view returns (AchievementType[] memory) {
        uint256 count = 0;
        for (uint256 i = 0; i < 15; i++) { // 15 achievement types
            if (userAchievements[user][AchievementType(i)]) {
                count++;
            }
        }
        
        AchievementType[] memory userAchievementTypes = new AchievementType[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < 15; i++) {
            if (userAchievements[user][AchievementType(i)]) {
                userAchievementTypes[index] = AchievementType(i);
                index++;
            }
        }
        
        return userAchievementTypes;
    }
    
    /**
     * @dev Check if user has specific achievement
     */
    function hasAchievement(address user, AchievementType achievementType) external view returns (bool) {
        return userAchievements[user][achievementType];
    }
    
    /**
     * @dev Pause minting (only owner)
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause minting (only owner)
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Override mint to check if paused
     */
    function _mint(address to, uint256 tokenId) internal override whenNotPaused {
        super._mint(to, tokenId);
    }
    
    /**
     * @dev Override transfer to check if paused
     */
    function transferFrom(address from, address to, uint256 tokenId) public override whenNotPaused {
        super.transferFrom(from, to, tokenId);
    }
    
    /**
     * @dev Override safeTransferFrom to check if paused
     */
    function safeTransferFrom(address from, address to, uint256 tokenId) public override whenNotPaused {
        super.safeTransferFrom(from, to, tokenId);
    }
    
    /**
     * @dev Override safeTransferFrom with data to check if paused
     */
    function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory data) public override whenNotPaused {
        super.safeTransferFrom(from, to, tokenId, data);
    }
    
    // Override required functions
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }
    
    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
