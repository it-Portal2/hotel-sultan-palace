/* eslint-disable @typescript-eslint/no-explicit-any */
// Accounts Management CRUD Operations
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
    serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';
import type {
    LedgerEntry,
    Expense,
    FinancialSummary,
    StaffMember,
    StaffAttendance,
    AuditLog
} from './firestoreService';

export type {
    LedgerEntry,
    Expense,
    FinancialSummary,
    StaffMember,
    StaffAttendance,
    AuditLog
};

// ==================== Accounts Management CRUD Operations ====================

// Create ledger entry
export const createLedgerEntry = async (entryData: Omit<LedgerEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<string | null> => {
    if (!db) return null;
    try {
        const ledgerRef = collection(db, 'accountsLedger');

        // Remove undefined values
        const cleanData: any = {};
        Object.keys(entryData).forEach(key => {
            const value = (entryData as any)[key];
            if (value !== undefined) {
                cleanData[key] = value;
            }
        });

        const docRef = await addDoc(ledgerRef, {
            ...cleanData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
        return docRef.id;
    } catch (error) {
        console.error('Error creating ledger entry:', error);
        return null;
    }
};

// Get ledger entries
export const getLedgerEntries = async (
    startDate?: Date,
    endDate?: Date,
    type?: 'income' | 'expense'
): Promise<LedgerEntry[]> => {
    if (!db) return [];
    try {
        const ledgerRef = collection(db, 'accountsLedger');
        let q = query(ledgerRef, orderBy('date', 'desc'));

        if (type) {
            q = query(ledgerRef, where('entryType', '==', type), orderBy('date', 'desc'));
        }

        const querySnapshot = await getDocs(q);
        let entries = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                date: data.date?.toDate() || new Date(),
                paidDate: data.paidDate?.toDate(),
                createdAt: data.createdAt?.toDate() || new Date(),
                updatedAt: data.updatedAt?.toDate() || new Date(),
            } as LedgerEntry;
        });

        // Filter by date range
        if (startDate || endDate) {
            entries = entries.filter(e => {
                const entryDate = e.date;
                if (startDate && entryDate < startDate) return false;
                if (endDate && entryDate > endDate) return false;
                return true;
            });
        }

        return entries;
    } catch (error) {
        console.error('Error fetching ledger entries:', error);
        return [];
    }
};

// Update ledger entry
export const updateLedgerEntry = async (id: string, entryData: Partial<LedgerEntry>): Promise<boolean> => {
    if (!db) return false;
    try {
        const entryRef = doc(db, 'accountsLedger', id);
        await updateDoc(entryRef, {
            ...entryData,
            updatedAt: serverTimestamp(),
        });
        return true;
    } catch (error) {
        console.error('Error updating ledger entry:', error);
        return false;
    }
};

// Delete ledger entry
export const deleteLedgerEntry = async (id: string): Promise<boolean> => {
    if (!db) return false;
    try {
        const entryRef = doc(db, 'accountsLedger', id);
        await deleteDoc(entryRef);
        return true;
    } catch (error) {
        console.error('Error deleting ledger entry:', error);
        return false;
    }
};

// Create expense
export const createExpense = async (expenseData: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>): Promise<string | null> => {
    if (!db) return null;
    try {
        const expensesRef = collection(db, 'expenses');
        const docRef = await addDoc(expensesRef, {
            ...expenseData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });

        // Map expense category to ledger category
        const ledgerCategory = expenseData.category === 'inventory_purchase' ? 'supplies' : expenseData.category;

        // Also create ledger entry for expense
        await createLedgerEntry({
            date: expenseData.date,
            entryType: 'expense',
            category: ledgerCategory as any,
            amount: expenseData.amount,
            description: expenseData.description,
            paymentMethod: expenseData.paymentMethod,
            referenceId: docRef.id,
            invoiceNumber: expenseData.invoiceNumber,
            accountsPayable: !expenseData.isPaid,
            paidDate: expenseData.paidDate,
            createdBy: expenseData.approvedBy || 'system',
            notes: expenseData.notes,
        });

        return docRef.id;
    } catch (error) {
        console.error('Error creating expense:', error);
        return null;
    }
};

