import { supabase } from './supabase';
import { z } from 'zod';
import { StartSessionRequest, StartSessionResponse, CompleteSessionRequest, CompleteSessionResponse } from '@defeat-the-dragon/engine';

/**
 * Get the current user's session token for API calls
 */
async function getAuthToken(): Promise<string | null> {
  console.log('API: Getting auth token...');
  
  // Always use mock token for now to avoid Supabase issues
  console.log('API: Using mock token for development');
  return 'mock-token-for-development';
}

/**
 * Make an authenticated API request
 */
async function apiRequest<T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<T> {
  console.log('API: Making request to:', endpoint);
  const token = await getAuthToken();
  console.log('API: Got token, length:', token.length);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    console.log('API: Request timeout, aborting...');
    controller.abort();
  }, 15000); // 15 second timeout

  try {
    console.log('API: Making fetch request...');
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
    console.log('API: Fetch request completed');

  console.log('API: Response status:', response.status);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('API: Request failed:', errorData);
    throw new Error(errorData.error || `API request failed: ${response.status}`);
  }

  const data = await response.json();
  console.log('API: Request successful, data:', data);
  return data;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      console.error('API: Request timed out');
      throw new Error('Request timed out');
    }
    throw error;
  }
}

/**
 * Test API connectivity
 */
export async function testApi(): Promise<any> {
  console.log('API: testApi called');
  try {
    const response = await fetch('/api/test', {
      method: 'GET',
    });
    console.log('API: testApi response status:', response.status);
    const data = await response.json();
    console.log('API: testApi response data:', data);
    return data;
  } catch (error) {
    console.error('API: testApi error:', error);
    throw error;
  }
}

/**
 * Start a new focus session
 */
export async function startSession(request: z.infer<typeof StartSessionRequest>): Promise<z.infer<typeof StartSessionResponse>> {
  console.log('API: startSession called with:', request);
  try {
    const response = await apiRequest<z.infer<typeof StartSessionResponse>>('/sessions/start', {
      method: 'POST',
      body: JSON.stringify(request),
    });
    console.log('API: startSession response:', response);
    return response;
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
  console.log('API: getPlayerData called');
  try {
    const { data: { user } } = await supabase.auth.getUser();
    console.log('API: Auth user check completed, user:', user ? 'exists' : 'not found');
    
    if (!user) {
      console.log('API: No authenticated user found');
      throw new Error('No authenticated user found');
    }

    console.log('API: Starting database queries for user:', user.id);
    
    // First, try to get existing player data
    console.log('API: Querying players table...');
    const playerResult = await supabase
      .from('players')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    console.log('API: Players query completed, error:', playerResult.error);
    
    // If player doesn't exist, create a default player record
    if (playerResult.error && playerResult.error.code === 'PGRST116') {
      console.log('API: Player record not found, creating default player...');
      
      const defaultPlayer = {
        user_id: user.id,
        level: 1,
        xp: 0,
        coins: 100,
        sparks: 50,
        total_sessions: 0,
        total_focus_time: 0,
        current_streak: 0,
        longest_streak: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const createResult = await supabase
        .from('players')
        .insert(defaultPlayer)
        .select()
        .single();
      
      if (createResult.error) {
        console.error('API: Failed to create default player:', createResult.error);
        throw new Error(`Failed to create player record: ${createResult.error.message}`);
      }
      
      console.log('API: Default player created successfully');
      playerResult.data = createResult.data;
    } else if (playerResult.error) {
      console.error('API: Players table query failed:', playerResult.error);
      throw new Error(`Players query failed: ${playerResult.error.message}`);
    }
    
    console.log('API: Querying profiles table...');
    const profileResult = await supabase
      .from('profiles')
      .select('display_name')
      .eq('user_id', user.id)
      .single();
    console.log('API: Profiles query completed, error:', profileResult.error);
    
    console.log('API: All database queries completed');

    // Don't throw for profile errors, just use default name
    const displayName = profileResult.data?.display_name || 'Adventurer';

    // Combine player data with display name
    const player = {
      ...playerResult.data,
      display_name: displayName
    };

    console.log('API: Successfully retrieved player data:', {
      id: player.id,
      level: player.level,
      xp: player.xp,
      coins: player.coins,
      display_name: player.display_name
    });

    console.log('API: getPlayerData completed successfully');
    return player;
  } catch (error) {
    console.error('API: Failed to get player data:', error);
    console.error('API: getPlayerData failed with error:', error.message);
    
    // Don't return mock data - let the error propagate
    throw error;
  }
}

/**
 * Test database connection and table access
 */
export async function testDatabaseConnection() {
  try {
    console.log('API: Testing database connection...');
    
    const { data: { user } } = await supabase.auth.getUser();
    console.log('API: Auth test - user exists:', !!user);
    
    if (!user) {
      console.log('API: No authenticated user for database test');
      return { success: false, error: 'No authenticated user' };
    }
    
    // Test if we can query the players table
    const { data: players, error: playersError } = await supabase
      .from('players')
      .select('count')
      .limit(1);
    
    console.log('API: Players table test - error:', playersError);
    
    if (playersError) {
      return { success: false, error: `Players table error: ${playersError.message}` };
    }
    
    // Test if we can query the profiles table
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    console.log('API: Profiles table test - error:', profilesError);
    
    if (profilesError) {
      return { success: false, error: `Profiles table error: ${profilesError.message}` };
    }
    
    console.log('API: Database connection test successful');
    return { success: true };
    
  } catch (error) {
    console.error('API: Database connection test failed:', error);
    return { success: false, error: error.message };
  }
}
