/**
 * Admin User Management System with Granular RBAC
 * 
 * Main Admin: admin@sultanpalacehotelznz.com (Full Access)
 * - Can manage all admin users
 * - Can assign roles to other users
 * - Full access to all features
 */

import app, { db } from './firebase';
import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  getDoc
} from 'firebase/firestore';
import { initializeApp, getApp, getApps, deleteApp, FirebaseApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';

// --- Types & Interfaces ---

export type AccessLevel = 'none' | 'read' | 'read_write' | 'full_control';

export interface SectionPermission {
  access: AccessLevel;
}

export interface PortalPermission {
  enabled: boolean;
  sections: Record<string, SectionPermission>;
}

export interface RBACPermissions {
  // Portals
  inventory?: PortalPermission;
  front_office?: PortalPermission;
  accounts?: PortalPermission;
  kitchen?: PortalPermission;
  housekeeping?: PortalPermission;
  audit?: PortalPermission;
  maintenance?: PortalPermission;
  cashiering?: PortalPermission; // New: Cashiering Module
  reports?: PortalPermission;   // New: Reports Module
  users?: PortalPermission; // For User Management
  settings?: PortalPermission;

  // Explicit Global Actions (optional overrides)
  [key: string]: any;
}

export type AdminRoleType = 'super_admin' | 'manager' | 'receptionist' | 'chef' | 'housekeeper' | 'auditor' | 'accountant' | 'custom';

export interface AdminUser {
  id: string;
  email: string;
  username: string;
  employeeId: string; // Unique Link to Staff
  role: AdminRoleType;
  name: string;

  // Granular Permissions
  permissions: RBACPermissions;

  // Access Control
  allowedPortals: string[]; // Quick lookup for UI hiding

  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

// --- Default Role Templates ---

export const defaultPermissions: Record<AdminRoleType, RBACPermissions> = {
  super_admin: {
    inventory: { enabled: true, sections: { all: { access: 'full_control' } } },
    front_office: { enabled: true, sections: { all: { access: 'full_control' } } },
    accounts: { enabled: true, sections: { all: { access: 'full_control' } } },
    kitchen: { enabled: true, sections: { all: { access: 'full_control' } } },
    housekeeping: { enabled: true, sections: { all: { access: 'full_control' } } },
    audit: { enabled: true, sections: { all: { access: 'full_control' } } },
    maintenance: { enabled: true, sections: { all: { access: 'full_control' } } },
    cashiering: { enabled: true, sections: { all: { access: 'full_control' } } },
    reports: { enabled: true, sections: { all: { access: 'full_control' } } },
    users: { enabled: true, sections: { all: { access: 'full_control' } } },
    settings: { enabled: true, sections: { all: { access: 'full_control' } } },
  },
  manager: {
    inventory: { enabled: true, sections: { all: { access: 'read_write' } } },
    front_office: { enabled: true, sections: { all: { access: 'full_control' } } },
    accounts: { enabled: true, sections: { all: { access: 'read' } } },
    kitchen: { enabled: true, sections: { all: { access: 'read_write' } } },
    housekeeping: { enabled: true, sections: { all: { access: 'read_write' } } },
    audit: { enabled: true, sections: { all: { access: 'read' } } },
    maintenance: { enabled: true, sections: { all: { access: 'read_write' } } },
    cashiering: { enabled: true, sections: { all: { access: 'read_write' } } },
    reports: { enabled: true, sections: { all: { access: 'read_write' } } },
    users: { enabled: false, sections: {} },
    settings: { enabled: true, sections: { general: { access: 'read_write' } } },
  },
  receptionist: {
    front_office: {
      enabled: true,
      sections: {
        bookings: { access: 'read_write' },
        guests: { access: 'read_write' },
        unsettled_folios: { access: 'read_write' },
        transactions: { access: 'read_write' },
        net_locks: { access: 'read' } // View only for locks usually
      }
    },
    housekeeping: { enabled: true, sections: { all: { access: 'read' } } },
    reports: { enabled: true, sections: { all: { access: 'read' } } }, // Can view reports
    cashiering: { enabled: false, sections: {} }, // Typically explicitly separated
    inventory: { enabled: false, sections: {} },
    accounts: { enabled: false, sections: {} },
    kitchen: { enabled: false, sections: {} },
    audit: { enabled: false, sections: {} },
    maintenance: { enabled: false, sections: {} },
    users: { enabled: false, sections: {} },
    settings: { enabled: false, sections: {} },
  },
  chef: {
    kitchen: { enabled: true, sections: { orders: { access: 'full_control' }, history: { access: 'read' } } },
    inventory: { enabled: true, sections: { items: { access: 'read' }, stock: { access: 'read' } } },
    reports: { enabled: false, sections: {} },
    cashiering: { enabled: false, sections: {} },
    front_office: { enabled: false, sections: {} },
    accounts: { enabled: false, sections: {} },
    housekeeping: { enabled: false, sections: {} },
    audit: { enabled: false, sections: {} },
    maintenance: { enabled: false, sections: {} },
    users: { enabled: false, sections: {} },
    settings: { enabled: false, sections: {} },
  },
  housekeeper: {
    housekeeping: { enabled: true, sections: { tasks: { access: 'full_control' } } },
    front_office: { enabled: true, sections: { rooms: { access: 'read' } } }, // To see room status
    inventory: { enabled: true, sections: { supplies: { access: 'read_write' } } },
    reports: { enabled: false, sections: {} },
    cashiering: { enabled: false, sections: {} },
    accounts: { enabled: false, sections: {} },
    kitchen: { enabled: false, sections: {} },
    audit: { enabled: false, sections: {} },
    maintenance: { enabled: true, sections: { requests: { access: 'read_write' } } },
    users: { enabled: false, sections: {} },
    settings: { enabled: false, sections: {} },
  },
  auditor: {
    audit: { enabled: true, sections: { all: { access: 'full_control' } } },
    accounts: { enabled: true, sections: { all: { access: 'read' } } },
    inventory: { enabled: true, sections: { all: { access: 'read' } } },
    front_office: { enabled: true, sections: { all: { access: 'read' } } },
    kitchen: { enabled: true, sections: { all: { access: 'read' } } },
    housekeeping: { enabled: true, sections: { all: { access: 'read' } } },
    maintenance: { enabled: true, sections: { all: { access: 'read' } } },
    cashiering: { enabled: true, sections: { all: { access: 'read' } } },
    reports: { enabled: true, sections: { all: { access: 'read' } } },
    users: { enabled: false, sections: {} },
    settings: { enabled: false, sections: {} },
  },
  accountant: {
    accounts: { enabled: true, sections: { all: { access: 'full_control' } } },
    inventory: { enabled: true, sections: { purchase_orders: { access: 'read_write' } } },
    front_office: { enabled: true, sections: { billing: { access: 'read_write' } } },
    cashiering: { enabled: true, sections: { all: { access: 'full_control' } } },
    reports: { enabled: true, sections: { all: { access: 'read_write' } } },
    kitchen: { enabled: false, sections: {} },
    housekeeping: { enabled: false, sections: {} },
    audit: { enabled: true, sections: { all: { access: 'read' } } },
    maintenance: { enabled: false, sections: {} },
    users: { enabled: false, sections: {} },
    settings: { enabled: false, sections: {} },
  },
  custom: {},
};

// --- Helper Functions ---

function getMainAdminEmail(): string {
  return process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',')[0]?.trim().toLowerCase() || 'admin@sultanpalacehotelznz.com';
}

function getSafeAllowedPortals(permissions: RBACPermissions): string[] {
  return Object.keys(permissions).filter(key => permissions[key as keyof RBACPermissions]?.enabled);
}

// --- Main Service Functions ---

export async function getAdminUser(email: string | null | undefined): Promise<AdminUser | null> {
  if (!email || !db) return null;
  const normalizedEmail = email.toLowerCase().trim();
  const mainAdminEmail = getMainAdminEmail();

  // Super Admin Check
  if (normalizedEmail === mainAdminEmail) {
    return {
      id: 'main-admin',
      email: normalizedEmail,
      username: 'Main Admin',
      employeeId: 'ADM001',
      role: 'super_admin',
      name: 'System Administrator',
      permissions: defaultPermissions.super_admin,
      allowedPortals: Object.keys(defaultPermissions.super_admin),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  // Firestore Check
  const q = query(collection(db, 'adminUsers'), where('email', '==', normalizedEmail));
  const snapshot = await getDocs(q);

  if (snapshot.empty) return null;

  const docData = snapshot.docs[0].data();
  // Ensure backward compatibility or safe defaults
  const role = (docData.role as AdminRoleType) || 'custom';
  const permissions = docData.permissions || defaultPermissions[role] || {};

  return {
    id: snapshot.docs[0].id,
    email: docData.email,
    username: docData.username || docData.email,
    employeeId: docData.employeeId || '',
    role: role,
    name: docData.name,
    permissions: permissions,
    allowedPortals: docData.allowedPortals || getSafeAllowedPortals(permissions),
    isActive: docData.isActive !== false,
    createdAt: docData.createdAt?.toDate() || new Date(),
    updatedAt: docData.updatedAt?.toDate() || new Date(),
    createdBy: docData.createdBy,
  };
}

export async function getAllAdminUsers(): Promise<AdminUser[]> {
  if (!db) return [];
  try {
    const s = await getDocs(collection(db, 'adminUsers'));
    const mainAdminEmail = getMainAdminEmail();

    // Always inject main admin
    const mainAdmin = await getAdminUser(mainAdminEmail);
    const users = s.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
      } as AdminUser;
    });

    // Remove duplicates if main admin is in DB for some reason, though logic handles it
    const filteredUsers = users.filter(u => u.email !== mainAdminEmail);
    return mainAdmin ? [mainAdmin, ...filteredUsers] : filteredUsers;
  } catch (e) {
    console.error(e);
    return [];
  }
}