// Get expenses
export const getExpenses = async (startDate?: Date, endDate?: Date): Promise<Expense[]> => {
    if (!db) return [];
    try {
        const expensesRef = collection(db, 'expenses');
        const q = query(expensesRef, orderBy('date', 'desc'));
        const querySnapshot = await getDocs(q);

        let expenses = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                date: data.date?.toDate() || new Date(),
                paidDate: data.paidDate?.toDate(),
                createdAt: data.createdAt?.toDate() || new Date(),
                updatedAt: data.updatedAt?.toDate() || new Date(),
            } as Expense;
        });

        // Filter by date range
        if (startDate || endDate) {
            expenses = expenses.filter(e => {
                const expenseDate = e.date;
                if (startDate && expenseDate < startDate) return false;
                if (endDate && expenseDate > endDate) return false;
                return true;
            });
        }

        return expenses;
    } catch (error) {
        console.error('Error fetching expenses:', error);
        return [];
    }
};

// Update expense
export const updateExpense = async (id: string, expenseData: Partial<Expense>): Promise<boolean> => {
    if (!db) return false;
    try {
        const expenseRef = doc(db, 'expenses', id);
        await updateDoc(expenseRef, {
            ...expenseData,
            updatedAt: serverTimestamp(),
        });
        return true;
    } catch (error) {
        console.error('Error updating expense:', error);
        return false;
    }
};

// Delete expense
export const deleteExpense = async (id: string): Promise<boolean> => {
    if (!db) return false;
    try {
        const expenseRef = doc(db, 'expenses', id);
        await deleteDoc(expenseRef);
        return true;
    } catch (error) {
        console.error('Error deleting expense:', error);
        return false;
    }
};

// Get financial summary
export const getFinancialSummary = async (
    period: 'daily' | 'weekly' | 'monthly' | 'yearly',
    startDate: Date,
    endDate: Date
): Promise<FinancialSummary> => {
    if (!db) {
        return {
            period,
            startDate,
            endDate,
            totalIncome: 0,
            totalExpenses: 0,
            netProfit: 0,
            incomeBreakdown: {},
            expenseBreakdown: {},
            accountsReceivable: 0,
            accountsPayable: 0,
        };
    }

    try {
        const entries = await getLedgerEntries(startDate, endDate);

        let totalIncome = 0;
        let totalExpenses = 0;
        const incomeBreakdown: Record<string, number> = {};
        const expenseBreakdown: Record<string, number> = {};
        let accountsReceivable = 0;
        let accountsPayable = 0;

        entries.forEach(entry => {
            if (entry.entryType === 'income') {
                totalIncome += entry.amount;
                incomeBreakdown[entry.category] = (incomeBreakdown[entry.category] || 0) + entry.amount;
                if (entry.accountsReceivable) {
                    accountsReceivable += entry.amount;
                }
            } else {
                totalExpenses += entry.amount;
                expenseBreakdown[entry.category] = (expenseBreakdown[entry.category] || 0) + entry.amount;
                if (entry.accountsPayable) {
                    accountsPayable += entry.amount;
                }
            }
        });

        return {
            period,
            startDate,
            endDate,
            totalIncome,
            totalExpenses,
            netProfit: totalIncome - totalExpenses,
            incomeBreakdown,
            expenseBreakdown,
            accountsReceivable,
            accountsPayable,
        };
    } catch (error) {
        console.error('Error generating financial summary:', error);
        return {
            period,
            startDate,
            endDate,
            totalIncome: 0,
            totalExpenses: 0,
            netProfit: 0,
            incomeBreakdown: {},
            expenseBreakdown: {},
            accountsReceivable: 0,
            accountsPayable: 0,
        };
    }
};

