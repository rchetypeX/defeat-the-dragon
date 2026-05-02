import { supabase } from './supabase';
import { z } from 'zod';
import { StartSessionRequest, StartSessionResponse, CompleteSessionRequest, CompleteSessionResponse } from '@defeat-the-dragon/engine';

/**
 * Get the current user's session token for API calls
 */
async function getAuthToken(): Promise<string | null> {
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error) {
    throw new Error(`Failed to get auth session: ${error.message}`);
  }

  return session?.access_token ?? null;
}

/**
 * Make an authenticated API request
 */
async function apiRequest<T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<T> {
  const token = await getAuthToken();
  if (!token) {
    throw new Error('You must be signed in to perform this action.');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, 15000); // 15 second timeout

  try {
    const response = await fetch(`/api${endpoint}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API request failed: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('Request timed out');
    }
    throw error;
  }
}

/**
 * Test API connectivity
 */
export async function testApi(): Promise<any> {
  try {
    const response = await fetch('/api/test', {
      method: 'GET',
    });
    return response.json();
  } catch (error) {
    console.error('API: testApi error:', error);
    throw error;
  }
}

/**
 * Start a new focus session
 */
export async function startSession(request: z.infer<typeof StartSessionRequest>): Promise<z.infer<typeof StartSessionResponse>> {
  try {
    return apiRequest<z.infer<typeof StartSessionResponse>>('/sessions/start', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  } catch (error) {
    console.error('API: startSession error:', error);
    throw error;
  }
}

/**
 * Complete a focus session
 */
export async function completeSession(request: z.infer<typeof CompleteSessionRequest>): Promise<z.infer<typeof CompleteSessionResponse>> {
  return apiRequest<z.infer<typeof CompleteSessionResponse>>('/sessions/complete', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

/**
 * Create a Stripe Checkout session for the Inspiration Boon subscription.
 */
export async function createStripeCheckoutSession(): Promise<{ url: string }> {
  return apiRequest<{ url: string }>('/stripe/create-checkout-session', {
    method: 'POST',
  });
}

/**
 * Get current user's active session
 */
export async function getCurrentSession() {
  try {
    const token = await getAuthToken();
    if (!token) return null;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: session } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', user.id)
      .is('ended_at', null)
      .order('started_at', { ascending: false })
      .limit(1)
      .single();

    return session;
  } catch (error) {
    console.error('API: Failed to get current session:', error);
    return null;
  }
}

/**
 * Get current user's player data
 */
export async function getPlayerData() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return null;
    }

    const playerResult = await supabase
      .from('players')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    const profileResult = await supabase
      .from('profiles')
      .select('display_name')
      .eq('user_id', user.id)
      .single();

    if (playerResult.error) {
      throw new Error(`Players query failed: ${playerResult.error.message}`);
    }

    if (profileResult.error) {
      console.error('API: Profiles table query failed:', profileResult.error);
      // Don't throw for profile errors, just use default name
    }

    // Combine player data with display name
    const player = {
      ...playerResult.data,
      display_name: profileResult.data?.display_name || 'The Moth'
    };

    return player;
  } catch (error) {
    console.error('API: Failed to get player data:', error);
    throw error;
  }
}

/**
 * Test database connection and table access
 */
export async function testDatabaseConnection() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: 'No authenticated user' };
    }
    
    // Test if we can query the players table
    const { data: players, error: playersError } = await supabase
      .from('players')
      .select('count')
      .limit(1);
    
    if (playersError) {
      return { success: false, error: `Players table error: ${playersError.message}` };
    }
    
    // Test if we can query the profiles table
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (profilesError) {
      return { success: false, error: `Profiles table error: ${profilesError.message}` };
    }
    
    return { success: true };
    
  } catch (error) {
    console.error('API: Database connection test failed:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
