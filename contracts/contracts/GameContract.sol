// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./FocusToken.sol";
import "./AchievementNFT.sol";

/**
 * @title GameContract
 * @dev Main contract for Defeat the Dragon game logic
 * Handles focus session completion, rewards, and achievements
 */
contract GameContract is Ownable, Pausable, ReentrancyGuard {
    // Token and NFT contracts
    FocusToken public focusToken;
    AchievementNFT public achievementNFT;
    
    // Session tracking
    struct FocusSession {
        address player;
        uint256 startTime;
        uint256 duration;
        uint256 xpEarned;
        uint256 tokensEarned;
        bool completed;
        bool disturbed;
    }
    
    // Player stats
    struct PlayerStats {
        uint256 totalSessions;
        uint256 totalXp;
        uint256 totalTokens;
        uint256 currentStreak;
        uint256 longestStreak;
        uint256 lastSessionTime;
        uint256 level;
    }
    
    // Mapping from session ID to session data
    mapping(bytes32 => FocusSession) public sessions;
    
    // Mapping from player address to stats
    mapping(address => PlayerStats) public playerStats;
    
    // Session counter
    uint256 public sessionCounter;
    
    // Reward multipliers (in basis points, 10000 = 100%)
    uint256 public xpMultiplier = 10000;
    uint256 public tokenMultiplier = 10000;
    
    // Events
    event SessionStarted(bytes32 indexed sessionId, address indexed player, uint256 startTime, uint256 duration);
    event SessionCompleted(bytes32 indexed sessionId, address indexed player, uint256 xpEarned, uint256 tokensEarned);
    event SessionFailed(bytes32 indexed sessionId, address indexed player, string reason);
    event AchievementUnlocked(address indexed player, AchievementNFT.AchievementType achievementType);
    event MultipliersUpdated(uint256 xpMultiplier, uint256 tokenMultiplier);
    
    constructor(address _focusToken, address _achievementNFT) Ownable(msg.sender) {
        focusToken = FocusToken(_focusToken);
        achievementNFT = AchievementNFT(_achievementNFT);
    }
    
    /**
     * @dev Start a focus session (called by frontend)
     */
    function startSession(uint256 duration) external whenNotPaused returns (bytes32) {
        require(duration >= 5 && duration <= 120, "Duration must be between 5 and 120 minutes");
        require(duration % 5 == 0, "Duration must be in 5-minute increments");
        
        bytes32 sessionId = keccak256(abi.encodePacked(msg.sender, block.timestamp, sessionCounter));
        sessionCounter++;
        
        sessions[sessionId] = FocusSession({
            player: msg.sender,
            startTime: block.timestamp,
            duration: duration,
            xpEarned: 0,
            tokensEarned: 0,
            completed: false,
            disturbed: false
        });
        
        emit SessionStarted(sessionId, msg.sender, block.timestamp, duration);
        return sessionId;
    }
    
    /**
     * @dev Complete a focus session and award rewards
     */
    function completeSession(
        bytes32 sessionId,
        bool wasDisturbed,
        uint256 actualDuration
    ) external whenNotPaused nonReentrant {
        FocusSession storage session = sessions[sessionId];
        require(session.player == msg.sender, "Not your session");
        require(!session.completed, "Session already completed");
        require(block.timestamp >= session.startTime + session.duration * 60, "Session not finished");
        
        session.completed = true;
        session.disturbed = wasDisturbed;
        
        if (!wasDisturbed) {
            // Calculate rewards
            uint256 baseXp = actualDuration * 10; // 10 XP per minute
            uint256 baseTokens = actualDuration * 6; // 6 tokens per minute
            
            uint256 xpEarned = (baseXp * xpMultiplier) / 10000;
            uint256 tokensEarned = (baseTokens * tokenMultiplier) / 10000;
            
            session.xpEarned = xpEarned;
            session.tokensEarned = tokensEarned;
            
            // Update player stats
            PlayerStats storage stats = playerStats[msg.sender];
            stats.totalSessions++;
            stats.totalXp += xpEarned;
            stats.totalTokens += tokensEarned;
            stats.lastSessionTime = block.timestamp;
            
            // Update streak
            if (block.timestamp - stats.lastSessionTime <= 86400) { // 24 hours
                stats.currentStreak++;
                if (stats.currentStreak > stats.longestStreak) {
                    stats.longestStreak = stats.currentStreak;
                }
            } else {
                stats.currentStreak = 1;
            }
            
            // Calculate level (simple formula: level = sqrt(totalXP / 100))
            stats.level = uint256(sqrt(stats.totalXp / 100)) + 1;
            
            // Mint tokens
            focusToken.mintForFocusSession(msg.sender, tokensEarned, "Focus session completion");
            
            // Check for achievements
            checkAndMintAchievements(msg.sender, stats);
            
            emit SessionCompleted(sessionId, msg.sender, xpEarned, tokensEarned);
        } else {
            emit SessionFailed(sessionId, msg.sender, "Session was disturbed");
        }
    }
    
    /**
     * @dev Check and mint achievements based on player stats
     */
    function checkAndMintAchievements(address player, PlayerStats storage stats) internal {
        // First session achievement
        if (stats.totalSessions == 1) {
            mintAchievement(player, AchievementNFT.AchievementType.FIRST_SESSION, 
                "First Steps", "Complete your first focus session", 
                "ipfs://QmFirstSession", false);
        }
        
        // Streak achievements
        if (stats.currentStreak >= 7 && !achievementNFT.hasAchievement(player, AchievementNFT.AchievementType.STREAK_7)) {
            mintAchievement(player, AchievementNFT.AchievementType.STREAK_7,
                "Week Warrior", "Maintain a 7-day focus streak",
                "ipfs://QmStreak7", false);
        }
        
        if (stats.currentStreak >= 30 && !achievementNFT.hasAchievement(player, AchievementNFT.AchievementType.STREAK_30)) {
            mintAchievement(player, AchievementNFT.AchievementType.STREAK_30,
                "Monthly Master", "Maintain a 30-day focus streak",
                "ipfs://QmStreak30", true);
        }
        
        if (stats.currentStreak >= 100 && !achievementNFT.hasAchievement(player, AchievementNFT.AchievementType.STREAK_100)) {
            mintAchievement(player, AchievementNFT.AchievementType.STREAK_100,
                "Century Champion", "Maintain a 100-day focus streak",
                "ipfs://QmStreak100", true);
        }
        
        // Level achievements
        if (stats.level >= 5 && !achievementNFT.hasAchievement(player, AchievementNFT.AchievementType.LEVEL_5)) {
            mintAchievement(player, AchievementNFT.AchievementType.LEVEL_5,
                "Apprentice", "Reach level 5",
                "ipfs://QmLevel5", false);
        }
        
        if (stats.level >= 10 && !achievementNFT.hasAchievement(player, AchievementNFT.AchievementType.LEVEL_10)) {
            mintAchievement(player, AchievementNFT.AchievementType.LEVEL_10,
                "Adept", "Reach level 10",
                "ipfs://QmLevel10", false);
        }
        
        if (stats.level >= 25 && !achievementNFT.hasAchievement(player, AchievementNFT.AchievementType.LEVEL_25)) {
            mintAchievement(player, AchievementNFT.AchievementType.LEVEL_25,
                "Master", "Reach level 25",
                "ipfs://QmLevel25", true);
        }
        
        // Session count achievements
        if (stats.totalSessions >= 10 && !achievementNFT.hasAchievement(player, AchievementNFT.AchievementType.SESSIONS_10)) {
            mintAchievement(player, AchievementNFT.AchievementType.SESSIONS_10,
                "Dedicated", "Complete 10 focus sessions",
                "ipfs://QmSessions10", false);
        }
        
        if (stats.totalSessions >= 50 && !achievementNFT.hasAchievement(player, AchievementNFT.AchievementType.SESSIONS_50)) {
            mintAchievement(player, AchievementNFT.AchievementType.SESSIONS_50,
                "Committed", "Complete 50 focus sessions",
                "ipfs://QmSessions50", false);
        }
        
        if (stats.totalSessions >= 100 && !achievementNFT.hasAchievement(player, AchievementNFT.AchievementType.SESSIONS_100)) {
            mintAchievement(player, AchievementNFT.AchievementType.SESSIONS_100,
                "Century", "Complete 100 focus sessions",
                "ipfs://QmSessions100", true);
        }
    }
    
    /**
     * @dev Mint achievement NFT
     */
    function mintAchievement(
        address player,
        AchievementNFT.AchievementType achievementType,
        string memory name,
        string memory description,
        string memory imageURI,
        bool isRare
    ) internal {
        try achievementNFT.mintAchievement(player, achievementType, name, description, imageURI, isRare) {
            emit AchievementUnlocked(player, achievementType);
        } catch {
            // Achievement minting failed, but don't revert the session completion
        }
    }
    
    /**
     * @dev Get player stats
     */
    function getPlayerStats(address player) external view returns (PlayerStats memory) {
        return playerStats[player];
    }
    
    /**
     * @dev Get session data
     */
    function getSession(bytes32 sessionId) external view returns (FocusSession memory) {
        return sessions[sessionId];
    }
    
    /**
     * @dev Update reward multipliers (only owner)
     */
    function updateMultipliers(uint256 _xpMultiplier, uint256 _tokenMultiplier) external onlyOwner {
        require(_xpMultiplier <= 20000, "XP multiplier too high"); // Max 200%
        require(_tokenMultiplier <= 20000, "Token multiplier too high"); // Max 200%
        
        xpMultiplier = _xpMultiplier;
        tokenMultiplier = _tokenMultiplier;
        
        emit MultipliersUpdated(_xpMultiplier, _tokenMultiplier);
    }
    
    /**
     * @dev Pause game (only owner)
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause game (only owner)
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Square root function for level calculation
     */
    function sqrt(uint256 x) internal pure returns (uint256) {
        if (x == 0) return 0;
        uint256 z = (x + 1) / 2;
        uint256 y = x;
        while (z < y) {
            y = z;
            z = (x / z + z) / 2;
        }
        return y;
    }
}
