/**
 * Admin User Management System
 * 
 * Main Admin: admin@sultanpalacehotelznz.com (Full Access)
 * - Can manage all admin users
 * - Can assign roles to other users
 * - Full access to all features
 * 
 * Role-Based Access Control:
 * - kitchen: Kitchen Dashboard, Food Orders (update status only)
 * - housekeeping: Housekeeping Tasks, Room Status (view and update)
 * - front_desk: Front Desk, Check-in/Check-out, Bookings (view and check-in/out)
 * - manager: All view access + some edit permissions
 * - readonly: View only access
 */

import { db } from './firebase';
import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc, query, where, serverTimestamp } from 'firebase/firestore';

export type AdminRoleType = 'full' | 'kitchen' | 'housekeeping' | 'front_desk' | 'manager' | 'readonly';

export interface AdminUser {
  id: string;
  email: string;
  role: AdminRoleType;
  name?: string;
  permissions: {
    // Booking permissions
    canViewBookings: boolean;
    canEditBookings: boolean;
    canCancelBookings: boolean;
    canConfirmBookings: boolean;
    
    // Room permissions
    canViewRooms: boolean;
    canEditRooms: boolean;
    canManageRoomStatus: boolean;
    
    // Food & Kitchen permissions
    canViewFoodOrders: boolean;
    canUpdateFoodOrderStatus: boolean;
    canViewKitchen: boolean;
    canManageMenu: boolean;
    
    // Guest Services permissions
    canViewGuestServices: boolean;
    canUpdateGuestServiceStatus: boolean;
    canCreateGuestServices: boolean;
    
    // Housekeeping permissions
    canViewHousekeeping: boolean;
    canCreateHousekeepingTasks: boolean;
    canUpdateHousekeepingTasks: boolean;
    
    // Front Desk permissions
    canViewFrontDesk: boolean;
    canCheckIn: boolean;
    canCheckOut: boolean;
    
    // Checkout & Billing permissions
    canViewCheckout: boolean;
    canGenerateBills: boolean;
    
    // Content Management permissions
    canManageGallery: boolean;
    canManageOffers: boolean;
    canManageAddons: boolean;
    canManageRooms: boolean;
    
    // Admin Management permissions
    canManageAdmins: boolean;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string; // Email of admin who created this user
}

// Default permissions for each role
const rolePermissions: Record<AdminRoleType, AdminUser['permissions']> = {
  full: {
    canViewBookings: true,
    canEditBookings: true,
    canCancelBookings: true,
    canConfirmBookings: true,
    canViewRooms: true,
    canEditRooms: true,
    canManageRoomStatus: true,
    canViewFoodOrders: true,
    canUpdateFoodOrderStatus: true,
    canViewKitchen: true,
    canManageMenu: true,
    canViewGuestServices: true,
    canUpdateGuestServiceStatus: true,
    canCreateGuestServices: true,
    canViewHousekeeping: true,
    canCreateHousekeepingTasks: true,
    canUpdateHousekeepingTasks: true,
    canViewFrontDesk: true,
    canCheckIn: true,
    canCheckOut: true,
    canViewCheckout: true,
    canGenerateBills: true,
    canManageGallery: true,
    canManageOffers: true,
    canManageAddons: true,
    canManageRooms: true,
    canManageAdmins: true,
  },
  kitchen: {
    canViewBookings: false,
    canEditBookings: false,
    canCancelBookings: false,
    canConfirmBookings: false,
    canViewRooms: false,
    canEditRooms: false,
    canManageRoomStatus: false,
    canViewFoodOrders: true,
    canUpdateFoodOrderStatus: true,
    canViewKitchen: true,
    canManageMenu: false,
    canViewGuestServices: false,
    canUpdateGuestServiceStatus: false,
    canCreateGuestServices: false,
    canViewHousekeeping: false,
    canCreateHousekeepingTasks: false,
    canUpdateHousekeepingTasks: false,
    canViewFrontDesk: false,
    canCheckIn: false,
    canCheckOut: false,
    canViewCheckout: false,
    canGenerateBills: false,
    canManageGallery: false,
    canManageOffers: false,
    canManageAddons: false,
    canManageRooms: false,
    canManageAdmins: false,
  },
  housekeeping: {
    canViewBookings: true,
    canEditBookings: false,
    canCancelBookings: false,
    canConfirmBookings: false,
    canViewRooms: true,
    canEditRooms: false,
    canManageRoomStatus: true,
    canViewFoodOrders: false,
    canUpdateFoodOrderStatus: false,
    canViewKitchen: false,
    canManageMenu: false,
    canViewGuestServices: false,
    canUpdateGuestServiceStatus: false,
    canCreateGuestServices: false,
    canViewHousekeeping: true,
    canCreateHousekeepingTasks: true,
    canUpdateHousekeepingTasks: true,
    canViewFrontDesk: false,
    canCheckIn: false,
    canCheckOut: false,
    canViewCheckout: false,
    canGenerateBills: false,
    canManageGallery: false,
    canManageOffers: false,
    canManageAddons: false,
    canManageRooms: false,
    canManageAdmins: false,
  },
  front_desk: {
    canViewBookings: true,
    canEditBookings: false,
    canCancelBookings: false,
    canConfirmBookings: false,
    canViewRooms: true,
    canEditRooms: false,
    canManageRoomStatus: false,
    canViewFoodOrders: true,
    canUpdateFoodOrderStatus: false,
    canViewKitchen: false,
    canManageMenu: false,
    canViewGuestServices: true,
    canUpdateGuestServiceStatus: true,
    canCreateGuestServices: true,
    canViewHousekeeping: true,
    canCreateHousekeepingTasks: false,
    canUpdateHousekeepingTasks: false,
    canViewFrontDesk: true,
    canCheckIn: true,
    canCheckOut: true,
    canViewCheckout: true,
    canGenerateBills: true,
    canManageGallery: false,
    canManageOffers: false,
    canManageAddons: false,
    canManageRooms: false,
    canManageAdmins: false,
  },
  manager: {
    canViewBookings: true,
    canEditBookings: true,
    canCancelBookings: true,
    canConfirmBookings: true,
    canViewRooms: true,
    canEditRooms: false,
    canManageRoomStatus: true,
    canViewFoodOrders: true,
    canUpdateFoodOrderStatus: true,
    canViewKitchen: true,
    canManageMenu: false,
    canViewGuestServices: true,
    canUpdateGuestServiceStatus: true,
    canCreateGuestServices: true,
    canViewHousekeeping: true,
    canCreateHousekeepingTasks: true,
    canUpdateHousekeepingTasks: true,
    canViewFrontDesk: true,
    canCheckIn: true,
    canCheckOut: true,
    canViewCheckout: true,
    canGenerateBills: true,
    canManageGallery: false,
    canManageOffers: false,
    canManageAddons: false,
    canManageRooms: false,
    canManageAdmins: false,
  },
  readonly: {
    canViewBookings: true,
    canEditBookings: false,
    canCancelBookings: false,
    canConfirmBookings: false,
    canViewRooms: true,
    canEditRooms: false,
    canManageRoomStatus: false,
    canViewFoodOrders: true,
    canUpdateFoodOrderStatus: false,
    canViewKitchen: true,
    canManageMenu: false,
    canViewGuestServices: true,
    canUpdateGuestServiceStatus: false,
    canCreateGuestServices: false,
    canViewHousekeeping: true,
    canCreateHousekeepingTasks: false,
    canUpdateHousekeepingTasks: false,
    canViewFrontDesk: true,
    canCheckIn: false,
    canCheckOut: false,
    canViewCheckout: true,
    canGenerateBills: false,
    canManageGallery: false,
    canManageOffers: false,
    canManageAddons: false,
    canManageRooms: false,
    canManageAdmins: false,
  },
};

// Get main admin email from environment
function getMainAdminEmail(): string {
  return process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',')[0]?.trim().toLowerCase() || 'admin@sultanpalacehotelznz.com';
}

