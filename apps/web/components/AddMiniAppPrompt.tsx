'use client';

import { useState, useEffect } from 'react';
import { useAddFrame, useMiniKit } from '@coinbase/onchainkit/minikit';

interface AddMiniAppPromptProps {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  className?: string;
  showAfterDelay?: number; // Show prompt after this delay (ms)
}

export function AddMiniAppPrompt({ 
  onSuccess, 
  onError, 
  className = '',
  showAfterDelay = 5000 // Show after 5 seconds
}: AddMiniAppPromptProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [hasAdded, setHasAdded] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  
  const addFrame = useAddFrame();
  const { context } = useMiniKit();

  // Check if app is already added to home screen
  useEffect(() => {
    const checkIfAdded = async () => {
      try {
        // Check if we're in Base App context
        if (context?.client) {
          // Check if the app is already added
          const isAlreadyAdded = context.client.added || false;
          
          if (isAlreadyAdded) {
            console.log('✅ App already added to home screen');
            setHasAdded(true);
            setIsVisible(false);
          } else {
            console.log('📱 App not yet added to home screen');
            setHasAdded(false);
          }
        } else {
          console.log('🌐 Not in Base App context, skipping add to home check');
          setHasAdded(true); // Don't show in non-Base App context
          setIsVisible(false);
        }
      } catch (error) {
        console.error('Error checking if app is added:', error);
        setHasAdded(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkIfAdded();
  }, [context?.client]);

  useEffect(() => {
    // Only show prompt if not added and not checking
    if (!hasAdded && !isChecking) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, showAfterDelay);

      return () => clearTimeout(timer);
    }
  }, [hasAdded, isChecking, showAfterDelay]);

  const handleAddMiniApp = async () => {
    try {
      setIsAdding(true);
      
      console.log('🔄 Attempting to add Mini App to home screen...');
      
      // Call the Base App addFrame action
      const result = await addFrame();
      
      console.log('📱 Add frame result:', result);
      
      if (result) {
        setHasAdded(true);
        setIsVisible(false);
        onSuccess?.();
        
        console.log('✅ Mini App added successfully to home screen');
      } else {
        console.log('❌ Add frame returned false or undefined');
        // Don't set hasAdded to false here, let user try again
      }
      
    } catch (error) {
      console.error('❌ Failed to add Mini App:', error);
      onError?.(error as Error);
      // Don't set hasAdded to false here, let user try again
    } finally {
      setIsAdding(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
  };

  // Don't render if checking, already added, or not visible
  if (isChecking || hasAdded || !isVisible) {
    return null;
  }

  return (
    <div className={`fixed top-4 left-4 right-4 z-50 ${className}`}>
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm mx-auto">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">🏠</span>
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-gray-900">
              Add to Home
            </h3>
            <p className="text-xs text-gray-600 mt-1">
              Install this app for quick access to your focus sessions and progress!
            </p>
            
            <div className="flex space-x-2 mt-3">
              <button
                onClick={handleAddMiniApp}
                disabled={isAdding}
                className="flex-1 px-3 py-1.5 bg-blue-500 text-white text-xs font-medium rounded-md hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isAdding ? 'Adding...' : 'Add App'}
              </button>
              
              <button
                onClick={handleDismiss}
                className="px-3 py-1.5 text-gray-500 text-xs font-medium hover:text-gray-700 transition-colors"
              >
                Maybe Later
              </button>
            </div>
          </div>
          
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

// Hook to manage Mini App addition state
export function useMiniAppAddition() {
  const [isAdded, setIsAdded] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Check if Mini App is already added
    const checkMiniAppStatus = async () => {
      try {
        // In a real implementation, you'd check with your backend
        // For now, we'll assume it's not added initially
        setIsAdded(false);
      } catch (error) {
        console.error('Error checking Mini App status:', error);
        setIsAdded(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkMiniAppStatus();
  }, []);

  return {
    isAdded,
    isChecking,
    setIsAdded,
  };
}
