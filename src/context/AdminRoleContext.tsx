"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getAdminUser, type AdminUser, type AdminRoleType } from '@/lib/adminUsers';
import { getAdminRoleSync, type AdminRole } from '@/lib/adminRoles';

interface AdminRoleContextType {
  adminRole: AdminRole;
  adminUser: AdminUser | null;
  userEmail: string | null;
  isFullAdmin: boolean;
  isReadOnly: boolean;
  permissions: AdminUser['permissions'] | null;
  isLoading: boolean;
}

const AdminRoleContext = createContext<AdminRoleContextType>({
  adminRole: 'readonly',
  adminUser: null,
  userEmail: null,
  isFullAdmin: false,
  isReadOnly: true,
  permissions: null,
  isLoading: true,
});

export function AdminRoleProvider({ children }: { children: React.ReactNode }) {
  const [adminRole, setAdminRole] = useState<AdminRole>('readonly');
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
          
          if (userData) {
            // Determine role for backward compatibility
            const role: AdminRole = (userData.role === 'full' || userData.role === 'manager') ? 'full' : 'readonly';
            setAdminRole(role);
          } else {
            // Fallback to sync check
            const syncRole = getAdminRoleSync(email);
            setAdminRole(syncRole);
          }
        } catch (error) {
          console.error('Error loading admin user:', error);
          // Fallback to sync check
          const syncRole = getAdminRoleSync(email);
          setAdminRole(syncRole);
        }
      } else {
        setAdminUser(null);
        setAdminRole('readonly');
      }
      
      setIsLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  const isFullAdmin = adminRole === 'full' || (adminUser?.role === 'full' || adminUser?.role === 'manager');
  const isReadOnly = !isFullAdmin;
  const permissions = adminUser?.permissions || null;

  return (
    <AdminRoleContext.Provider
      value={{
        adminRole,
        adminUser,
        userEmail,
        isFullAdmin,
        isReadOnly,
        permissions,
        isLoading,
      }}
    >
      {children}
    </AdminRoleContext.Provider>
  );
}

export function useAdminRole() {
  return useContext(AdminRoleContext);
}

