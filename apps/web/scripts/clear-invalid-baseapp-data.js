#!/usr/bin/env node

/**
 * Clear Invalid Base App Data Script
 * This script clears any invalid Base App user data that might be causing UUID errors
 */

console.log('🧹 Clearing invalid Base App user data...');

// Check if we're in a browser environment
if (typeof window !== 'undefined') {
  // Clear localStorage
  const baseAppUser = localStorage.getItem('baseAppUser');
  if (baseAppUser) {
    try {
      const parsed = JSON.parse(baseAppUser);
      if (parsed.id && parsed.id.includes('unknown')) {
        console.log('❌ Found invalid Base App user with "unknown" ID, clearing...');
        localStorage.removeItem('baseAppUser');
        localStorage.removeItem('defeat-the-dragon-storage');
        localStorage.removeItem('defeat-the-dragon-store');
        console.log('✅ Invalid Base App data cleared');
      } else {
        console.log('✅ Base App user data looks valid');
      }
    } catch (error) {
      console.log('❌ Error parsing Base App user data, clearing...');
      localStorage.removeItem('baseAppUser');
      localStorage.removeItem('defeat-the-dragon-storage');
      localStorage.removeItem('defeat-the-dragon-store');
    }
  } else {
    console.log('ℹ️ No Base App user data found');
  }
} else {
  console.log('ℹ️ Not in browser environment, manual cleanup required');
  console.log('Please clear localStorage manually:');
  console.log('1. Open browser dev tools');
  console.log('2. Go to Application/Storage tab');
  console.log('3. Clear localStorage items: baseAppUser, defeat-the-dragon-storage, defeat-the-dragon-store');
}

console.log('🎉 Cleanup complete!');
