#!/usr/bin/env node

/**
 * Debug Base App Authentication Script
 * This script helps debug Base App authentication issues
 */

console.log('🔍 Base App Authentication Debug Script');
console.log('=====================================');

// Check if we're in a browser environment
if (typeof window !== 'undefined') {
  console.log('🌐 Browser environment detected');
  
  // Check localStorage
  console.log('\n📦 LocalStorage Check:');
  const baseAppUser = localStorage.getItem('baseAppUser');
  if (baseAppUser) {
    try {
      const parsed = JSON.parse(baseAppUser);
      console.log('✅ Base App user found:', {
        id: parsed.id,
        fid: parsed.fid,
        wallet_address: parsed.wallet_address,
        isTemporary: parsed.isTemporary,
        displayName: parsed.displayName
      });
      
      // Check for common issues
      if (parsed.id && parsed.id.includes('unknown')) {
        console.log('❌ ISSUE: User ID contains "unknown" - this will cause UUID errors');
      }
      if (!parsed.fid || parsed.fid === 0) {
        console.log('⚠️  WARNING: No valid FID found - this may cause authentication issues');
      }
      if (!parsed.wallet_address) {
        console.log('⚠️  WARNING: No wallet address found - this may cause USDC balance issues');
      }
    } catch (error) {
      console.log('❌ ERROR: Failed to parse Base App user data:', error.message);
    }
  } else {
    console.log('ℹ️  No Base App user found in localStorage');
  }
  
  // Check for other auth data
  console.log('\n🔐 Other Auth Data:');
  const walletUser = localStorage.getItem('walletUser');
  const defeatDragonStorage = localStorage.getItem('defeat-the-dragon-storage');
  
  console.log('Wallet user:', walletUser ? 'Found' : 'Not found');
  console.log('Game storage:', defeatDragonStorage ? 'Found' : 'Not found');
  
  // Check if we're in Base App environment
  console.log('\n🏠 Environment Check:');
  console.log('Hostname:', window.location.hostname);
  console.log('User Agent:', navigator.userAgent);
  console.log('Is Base App:', window.location.hostname.includes('base.app') || 
              window.location.hostname.includes('baseapp') ||
              navigator.userAgent.includes('BaseApp'));
  
  // Check for MiniKit context
  console.log('\n🔧 MiniKit Context:');
  if (window.MiniKit) {
    console.log('✅ MiniKit is available');
  } else {
    console.log('❌ MiniKit is not available');
  }
  
  // Check for ethereum provider
  console.log('\n💰 Ethereum Provider:');
  if (window.ethereum) {
    console.log('✅ Ethereum provider is available');
  } else {
    console.log('❌ Ethereum provider is not available');
  }
  
  console.log('\n🧹 Cleanup Options:');
  console.log('1. Clear all auth data: localStorage.clear()');
  console.log('2. Clear specific Base App data: localStorage.removeItem("baseAppUser")');
  console.log('3. Refresh page: window.location.reload()');
  
} else {
  console.log('ℹ️  Not in browser environment');
  console.log('Please run this script in the browser console');
}

console.log('\n🎉 Debug complete!');
