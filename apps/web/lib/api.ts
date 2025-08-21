import { supabase } from './supabase';
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
export async function startSession(request: StartSessionRequest): Promise<StartSessionResponse> {
  console.log('API: startSession called with:', request);
  try {
    const response = await apiRequest<StartSessionResponse>('/sessions/start', {
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
export async function completeSession(request: CompleteSessionRequest): Promise<CompleteSessionResponse> {
  return apiRequest<CompleteSessionResponse>('/sessions/complete', {
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
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Get player data and profile data in parallel
    const [playerResult, profileResult] = await Promise.all([
      supabase
        .from('players')
        .select('*')
        .eq('user_id', user.id)
        .single(),
      supabase
        .from('profiles')
        .select('display_name')
        .eq('user_id', user.id)
        .single()
    ]);

    if (playerResult.error) {
      throw playerResult.error;
    }

    // Combine player data with display name
    const player = {
      ...playerResult.data,
      display_name: profileResult.data?.display_name || 'Adventurer'
    };

    return player;
  } catch (error) {
    console.error('API: Failed to get player data:', error);
    // Return mock data for development
    return {
      id: 'mock-player-id',
      user_id: 'mock-user-id',
      level: 1,
      xp: 0,
      coins: 3,
      sparks: 0,
      is_inspired: false,
      bond_score: 50,
      mood_state: 'Happy',
      day_streak: 0,
      created_at: new Date().toISOString(),
      display_name: 'Adventurer'
    };
  }
}
