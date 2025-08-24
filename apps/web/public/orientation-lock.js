// Orientation Lock for Mobile Devices
// This script enforces portrait mode on mobile devices

(function() {
  'use strict';
  
  // Only run on mobile devices
  if (window.innerWidth > 768) {
    return;
  }
  
  // Function to check if device is in landscape
  function isLandscape() {
    return window.innerWidth > window.innerHeight;
  }
  
  // Function to show orientation warning
  function showOrientationWarning() {
    const warning = document.querySelector('.orientation-warning');
    if (warning) {
      warning.style.display = 'flex';
    }
    
    // Hide all other content
    const bodyChildren = document.body.children;
    for (let i = 0; i < bodyChildren.length; i++) {
      const child = bodyChildren[i];
      if (!child.classList.contains('orientation-warning')) {
        child.style.display = 'none';
      }
    }
  }
  
  // Function to hide orientation warning
  function hideOrientationWarning() {
    const warning = document.querySelector('.orientation-warning');
    if (warning) {
      warning.style.display = 'none';
    }
    
    // Show all other content
    const bodyChildren = document.body.children;
    for (let i = 0; i < bodyChildren.length; i++) {
      const child = bodyChildren[i];
      if (!child.classList.contains('orientation-warning')) {
        child.style.display = '';
      }
    }
  }
  
  // Check orientation on load
  if (isLandscape()) {
    showOrientationWarning();
  }
  
  // Listen for orientation changes
  window.addEventListener('orientationchange', function() {
    // Small delay to allow orientation to settle
    setTimeout(function() {
      if (isLandscape()) {
        showOrientationWarning();
      } else {
        hideOrientationWarning();
      }
    }, 100);
  });
  
  // Listen for resize events (for devices that don't support orientationchange)
  window.addEventListener('resize', function() {
    if (isLandscape()) {
      showOrientationWarning();
    } else {
      hideOrientationWarning();
    }
  });
  
  // Prevent screen orientation API if available
  if (screen.orientation && screen.orientation.lock) {
    screen.orientation.lock('portrait').catch(function(error) {
      console.log('Orientation lock not supported:', error);
    });
  }
  
  // Additional CSS injection for better enforcement
  const style = document.createElement('style');
  style.textContent = `
    @media screen and (orientation: landscape) and (max-width: 768px) {
      body {
        transform: rotate(-90deg);
        transform-origin: center center;
        width: 100vh;
        height: 100vw;
        overflow: hidden;
      }
      
      .orientation-warning {
        transform: rotate(90deg);
        transform-origin: center center;
        width: 100vh;
        height: 100vw;
        display: flex !important;
      }
    }
  `;
  document.head.appendChild(style);
  
})();
