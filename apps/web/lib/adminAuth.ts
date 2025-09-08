import { createServerSupabaseClient } from './supabase';

export interface AdminCheckResult {
  isAdmin: boolean;
  userId: string | null;
  error?: string;
}

/**
 * Check if a user has admin privileges
 * This checks the user's role in the players table
 */
export async function checkAdminRole(userId: string): Promise<AdminCheckResult> {
  try {
    // Use centralized Supabase client to avoid multiple instances
    const supabase = createServerSupabaseClient();
    
    // Check if user exists in players table with admin role
    const { data: player, error } = await supabase
      .from('players')
      .select('role')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error checking admin role:', error);
      return {
        isAdmin: false,
        userId,
        error: 'Failed to check admin role'
      };
    }

    // Check if user has admin role
    const isAdmin = player?.role === 'admin' || player?.role === 'super_admin';

    return {
      isAdmin,
      userId,
      error: isAdmin ? undefined : 'Insufficient privileges'
    };

  } catch (error) {
    console.error('Admin role check failed:', error);
    return {
      isAdmin: false,
      userId,
      error: 'Admin role check failed'
    };
  }
}

/**
 * Middleware function to require admin access
 * Returns 403 if user is not admin
 */
export async function requireAdmin(userId: string): Promise<AdminCheckResult> {
  const result = await checkAdminRole(userId);
  
  if (!result.isAdmin) {
    return {
      isAdmin: false,
      userId,
      error: 'Admin access required'
    };
  }

  return result;
}

/**
 * Check if user has specific admin permissions
 * This can be extended for more granular permissions
 */
export async function checkAdminPermission(
  userId: string, 
  permission: 'read' | 'write' | 'delete' | 'admin'
): Promise<AdminCheckResult> {
  const adminCheck = await checkAdminRole(userId);
  
  if (!adminCheck.isAdmin) {
    return adminCheck;
  }

  // For now, all admins have all permissions
  // This can be extended to check specific permissions
  return {
    isAdmin: true,
    userId,
    error: undefined
  };
}
