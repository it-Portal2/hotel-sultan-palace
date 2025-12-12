/**
 * Admin Role Management (Legacy - for backward compatibility)
 * Now uses Firestore-based adminUsers system
 */

import { getAdminUser } from './adminUsers';

export type AdminRole = 'full' | 'readonly';

/**
 * Get admin role based on email (uses Firestore adminUsers)
 * @param email - User's email address
 * @returns 'full' for primary admin, 'readonly' for others
 */
export async function getAdminRole(email: string | null | undefined): Promise<AdminRole> {
  if (!email) return 'readonly';
  
  try {
    const adminUser = await getAdminUser(email);
    if (!adminUser) return 'readonly';
    
    // Full admin or manager role = full access
    if (adminUser.role === 'full' || adminUser.role === 'manager') {
      return 'full';
    }
    
    return 'readonly';
  } catch (error) {
    console.error('Error getting admin role:', error);
    return 'readonly';
  }
}

/**
 * Synchronous version for client-side (uses cached value)
 * Note: This is a fallback - prefer async getAdminRole
 */
export function getAdminRoleSync(email: string | null | undefined): AdminRole {
  if (!email) return 'readonly';
  
  const normalizedEmail = email.toLowerCase().trim();
  const mainAdminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',')[0]?.trim().toLowerCase() || 'admin@sultanpalacehotelznz.com';
  
  if (normalizedEmail === mainAdminEmail) {
    return 'full';
  }
  
  return 'readonly';
}

/**
 * Check if user has full admin access
 * @param email - User's email address
 * @returns true if user is primary admin
 */
export async function isFullAdmin(email: string | null | undefined): Promise<boolean> {
  const role = await getAdminRole(email);
  return role === 'full';
}

/**
 * Check if user has read-only access
 * @param email - User's email address
 * @returns true if user is read-only admin
 */
export async function isReadOnlyAdmin(email: string | null | undefined): Promise<boolean> {
  const role = await getAdminRole(email);
  return role === 'readonly';
}

