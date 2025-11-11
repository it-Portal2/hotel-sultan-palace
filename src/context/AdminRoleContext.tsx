"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getAdminRole, AdminRole } from '@/lib/adminRoles';

interface AdminRoleContextType {
  adminRole: AdminRole;
  userEmail: string | null;
  isFullAdmin: boolean;
  isReadOnly: boolean;
}

const AdminRoleContext = createContext<AdminRoleContextType>({
  adminRole: 'readonly',
  userEmail: null,
  isFullAdmin: false,
  isReadOnly: true,
});

export function AdminRoleProvider({ children }: { children: React.ReactNode }) {
  const [adminRole, setAdminRole] = useState<AdminRole>('readonly');
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    if (!auth) return;
    
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      const email = user?.email ?? null;
      setUserEmail(email);
      setAdminRole(getAdminRole(email));
    });
    
    return () => unsubscribe();
  }, []);

  return (
    <AdminRoleContext.Provider
      value={{
        adminRole,
        userEmail,
        isFullAdmin: adminRole === 'full',
        isReadOnly: adminRole === 'readonly',
      }}
    >
      {children}
    </AdminRoleContext.Provider>
  );
}

export function useAdminRole() {
  return useContext(AdminRoleContext);
}

