interface LevelProgression {
  id: string;
  level: number;
  xp_to_next: number;
  cumulative_xp: number;
  description: string;
  rewards: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface LevelCalculation {
  currentLevel: number;
  currentLevelXp: number;
  xpToNextLevel: number;
  progressToNextLevel: number; // 0-1
  totalXpForCurrentLevel: number;
  totalXpForNextLevel: number;
}

let cachedProgression: Record<number, LevelProgression> | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch level progression data from API
 */
export async function fetchLevelProgression(): Promise<Record<number, LevelProgression>> {
  const now = Date.now();
  
  // Return cached data if still valid
  if (cachedProgression && (now - lastFetchTime) < CACHE_DURATION) {
    return cachedProgression;
  }

  try {
    const response = await fetch('/api/master/level-progression');
    
    if (response.ok) {
      const result = await response.json();
      if (result.success && result.data) {
        cachedProgression = result.data;
        lastFetchTime = now;
        return result.data;
      }
    }
    
    throw new Error('Failed to fetch level progression');
  } catch (error) {
    console.error('Error fetching level progression:', error);
    
    // Return cached data if available, even if expired
    if (cachedProgression) {
      return cachedProgression;
    }
    
    throw error;
  }
}

/**
 * Calculate current level and progress based on total XP
 */
export async function calculateLevel(totalXp: number): Promise<LevelCalculation> {
  const progression = await fetchLevelProgression();
  
  // Find the highest level that the player has reached
  let currentLevel = 1;
  let currentLevelXp = 0;
  let xpToNextLevel = 0;
  let totalXpForCurrentLevel = 0;
  let totalXpForNextLevel = 0;
  
  // Find current level
  for (let level = 1; level <= 99; level++) {
    const levelData = progression[level];
    if (!levelData) continue;
    
    if (totalXp >= levelData.cumulative_xp) {
      currentLevel = level;
      currentLevelXp = totalXp - levelData.cumulative_xp;
      totalXpForCurrentLevel = levelData.cumulative_xp;
    } else {
      // Found the next level
      totalXpForNextLevel = levelData.cumulative_xp;
      xpToNextLevel = levelData.cumulative_xp - totalXp;
      break;
    }
  }
  
  // Calculate progress to next level (0-1)
  const progressToNextLevel = xpToNextLevel > 0 
    ? currentLevelXp / (totalXpForNextLevel - totalXpForCurrentLevel)
    : 1;
  
  return {
    currentLevel,
    currentLevelXp,
    xpToNextLevel,
    progressToNextLevel: Math.min(progressToNextLevel, 1),
    totalXpForCurrentLevel,
    totalXpForNextLevel
  };
}

/**
 * Get XP required to reach a specific level
 */
export async function getXpForLevel(targetLevel: number): Promise<number> {
  const progression = await fetchLevelProgression();
  const levelData = progression[targetLevel];
  
  if (!levelData) {
    throw new Error(`Level ${targetLevel} not found in progression data`);
  }
  
  return levelData.cumulative_xp;
}

/**
 * Get XP required to reach the next level from current level
 */
export async function getXpToNextLevel(currentLevel: number): Promise<number> {
  const progression = await fetchLevelProgression();
  const nextLevelData = progression[currentLevel + 1];
  
  if (!nextLevelData) {
    // Max level reached
    return 0;
  }
  
  return nextLevelData.xp_to_next;
}

/**
 * Check if player can level up with given XP
 */
export async function canLevelUp(currentLevel: number, totalXp: number): Promise<boolean> {
  const progression = await fetchLevelProgression();
  const nextLevelData = progression[currentLevel + 1];
  
  if (!nextLevelData) {
    return false; // Already at max level
  }
  
  return totalXp >= nextLevelData.cumulative_xp;
}

/**
 * Get all available levels
 */
export async function getAllLevels(): Promise<LevelProgression[]> {
  const progression = await fetchLevelProgression();
  return Object.values(progression).sort((a, b) => a.level - b.level);
}

/**
 * Clear the progression cache (useful for testing or when data changes)
 */
export function clearProgressionCache(): void {
  cachedProgression = null;
  lastFetchTime = 0;
}

/**
 * Get level description
 */
export async function getLevelDescription(level: number): Promise<string> {
  const progression = await fetchLevelProgression();
  const levelData = progression[level];
  
  return levelData?.description || `Level ${level}`;
}

/**
 * Get level rewards
 */
export async function getLevelRewards(level: number): Promise<string[]> {
  const progression = await fetchLevelProgression();
  const levelData = progression[level];
  
  return levelData?.rewards || [];
}