// Get accounts receivable
export const getAccountsReceivable = async (): Promise<LedgerEntry[]> => {
    if (!db) return [];
    try {
        const ledgerRef = collection(db, 'accountsLedger');
        const q = query(
            ledgerRef,
            where('accountsReceivable', '==', true),
            orderBy('date', 'desc')
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                date: data.date?.toDate() || new Date(),
                paidDate: data.paidDate?.toDate(),
                createdAt: data.createdAt?.toDate() || new Date(),
                updatedAt: data.updatedAt?.toDate() || new Date(),
            } as LedgerEntry;
        });
    } catch (error) {
        console.error('Error fetching accounts receivable:', error);
        return [];
    }
};

// Get accounts payable
export const getAccountsPayable = async (): Promise<LedgerEntry[]> => {
    if (!db) return [];
    try {
        const ledgerRef = collection(db, 'accountsLedger');
        const q = query(
            ledgerRef,
            where('accountsPayable', '==', true),
            orderBy('date', 'desc')
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                date: data.date?.toDate() || new Date(),
                paidDate: data.paidDate?.toDate(),
                createdAt: data.createdAt?.toDate() || new Date(),
                updatedAt: data.updatedAt?.toDate() || new Date(),
            } as LedgerEntry;
        });
    } catch (error) {
        console.error('Error fetching accounts payable:', error);
        return [];
    }
};

// ==================== Staff Management CRUD Operations ====================

// Get all staff members
export const getStaffMembers = async (): Promise<StaffMember[]> => {
    if (!db) return [];
    try {
        const staffRef = collection(db, 'staffMembers');
        // Removed orderBy('name', 'asc') to avoid composite index requirement with inequality filter
        const q = query(staffRef, where('status', '!=', 'terminated'), orderBy('status'));
        const querySnapshot = await getDocs(q);
        const staff = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                joinDate: data.joinDate?.toDate() || new Date(),
                createdAt: data.createdAt?.toDate() || new Date(),
                updatedAt: data.updatedAt?.toDate() || new Date(),
            } as StaffMember;
        });

        // Sort by name in memory
        return staff.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
        console.error('Error fetching staff members:', error);
        return [];
    }
};

// Get single staff member
export const getStaffMember = async (id: string): Promise<StaffMember | null> => {
    if (!db) return null;
    try {
        const staffRef = doc(db, 'staffMembers', id);
        const staffSnap = await getDoc(staffRef);
        if (staffSnap.exists()) {
            const data = staffSnap.data();
            return {
                id: staffSnap.id,
                ...data,
                joinDate: data.joinDate?.toDate() || new Date(),
                createdAt: data.createdAt?.toDate() || new Date(),
                updatedAt: data.updatedAt?.toDate() || new Date(),
            } as StaffMember;
        }
        return null;
    } catch (error) {
        console.error('Error fetching staff member:', error);
        return null;
    }
};

