"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getAdminUser, type AdminUser, type RBACPermissions, type AdminRoleType, type AccessLevel } from '@/lib/adminUsers';
import { getAdminRoleSync } from '@/lib/adminRoles';

interface AdminRoleContextType {
  adminUser: AdminUser | null;
  userEmail: string | null;
  isSuperAdmin: boolean;
  isFullAdmin: boolean;
  isLoading: boolean;
  isReadOnly: boolean;

  // New Helpers
  hasPortalAccess: (portalKey: string) => boolean;
  hasSectionAccess: (portalKey: string, sectionKey: string, requiredLevel?: AccessLevel) => boolean;
  canPerformAction: (actionKey: string) => boolean; // For global overrides or specific actions
}

const AdminRoleContext = createContext<AdminRoleContextType>({
  adminUser: null,
  userEmail: null,
  isSuperAdmin: false,
  isFullAdmin: false,
  isLoading: true,
  isReadOnly: true,
  hasPortalAccess: () => false,
  hasSectionAccess: () => false,
  canPerformAction: () => false,
});

export function AdminRoleProvider({ children }: { children: React.ReactNode }) {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setIsLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      const email = user?.email ?? null;
      setUserEmail(email);

      if (email) {
        try {
          // Load admin user from Firestore
          const userData = await getAdminUser(email);
          setAdminUser(userData);
        } catch (error) {
          console.error('Error loading admin user:', error);
          setAdminUser(null);
        }
      } else {
        setAdminUser(null);
      }

      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const legacyRole = getAdminRoleSync(userEmail);
  const isSuperAdmin = adminUser?.role === 'super_admin';
  const isFullAdmin = isSuperAdmin || legacyRole === 'full';
  const isReadOnly = !isFullAdmin && adminUser?.role !== 'manager';

  // --- Helper Functions ---

  const hasPortalAccess = (portalKey: string): boolean => {
    if (isSuperAdmin) return true;
    if (!adminUser?.permissions) return false;
    return adminUser.permissions[portalKey as keyof RBACPermissions]?.enabled === true;
  };

  const hasSectionAccess = (portalKey: string, sectionKey: string, requiredLevel: AccessLevel = 'read'): boolean => {
    if (isSuperAdmin) return true;
    if (!adminUser?.permissions) return false;

    const portal = adminUser.permissions[portalKey as keyof RBACPermissions];
    if (!portal?.enabled) return false;

    // 'all' wildcard for sections
    const allAccess = portal.sections?.['all']?.access;
    const specificAccess = portal.sections?.[sectionKey]?.access;

    const effectiveAccess = specificAccess || allAccess || 'none';

    if (effectiveAccess === 'full_control') return true;
    if (requiredLevel === 'full_control') return effectiveAccess === 'full_control';
    if (requiredLevel === 'read_write') return effectiveAccess === 'read_write' || effectiveAccess === 'full_control';
    if (requiredLevel === 'read') return effectiveAccess !== 'none';

    return false;
  };

  const canPerformAction = (actionKey: string): boolean => {
    if (isSuperAdmin) return true;
    // Fallback for custom global overrides
    return adminUser?.permissions?.[actionKey] === true;
  };

  return (
    <AdminRoleContext.Provider
      value={{
        adminUser,
        userEmail,
        isSuperAdmin,
        isFullAdmin,
        isLoading,
        isReadOnly,
        hasPortalAccess,
        hasSectionAccess,
        canPerformAction
      }}
    >
      {children}
    </AdminRoleContext.Provider>
  );
}

export function useAdminRole() {
  return useContext(AdminRoleContext);
}

