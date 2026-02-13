import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db } from "../firebase";

import type { FoodCategory, FoodMenuItem } from "../types/foodMenu";

// Re-export types so consumers can import from here too
export type { FoodCategory, FoodMenuItem };

// ─── Collection Name Constants ──────────────────────────────────────────────
const FOOD_CATEGORIES = "foodCategories";
const FOOD_MENU_ITEMS = "foodMenuItems";
const BAR_CATEGORIES = "barCategories";
const BAR_MENU_ITEMS = "barMenuItems";

// ═════════════════════════════════════════════════════════════════════════════
// GENERIC HELPERS (private) — DRY CRUD for both food & bar
// ═════════════════════════════════════════════════════════════════════════════

// ── Categories ──────────────────────────────────────────────────────────────

async function _getCategories(
  collectionName: string,
  typeFilter?: string,
): Promise<FoodCategory[]> {
  if (!db) return [];
  try {
    const ref = collection(db, collectionName);
    const q = query(ref, orderBy("sortOrder", "asc"));
    const snapshot = await getDocs(q);
    let cats = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
    })) as FoodCategory[];

    if (typeFilter) {
      // In-memory filter to avoid composite index requirements
      // Legacy items (undefined type) are assumed to be "food"
      cats = cats.filter(
        (c) => c.type === typeFilter || (!c.type && typeFilter === "food"),
      );
    }
    return cats;
  } catch (error) {
    console.error(`Error fetching categories from ${collectionName}:`, error);
    return [];
  }
}

async function _getCategory(
  collectionName: string,
  id: string,
): Promise<FoodCategory | null> {
  if (!db || !id) return null;
  try {
    const docRef = doc(db, collectionName, id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      createdAt: data.createdAt?.toDate?.() || new Date(),
      updatedAt: data.updatedAt?.toDate?.() || new Date(),
    } as FoodCategory;
  } catch (error) {
    console.error(`Error fetching category from ${collectionName}:`, error);
    return null;
  }
}

async function _createCategory(
  collectionName: string,
  data: Partial<FoodCategory>,
): Promise<string | null> {
  if (!db) return null;
  try {
    const slug =
      data.name
        ?.toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "") || "";
    const id = `cat_${slug}`;
    const docRef = doc(db, collectionName, id);

    const existing = await getDoc(docRef);
    if (existing.exists()) {
      throw new Error("Category with this name already exists");
    }

    const categoryData = {
      ...data,
      id,
      isParentCategory: !data.parentCategoryId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(docRef, categoryData);
    return id;
  } catch (error) {
    console.error(`Error creating category in ${collectionName}:`, error);
    throw error;
  }
}

async function _updateCategory(
  collectionName: string,
  id: string,
  data: Partial<FoodCategory>,
): Promise<boolean> {
  if (!db || !id) return false;
  try {
    const docRef = doc(db, collectionName, id);
    const updateData = {
      ...data,
      isParentCategory: !data.parentCategoryId,
      updatedAt: serverTimestamp(),
    };
    delete (updateData as any).id;
    delete (updateData as any).createdAt;

    await updateDoc(docRef, updateData);
    return true;
  } catch (error) {
    console.error(`Error updating category in ${collectionName}:`, error);
    throw error;
  }
}

async function _deleteCategory(
  collectionName: string,
  itemsCollectionName: string,
  id: string,
): Promise<boolean> {
  if (!db || !id) return false;
  try {
    // Check for child categories
    const childrenQuery = query(
      collection(db, collectionName),
      where("parentCategoryId", "==", id),
    );
    const childrenSnapshot = await getDocs(childrenQuery);
    if (!childrenSnapshot.empty) {
      throw new Error(
        "Cannot delete this category because it has sub-categories. Please delete the sub-categories first.",
      );
    }

    // Check for items in this category
    const itemsQuery = query(
      collection(db, itemsCollectionName),
      where("categoryId", "==", id),
    );
    const itemsSnapshot = await getDocs(itemsQuery);
    if (!itemsSnapshot.empty) {
      throw new Error(
        "Cannot delete this category because it contains menu items. Please delete the menu items first.",
      );
    }

    await deleteDoc(doc(db, collectionName, id));
    return true;
  } catch (error) {
    console.error(`Error deleting category from ${collectionName}:`, error);
    throw error;
  }
}

// ── Menu Items ──────────────────────────────────────────────────────────────

async function _getMenuItems(
  collectionName: string,
  categoryId?: string,
): Promise<FoodMenuItem[]> {
  if (!db) return [];
  try {
    const ref = collection(db, collectionName);
    let q;
    if (categoryId) {
      q = query(
        ref,
        where("categoryId", "==", categoryId),
        orderBy("name", "asc"),
      );
    } else {
      q = query(ref, orderBy("name", "asc"));
    }
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
    })) as FoodMenuItem[];
  } catch (error) {
    console.error(`Error fetching menu items from ${collectionName}:`, error);
    return [];
  }
}

