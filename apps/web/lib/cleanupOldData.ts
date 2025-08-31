/**
 * Utility to clean up old cached data that might contain removed fields
 * This helps prevent sync errors from fields like current_streak, bond_score, etc.
 */

export function cleanupOldCachedData() {
  if (typeof window === 'undefined') return;

  console.log('Cleaning up old cached data...');

  // Clear localStorage items that might contain old data
  const keysToClear = [
    'defeat-the-dragon-storage',
    'defeat-the-dragon-store'
  ];

  keysToClear.forEach(key => {
    try {
      const data = localStorage.getItem(key);
      if (data) {
        const parsed = JSON.parse(data);
        
        // Check if the data contains removed fields
        if (parsed.state && parsed.state.player) {
          const player = parsed.state.player;
          const removedFields = ['bond_score', 'mood_state', 'day_streak', 'current_streak'];
          
          const hasRemovedFields = removedFields.some(field => player[field] !== undefined);
          
          if (hasRemovedFields) {
            console.log(`Clearing ${key} - contains removed fields:`, removedFields.filter(field => player[field] !== undefined));
            localStorage.removeItem(key);
          }
        }
      }
    } catch (error) {
      console.warn(`Error checking ${key}:`, error);
    }
  });

  // Only clear character and background stores if they contain removed fields
  const characterStoreKey = 'defeat-the-dragon-character-storage';
  const backgroundStoreKey = 'background-store';
  
  [characterStoreKey, backgroundStoreKey].forEach(key => {
    try {
      const data = localStorage.getItem(key);
      if (data) {
        const parsed = JSON.parse(data);
        
        // Only clear if the store contains removed player fields
        if (parsed.state && parsed.state.player) {
          const player = parsed.state.player;
          const removedFields = ['bond_score', 'mood_state', 'day_streak', 'current_streak'];
          
          const hasRemovedFields = removedFields.some(field => player[field] !== undefined);
          
          if (hasRemovedFields) {
            console.log(`Clearing ${key} - contains removed fields:`, removedFields.filter(field => player[field] !== undefined));
            localStorage.removeItem(key);
          }
        }
      }
    } catch (error) {
      console.warn(`Error checking ${key}:`, error);
    }
  });

  // Clear sessionStorage
  sessionStorage.clear();

  console.log('Old cached data cleanup complete');
}

// Auto-run cleanup on import
if (typeof window !== 'undefined') {
  cleanupOldCachedData();
}
