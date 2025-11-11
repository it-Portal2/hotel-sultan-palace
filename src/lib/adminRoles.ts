/**
 * Admin Role Management
 * 
 * Primary Admin (Full Access): Email from NEXT_PUBLIC_ADMIN_EMAILS env variable
 * - Can add, edit, delete bookings and all admin features
 * 
 * Read-Only Admin (Limited Access): Any other admin email (including info@sultanpalacehotelznz.com)
 * - Can view bookings and data
 * - Cannot add, edit, or delete anything
 * 
 * Security: No hardcoded credentials - all from environment variables
 */

export type AdminRole = 'full' | 'readonly';

/**
 * Get full admin email from environment variable
 * First email in comma-separated list gets full access
 * @returns Full admin email or null if not configured
 */
function getFullAdminEmail(): string | null {
  const envEmail = process.env.NEXT_PUBLIC_ADMIN_EMAILS;
  if (!envEmail) return null;
  // Take first email if comma-separated (first email = full access)
  const emails = envEmail.split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
  return emails.length > 0 ? emails[0] : null;
}

/**
 * Get admin role based on email
 * @param email - User's email address
 * @returns 'full' for primary admin (from env), 'readonly' for others
 */
export function getAdminRole(email: string | null | undefined): AdminRole {
  if (!email) return 'readonly';
  
  const normalizedEmail = email.toLowerCase().trim();
  const fullAdminEmail = getFullAdminEmail();
  
  // If no full admin email configured, default to readonly for all
  if (!fullAdminEmail) {
    return 'readonly';
  }
  
  // Check if email matches full admin email from env
  if (normalizedEmail === fullAdminEmail) {
    return 'full';
  }
  
  // All other emails (including info@sultanpalacehotelznz.com) are readonly
  return 'readonly';
}

/**
 * Check if user has full admin access
 * @param email - User's email address
 * @returns true if user is primary admin
 */
export function isFullAdmin(email: string | null | undefined): boolean {
  return getAdminRole(email) === 'full';
}

/**
 * Check if user has read-only access
 * @param email - User's email address
 * @returns true if user is read-only admin
 */
export function isReadOnlyAdmin(email: string | null | undefined): boolean {
  return getAdminRole(email) === 'readonly';
}