// --- User Creation with Password (The "Secondary App" Trick) ---

export async function createSystemUser(
  userData: {
    email: string;
    password?: string; // Optional if only creating DB record (legacy), but required for new flow
    name: string;
    username: string;
    employeeId: string;
    role: AdminRoleType;
    permissions?: RBACPermissions;
  },
  creatorEmail: string
): Promise<{ success: boolean; error?: string; id?: string }> {
  if (!db || !app) return { success: false, error: 'Database or App unavailable' };

  try {
    const normalizedEmail = userData.email.toLowerCase().trim();

    // 1. Check DB existence
    const existing = await getAdminUser(normalizedEmail);
    if (existing) return { success: false, error: 'User already exists' };

    // 2. Create Auth User (if password provided)
    // We utilize a secondary Firebase App to avoid logging out the current admin
    if (userData.password) {
      let secondaryApp: FirebaseApp | undefined;
      try {
        // Check if app exists or initialize unique one
        const appName = 'secondary-auth-worker';
        const existingApps = getApps();
        secondaryApp = existingApps.find(a => a.name === appName) || initializeApp(app.options, appName);

        const secondaryAuth = getAuth(secondaryApp);
        await createUserWithEmailAndPassword(secondaryAuth, normalizedEmail, userData.password);

        // Immediately sign out this secondary worker to be safe
        await signOut(secondaryAuth);

        // Clean up: valid workaround for web SDK limitation
        // Note: deleteApp is async. We don't await it strictly to avoid blocking UI excessive time if not needed.
        deleteApp(secondaryApp).catch(console.error);
      } catch (authError: any) {
        if (authError.code === 'auth/email-already-in-use') {
          return { success: false, error: 'This email is already registered. Please use a different email.' };
        }
        console.error('Auth Creation Error:', authError);
        return { success: false, error: authError.message || 'Failed to create authentication credentials.' };
      }
    }

    // 3. Create Firestore Record
    const finalPermissions = userData.permissions || defaultPermissions[userData.role] || {};

    const ref = await addDoc(collection(db, 'adminUsers'), {
      email: normalizedEmail,
      username: userData.username,
      employeeId: userData.employeeId,
      name: userData.name,
      role: userData.role,
      permissions: finalPermissions,
      allowedPortals: getSafeAllowedPortals(finalPermissions),
      isActive: true,
      createdBy: creatorEmail,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return { success: true, id: ref.id };

  } catch (e: any) {
    console.error('Create System User Error:', e);
    return { success: false, error: e.message };
  }
}

export async function updateSystemUserPermissions(
  userId: string,
  role: AdminRoleType,
  permissions: RBACPermissions
): Promise<boolean> {
  if (!userId || !db) return false;
  try {
    const ref = doc(db, 'adminUsers', userId);
    await updateDoc(ref, {
      role,
      permissions,
      allowedPortals: getSafeAllowedPortals(permissions),
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
}

export async function deleteSystemUser(userId: string): Promise<boolean> {
  // Note: This only deletes the DB record. Auth user deletion requires Admin SDK or Cloud Function.
  // For client-side, we primarily rely on disabling the account or removing the DB record 
  // which prevents the permission check from succeeding "isActive".
  if (!db) return false;
  try {
    await deleteDoc(doc(db, 'adminUsers', userId));
    return true;
  } catch (e) {
    return false;
  }
}

// --- Legacy Adapters for Backward Compatibility ---

export async function createAdminUser(email: string, role: string): Promise<string | null> {
  // Map legacy roles to new RBAC roles
  let newRole: AdminRoleType = 'custom';
  if (role === 'full') newRole = 'super_admin';
  else if (role === 'kitchen') newRole = 'chef';
  else if (role === 'frontdesk') newRole = 'receptionist';
  else if (role === 'readonly') newRole = 'auditor'; // Best fit for read-only

  const result = await createSystemUser({
    email,
    role: newRole,
    name: email.split('@')[0],
    username: email.split('@')[0],
    employeeId: 'LEGACY-' + Math.floor(Math.random() * 10000),
  }, 'legacy-adapter');

  // @ts-ignore
  return result.success ? result.id : null;
}

export async function updateAdminUser(uid: string, data: { role?: string }): Promise<void> {
  if (data.role) {
    let newRole: AdminRoleType = 'custom';
    if (data.role === 'full') newRole = 'super_admin';
    else if (data.role === 'kitchen') newRole = 'chef';
    else if (data.role === 'frontdesk') newRole = 'receptionist';
    else if (data.role === 'readonly') newRole = 'auditor';

    // We need permissions for this role to update properly
    const permissions = defaultPermissions[newRole] || {};
    await updateSystemUserPermissions(uid, newRole, permissions);
  }
}

export const deleteAdminUser = deleteSystemUser;


