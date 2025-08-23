'use client';

import { useState, useEffect } from 'react';

export function useDisplayNameCheck(displayName: string) {
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkDisplayName = async () => {
      if (!displayName.trim() || displayName.trim().length < 2) {
        setIsAvailable(null);
        setIsChecking(false);
        setError(null);
        return;
      }

      setIsChecking(true);
      setError(null);

      try {
        const response = await fetch('/api/auth/check-display-name', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ displayName: displayName.trim() }),
        });

        const result = await response.json();

        if (response.ok) {
          setIsAvailable(result.isAvailable);
          setError(null);
        } else {
          setIsAvailable(false);
          setError(result.error || 'Error checking name availability');
        }
      } catch (error) {
        setIsAvailable(false);
        setError('Failed to check name availability');
      } finally {
        setIsChecking(false);
      }
    };

    // Debounce the check to avoid too many API calls
    const timeoutId = setTimeout(checkDisplayName, 500);

    return () => clearTimeout(timeoutId);
  }, [displayName]);

  return {
    isAvailable,
    isChecking,
    error,
  };
}