async function _getMenuItem(
  collectionName: string,
  id: string,
): Promise<FoodMenuItem | null> {
  if (!db || !id) return null;
  try {
    const docRef = doc(db, collectionName, id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      createdAt: data.createdAt?.toDate?.() || new Date(),
      updatedAt: data.updatedAt?.toDate?.() || new Date(),
    } as FoodMenuItem;
  } catch (error) {
    console.error(`Error fetching menu item from ${collectionName}:`, error);
    return null;
  }
}

async function _createMenuItem(
  collectionName: string,
  data: Partial<FoodMenuItem>,
): Promise<string | null> {
  if (!db) return null;
  try {
    const slug =
      data.name
        ?.toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "") || "";
    const categorySlug = data.categoryId?.replace("cat_", "") || "item";
    const id = `mi_${categorySlug}_${slug}`;
    const docRef = doc(db, collectionName, id);

    const itemData = {
      ...data,
      id,
      hasVariants: (data.variants?.length || 0) > 0,
      hasGroups: (data.groups?.length || 0) > 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(docRef, itemData);
    return id;
  } catch (error) {
    console.error(`Error creating menu item in ${collectionName}:`, error);
    throw error;
  }
}

async function _updateMenuItem(
  collectionName: string,
  id: string,
  data: Partial<FoodMenuItem>,
): Promise<boolean> {
  if (!db || !id) return false;
  try {
    const docRef = doc(db, collectionName, id);
    const updateData = {
      ...data,
      hasVariants: (data.variants?.length || 0) > 0,
      hasGroups: (data.groups?.length || 0) > 0,
      updatedAt: serverTimestamp(),
    };
    delete (updateData as any).id;
    delete (updateData as any).createdAt;

    await updateDoc(docRef, updateData);
    return true;
  } catch (error) {
    console.error(`Error updating menu item in ${collectionName}:`, error);
    throw error;
  }
}

async function _deleteMenuItem(
  collectionName: string,
  id: string,
): Promise<boolean> {
  if (!db || !id) return false;
  try {
    await deleteDoc(doc(db, collectionName, id));
    return true;
  } catch (error) {
    console.error(`Error deleting menu item from ${collectionName}:`, error);
    throw error;
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// PUBLIC API — FOOD
// ═════════════════════════════════════════════════════════════════════════════

export const getFoodCategories = () => _getCategories(FOOD_CATEGORIES, "food");
export const getFoodCategory = (id: string) =>
  _getCategory(FOOD_CATEGORIES, id);
export const createFoodCategory = (data: Partial<FoodCategory>) =>
  _createCategory(FOOD_CATEGORIES, data);
export const updateFoodCategory = (id: string, data: Partial<FoodCategory>) =>
  _updateCategory(FOOD_CATEGORIES, id, data);
export const deleteFoodCategory = (id: string) =>
  _deleteCategory(FOOD_CATEGORIES, FOOD_MENU_ITEMS, id);

export const getFoodMenuItems = async (categoryId?: string) => {
  const items = await _getMenuItems(FOOD_MENU_ITEMS, categoryId);
  // Filter out bar items that might be in the legacy collection
  return items.filter((i) => i.kitchenSection !== "bar");
};
export const getFoodMenuItem = (id: string) =>
  _getMenuItem(FOOD_MENU_ITEMS, id);
export const createFoodMenuItem = (data: Partial<FoodMenuItem>) =>
  _createMenuItem(FOOD_MENU_ITEMS, data);
export const updateFoodMenuItem = (id: string, data: Partial<FoodMenuItem>) =>
  _updateMenuItem(FOOD_MENU_ITEMS, id, data);
export const deleteFoodMenuItem = (id: string) =>
  _deleteMenuItem(FOOD_MENU_ITEMS, id);

// ═════════════════════════════════════════════════════════════════════════════
// PUBLIC API — BAR
// ═════════════════════════════════════════════════════════════════════════════

export const getBarCategories = () => _getCategories(BAR_CATEGORIES);
export const getBarCategory = (id: string) => _getCategory(BAR_CATEGORIES, id);
export const createBarCategory = (data: Partial<FoodCategory>) =>
  _createCategory(BAR_CATEGORIES, data);
export const updateBarCategory = (id: string, data: Partial<FoodCategory>) =>
  _updateCategory(BAR_CATEGORIES, id, data);
export const deleteBarCategory = (id: string) =>
  _deleteCategory(BAR_CATEGORIES, BAR_MENU_ITEMS, id);

export const getBarMenuItems = (categoryId?: string) =>
  _getMenuItems(BAR_MENU_ITEMS, categoryId);
export const getBarMenuItem = (id: string) => _getMenuItem(BAR_MENU_ITEMS, id);
export const createBarMenuItem = (data: Partial<FoodMenuItem>) =>
  _createMenuItem(BAR_MENU_ITEMS, data);
export const updateBarMenuItem = (id: string, data: Partial<FoodMenuItem>) =>
  _updateMenuItem(BAR_MENU_ITEMS, id, data);
export const deleteBarMenuItem = (id: string) =>
  _deleteMenuItem(BAR_MENU_ITEMS, id);
