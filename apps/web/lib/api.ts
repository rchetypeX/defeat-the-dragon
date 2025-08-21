import { supabase } from './supabase';
import { StartSessionRequest, StartSessionResponse, CompleteSessionRequest, CompleteSessionResponse } from '@defeat-the-dragon/engine';

/**
 * Get the current user's session token for API calls
 */
async function getAuthToken(): Promise<string | null> {
  console.log('API: Getting auth token...');
  try {
    console.log('API: About to call supabase.auth.getSession()...');
    const { data: { session } } = await supabase.auth.getSession();
    console.log('API: supabase.auth.getSession() completed');
    console.log('API: Session data:', { hasSession: !!session, hasToken: !!session?.access_token });
    if (!session?.access_token) {
      throw new Error('No authentication token available');
    }
    console.log('API: Returning token, length:', session.access_token.length);
    return session.access_token;
  } catch (error) {
    console.error('API: Error in getAuthToken:', error);
    throw error;
  }
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
}

/**
 * Get current user's player data
 */
export async function getPlayerData() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: player } = await supabase
    .from('players')
    .select('*')
    .eq('user_id', user.id)
    .single();

  return player;
}
