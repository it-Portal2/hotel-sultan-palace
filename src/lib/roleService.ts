
import { db } from './firebase';
import {
    collection,
    doc,
    getDocs,
    getDoc,
    setDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    orderBy,
    serverTimestamp,
    where
} from 'firebase/firestore';
import { type RBACPermissions, defaultPermissions, type AdminRoleType } from './adminUsers';

export interface SystemRole {
    id: string; // "manager", "custom_role_123"
    name: string; // "Manager", "Senior Waiter"
    description: string;
    isSystem: boolean; // true if it's a built-in role (cannot be deleted)
    permissions: RBACPermissions;
    createdAt: Date;
    updatedAt: Date;
}

// Collection reference
const ROLES_COLLECTION = 'systemRoles';

/**
 * Initialize default system roles if they don't exist
 */
export async function initializeDefaultRoles(): Promise<void> {
    if (!db) return;

    const defaults: Partial<SystemRole>[] = [
        { id: 'super_admin', name: 'Super Admin', description: 'Full system access', isSystem: true, permissions: defaultPermissions.super_admin },
        { id: 'manager', name: 'General Manager', description: 'Management access to all operations', isSystem: true, permissions: defaultPermissions.manager },
        { id: 'receptionist', name: 'Receptionist', description: 'Front desk and guest management', isSystem: true, permissions: defaultPermissions.receptionist },
        { id: 'chef', name: 'Head Chef', description: 'Kitchen and inventory management', isSystem: true, permissions: defaultPermissions.chef },
        { id: 'housekeeper', name: 'Housekeeper', description: 'Room cleaning and maintenance', isSystem: true, permissions: defaultPermissions.housekeeper },
        { id: 'auditor', name: 'Night Auditor', description: 'Financial audit and reporting (Read Only)', isSystem: true, permissions: defaultPermissions.auditor },
        { id: 'accountant', name: 'Accountant', description: 'Financial management and billing', isSystem: true, permissions: defaultPermissions.accountant },
    ];

    for (const role of defaults) {
        if (!role.id) continue;
        const ref = doc(db, ROLES_COLLECTION, role.id);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
            await setDoc(ref, {
                ...role,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
            console.log(`Initialized default role: ${role.name}`);
        }
    }
}

/**
 * Get all defined roles (System + Custom)
 */
export async function getAllRoles(): Promise<SystemRole[]> {
    if (!db) return [];
    try {
        const q = query(collection(db, ROLES_COLLECTION)); // You might want to sort this manually
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            console.log('No roles found. Initializing default roles...');
            await initializeDefaultRoles();
            // Re-fetch after initialization
            const qAfter = query(collection(db, ROLES_COLLECTION));
            const snapAfter = await getDocs(qAfter);
            const roles = snapAfter.docs.map(d => ({ id: d.id, ...d.data() } as SystemRole));

            return roles.sort((a, b) => {
                if (a.isSystem && !b.isSystem) return -1;
                if (!a.isSystem && b.isSystem) return 1;
                return a.name.localeCompare(b.name);
            });
        }

        // Sort logic: System roles first, then alphabetical custom roles
        const roles = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as SystemRole));

        return roles.sort((a, b) => {
            if (a.isSystem && !b.isSystem) return -1;
            if (!a.isSystem && b.isSystem) return 1;
            return a.name.localeCompare(b.name);
        });
    } catch (error) {
        console.error('Error fetching roles:', error);
        return [];
    }
}

/**
 * Create a new custom role
 */
export async function createCustomRole(data: { name: string; description: string; permissions: RBACPermissions }): Promise<string> {
    if (!db) throw new Error('DB not initialized');

    const roleData = {
        name: data.name,
        description: data.description,
        permissions: data.permissions,
        isSystem: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    };

    const ref = await addDoc(collection(db, ROLES_COLLECTION), roleData);
    return ref.id;
}

/**
 * Update an existing role
 */
export async function updateRole(roleId: string, data: Partial<SystemRole>): Promise<void> {
    if (!db) throw new Error('DB not initialized');

    // Protect system role IDs from being changed, but permissions can be tweaked if desired
    // (Usually we lock system role permissions, but for flexibility we might allow updates)

    const ref = doc(db, ROLES_COLLECTION, roleId);
    await updateDoc(ref, {
        ...data,
        updatedAt: serverTimestamp()
    });
}

/**
 * Delete a custom role
 */
export async function deleteRole(roleId: string): Promise<boolean> {
    if (!db) return false;

    const ref = doc(db, ROLES_COLLECTION, roleId);
    const snap = await getDoc(ref);

    if (snap.exists() && snap.data().isSystem) {
        throw new Error('Cannot delete a system role.');
    }

    await deleteDoc(ref);
    return true;
}