// Create staff member
export const createStaffMember = async (staffData: Omit<StaffMember, 'id' | 'createdAt' | 'updatedAt'>): Promise<string | null> => {
    if (!db) return null;
    try {
        const staffRef = collection(db, 'staffMembers');
        const docRef = await addDoc(staffRef, {
            ...staffData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
        return docRef.id;
    } catch (error) {
        console.error('Error creating staff member:', error);
        return null;
    }
};

// Update staff member
export const updateStaffMember = async (id: string, staffData: Partial<StaffMember>): Promise<boolean> => {
    if (!db) return false;
    try {
        const staffRef = doc(db, 'staffMembers', id);
        await updateDoc(staffRef, {
            ...staffData,
            updatedAt: serverTimestamp(),
        });
        return true;
    } catch (error) {
        console.error('Error updating staff member:', error);
        return false;
    }
};

// Delete staff member (soft delete)
export const deleteStaffMember = async (id: string): Promise<boolean> => {
    if (!db) return false;
    try {
        const staffRef = doc(db, 'staffMembers', id);
        await updateDoc(staffRef, {
            status: 'terminated',
            updatedAt: serverTimestamp(),
        });
        return true;
    } catch (error) {
        console.error('Error deleting staff member:', error);
        return false;
    }
};

// Record attendance
export const recordAttendance = async (attendanceData: Omit<StaffAttendance, 'id' | 'createdAt'>): Promise<string | null> => {
    if (!db) return null;
    try {
        const attendanceRef = collection(db, 'staffAttendance');
        const docRef = await addDoc(attendanceRef, {
            ...attendanceData,
            createdAt: serverTimestamp(),
        });
        return docRef.id;
    } catch (error) {
        console.error('Error recording attendance:', error);
        return null;
    }
};

// Get attendance records
export const getAttendance = async (
    staffId?: string,
    startDate?: Date,
    endDate?: Date
): Promise<StaffAttendance[]> => {
    if (!db) return [];
    try {
        const attendanceRef = collection(db, 'staffAttendance');
        let q = query(attendanceRef, orderBy('date', 'desc'));

        if (staffId) {
            q = query(attendanceRef, where('staffId', '==', staffId), orderBy('date', 'desc'));
        }

        const querySnapshot = await getDocs(q);
        let records = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                date: data.date?.toDate() || new Date(),
                checkIn: data.checkIn?.toDate(),
                checkOut: data.checkOut?.toDate(),
                createdAt: data.createdAt?.toDate() || new Date(),
            } as StaffAttendance;
        });

        // Filter by date range
        if (startDate || endDate) {
            records = records.filter(r => {
                const recordDate = r.date;
                if (startDate && recordDate < startDate) return false;
                if (endDate && recordDate > endDate) return false;
                return true;
            });
        }

        return records;
    } catch (error) {
        console.error('Error fetching attendance records:', error);
        return [];
    }
};

// Get staff by department
export const getStaffByDepartment = async (department: string): Promise<StaffMember[]> => {
    if (!db) return [];
    try {
        const staffRef = collection(db, 'staffMembers');
        const q = query(
            staffRef,
            where('department', '==', department),
            where('status', '==', 'active'),
            orderBy('name', 'asc')
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                joinDate: data.joinDate?.toDate() || new Date(),
                createdAt: data.createdAt?.toDate() || new Date(),
                updatedAt: data.updatedAt?.toDate() || new Date(),
            } as StaffMember;
        });
    } catch (error) {
        console.error('Error fetching staff by department:', error);
        return [];
    }
};

// ==================== Audit Log CRUD Operations ====================

// Create audit log
export const createAuditLog = async (logData: Omit<AuditLog, 'id' | 'createdAt'>): Promise<string | null> => {
    if (!db) return null;
    try {
        const auditRef = collection(db, 'auditLogs');
        const docRef = await addDoc(auditRef, {
            ...logData,
            createdAt: serverTimestamp(),
        });
        return docRef.id;
    } catch (error) {
        console.error('Error creating audit log:', error);
        return null;
    }
};

// Get audit logs
export const getAuditLogs = async (
    startDate?: Date,
    endDate?: Date,
    userId?: string,
    resource?: string
): Promise<AuditLog[]> => {
    if (!db) return [];
    try {
        const auditRef = collection(db, 'auditLogs');
        let q = query(auditRef, orderBy('timestamp', 'desc'));

        if (userId) {
            q = query(auditRef, where('userId', '==', userId), orderBy('timestamp', 'desc'));
        } else if (resource) {
            q = query(auditRef, where('resource', '==', resource), orderBy('timestamp', 'desc'));
        }

        const querySnapshot = await getDocs(q);
        let logs = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                timestamp: data.timestamp?.toDate() || new Date(),
                createdAt: data.createdAt?.toDate() || new Date(),
            } as AuditLog;
        });

        // Filter by date range
        if (startDate || endDate) {
            logs = logs.filter(log => {
                const logDate = log.timestamp;
                if (startDate && logDate < startDate) return false;
                if (endDate && logDate > endDate) return false;
                return true;
            });
        }

        return logs;
    } catch (error) {
        console.error('Error fetching audit logs:', error);
        return [];
    }
};