/**
 * Get admin user from Firestore by email
 */
export async function getAdminUser(email: string | null | undefined): Promise<AdminUser | null> {
  if (!email || !db) return null;
  
  try {
    const normalizedEmail = email.toLowerCase().trim();
    
    // Check if it's main admin
    const mainAdminEmail = getMainAdminEmail();
    if (normalizedEmail === mainAdminEmail) {
      return {
        id: 'main-admin',
        email: normalizedEmail,
        role: 'full',
        permissions: rolePermissions.full,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }
    
    // Check Firestore for admin user
    const adminUsersRef = collection(db, 'adminUsers');
    const q = query(adminUsersRef, where('email', '==', normalizedEmail));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      // If not found in Firestore, default to readonly
      return {
        id: 'default-readonly',
        email: normalizedEmail,
        role: 'readonly',
        permissions: rolePermissions.readonly,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }
    
    const doc = snapshot.docs[0];
    const data = doc.data();
    
    return {
      id: doc.id,
      email: data.email,
      role: data.role || 'readonly',
      name: data.name,
      permissions: data.permissions || rolePermissions[data.role as AdminRoleType] || rolePermissions.readonly,
      isActive: data.isActive !== false,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      createdBy: data.createdBy,
    };
  } catch (error) {
    console.error('Error getting admin user:', error);
    // Fallback to readonly on error
    return {
      id: 'error-readonly',
      email: email.toLowerCase().trim(),
      role: 'readonly',
      permissions: rolePermissions.readonly,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}

/**
 * Get all admin users (only for full admin)
 */
export async function getAllAdminUsers(): Promise<AdminUser[]> {
  if (!db) return [];
  
  try {
    const adminUsersRef = collection(db, 'adminUsers');
    const snapshot = await getDocs(adminUsersRef);
    
    const mainAdminEmail = getMainAdminEmail();
    const mainAdmin: AdminUser = {
      id: 'main-admin',
      email: mainAdminEmail,
      role: 'full',
      permissions: rolePermissions.full,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const users = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        email: data.email,
        role: data.role || 'readonly',
        name: data.name,
        permissions: data.permissions || rolePermissions[data.role as AdminRoleType] || rolePermissions.readonly,
        isActive: data.isActive !== false,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        createdBy: data.createdBy,
      } as AdminUser;
    });
    
    return [mainAdmin, ...users];
  } catch (error) {
    console.error('Error getting all admin users:', error);
    return [];
  }
}

/**
 * Create new admin user (only full admin can do this)
 */
export async function createAdminUser(
  email: string,
  role: AdminRoleType,
  name?: string,
  createdBy?: string
): Promise<string | null> {
  if (!db) return null;
  
  try {
    const normalizedEmail = email.toLowerCase().trim();
    
    // Check if user already exists
    const existing = await getAdminUser(normalizedEmail);
    if (existing && existing.id !== 'default-readonly' && existing.id !== 'error-readonly') {
      throw new Error('Admin user already exists');
    }
    
    const adminUsersRef = collection(db, 'adminUsers');
    const docRef = await addDoc(adminUsersRef, {
      email: normalizedEmail,
      role,
      name: name || '',
      permissions: rolePermissions[role],
      isActive: true,
      createdBy: createdBy || '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating admin user:', error);
    return null;
  }
}

/**
 * Update admin user (only full admin can do this)
 */
export async function updateAdminUser(
  id: string,
  updates: Partial<Pick<AdminUser, 'role' | 'name' | 'isActive' | 'permissions'>>
): Promise<boolean> {
  if (!db) return false;
  
  try {
    // Can't update main admin
    if (id === 'main-admin') {
      throw new Error('Cannot update main admin');
    }
    
    const adminUserRef = doc(db, 'adminUsers', id);
    const updateData: Record<string, unknown> = {
      updatedAt: serverTimestamp(),
    };
    
    if (updates.role !== undefined) {
      updateData.role = updates.role;
      updateData.permissions = rolePermissions[updates.role];
    }
    
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.isActive !== undefined) updateData.isActive = updates.isActive;
    if (updates.permissions !== undefined) updateData.permissions = updates.permissions;
    
    await updateDoc(adminUserRef, updateData);
    return true;
  } catch (error) {
    console.error('Error updating admin user:', error);
    return false;
  }
}

/**
 * Delete admin user (only full admin can do this)
 */
export async function deleteAdminUser(id: string): Promise<boolean> {
  if (!db) return false;
  
  try {
    // Can't delete main admin
    if (id === 'main-admin') {
      throw new Error('Cannot delete main admin');
    }
    
    const adminUserRef = doc(db, 'adminUsers', id);
    await deleteDoc(adminUserRef);
    return true;
  } catch (error) {
    console.error('Error deleting admin user:', error);
    return false;
  }
}

/**
 * Check if user has specific permission
 */
export async function hasPermission(
  email: string | null | undefined,
  permission: keyof AdminUser['permissions']
): Promise<boolean> {
  const adminUser = await getAdminUser(email);
  if (!adminUser || !adminUser.isActive) return false;
  return adminUser.permissions[permission] === true;
}

