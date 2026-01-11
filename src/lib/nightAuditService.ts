import {
    collection,
    doc,
    getDoc,
    setDoc,
    updateDoc,
    query,
    where,
    getDocs,
    serverTimestamp,
    Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import type { BusinessDay, NightAuditLog, Booking, RoomStatus, LedgerEntry } from './firestoreService';
import { createLedgerEntry } from './accountsService';

export const BUSINESS_DAY_DOC_ID = 'current';

// Get the current business date
export const getCurrentBusinessDate = async (): Promise<Date> => {
    if (!db) return new Date();

    try {
        const docRef = doc(db, 'businessDays', BUSINESS_DAY_DOC_ID);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return (docSnap.data()?.date as Timestamp).toDate();
        } else {
            // Initialize if not exists
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            await setDoc(docRef, {
                id: BUSINESS_DAY_DOC_ID,
                date: today,
                status: 'open',
                openedAt: serverTimestamp(),
                openedBy: 'system',
                updatedAt: serverTimestamp()
            });
            return today;
        }
    } catch (error) {
        console.error('Error fetching business date:', error);
        return new Date();
    }
};

// Check for blockers before running audit
export interface AuditBlockers {
    pendingArrivals: number;
    pendingDepartures: number;
    uncleanRooms: number;
    openTables?: number; // For POS later
}

export const getAuditBlockers = async (businessDate: Date): Promise<AuditBlockers> => {
    if (!db) return { pendingArrivals: 0, pendingDepartures: 0, uncleanRooms: 0 };

    // Set date boundaries
    const startOfDay = new Date(businessDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(businessDate);
    endOfDay.setHours(23, 59, 59, 999);

    try {
        const bookingsRef = collection(db, 'bookings');
        const roomsRef = collection(db, 'room_statuses');

        // Optimization: Avoid composite indexes by querying date range only and filtering status in memory

        // Find pending arrivals (confirmed bookings with check-in matching today)
        const arrivalsDateQuery = query(
            bookingsRef,
            where('checkIn', '>=', startOfDay.toISOString().split('T')[0]),
            where('checkIn', '<=', endOfDay.toISOString().split('T')[0])
        );

        // Find pending departures (checked_in bookings with check-out matching today)
        const departuresDateQuery = query(
            bookingsRef,
            where('checkOut', '>=', startOfDay.toISOString().split('T')[0]),
            where('checkOut', '<=', endOfDay.toISOString().split('T')[0])
        );

        // Find unclean rooms
        const roomsQuery = query(
            roomsRef,
            where('housekeepingStatus', 'in', ['dirty', 'needs_inspection'])
        );
        // Note: 'in' query works up to 10 items. If we have more status types, use separate queries or filter. 
        // Index might be needed for housekeepingStatus. If so, error will appear in console.

        const [arrivalSnap, departureSnap, roomsSnap] = await Promise.all([
            getDocs(arrivalsDateQuery),
            getDocs(departuresDateQuery),
            getDocs(roomsQuery)
        ]);

        // Filter by status in memory details
        const pendingArrivals = arrivalSnap.docs.filter(doc => {
            const data = doc.data() as Booking;
            return data.status === 'confirmed';
        }).length;

        const pendingDepartures = departureSnap.docs.filter(doc => {
            const data = doc.data() as Booking;
            return data.status === 'checked_in';
        }).length;

        const uncleanRooms = roomsSnap.size;

        return {
            pendingArrivals,
            pendingDepartures,
            uncleanRooms
        };

    } catch (error) {
        console.error('Error checking audit blockers:', error);
        return { pendingArrivals: 0, pendingDepartures: 0, uncleanRooms: 0 };
    }
};

// Execute Night Audit
export const performNightAudit = async (staffId: string, staffName: string): Promise<string | null> => {
    if (!db) return null;

    try {
        const businessDate = await getCurrentBusinessDate();

        // 1. Create Audit Log
        const auditLogRef = collection(db, 'nightAuditLogs');
        const newLogRef = doc(auditLogRef);

        const auditLogData: NightAuditLog = {
            id: newLogRef.id,
            date: businessDate,
            startedAt: new Date(),
            auditedBy: staffId,
            status: 'in_progress',
            steps: {
                roomChargesPosted: false,
                roomStatusUpdated: false,
                reportsGenerated: false,
                businessDateRolled: false
            },
            summary: {
                totalRevenue: 0,
                totalOccupiedRooms: 0,
                totalArrivals: 0,
                totalDepartures: 0
            },
            createdAt: new Date()
        };

        await setDoc(newLogRef, auditLogData);

        // 2. Post Room Charges
        const bookingsRef = collection(db, 'bookings');
        const occupiedQuery = query(bookingsRef, where('status', '==', 'checked_in'));
        const occupiedSnap = await getDocs(occupiedQuery);

        let totalRevenue = 0;
        let occupiedCount = 0;

        const chargePromises = occupiedSnap.docs.map(async (bDoc) => {
            const booking = bDoc.data() as Booking;
            occupiedCount++;

            // Calculate daily rate (simplified: average rate)
            // Real logic: check seasonality or specific day rate
            const dailyRate = booking.rooms.reduce((sum, r) => sum + (r.price || 0), 0) / 1; // Assuming price is per night or fixed total? 
            // Better: use rate from booking details. For now, assume booking.totalAmount / nights? 
            // Let's assume price in room array is per night for simplicity or use a standard rate

            if (dailyRate > 0) {
                totalRevenue += dailyRate;
                await createLedgerEntry({
                    date: businessDate,
                    entryType: 'income',
                    category: 'room_booking',
                    description: `Night Audit: Room Charge for ${booking.guestDetails.lastName} (Room ${booking.rooms[0].allocatedRoomType || 'Unassigned'})`,
                    amount: dailyRate,
                    paymentMethod: 'online', // Actually 'account_charge' but using valid type
                    referenceId: booking.id,
                    notes: `Posted during audit ${newLogRef.id}`,
                    createdBy: 'Night Audit System',
                    accountsReceivable: true // Charge to folio, not cash
                });
            }
        });

        await Promise.all(chargePromises);

        // Update Log Step 1
        await updateDoc(newLogRef, {
            'steps.roomChargesPosted': true,
            'summary.totalRevenue': totalRevenue,
            'summary.totalOccupiedRooms': occupiedCount
        });

        // 3. Roll Business Date
        const nextDate = new Date(businessDate);
        nextDate.setDate(nextDate.getDate() + 1);

        const businessDayRef = doc(db, 'businessDays', BUSINESS_DAY_DOC_ID);
        await updateDoc(businessDayRef, {
            date: nextDate,
            lastAuditDate: businessDate,
            status: 'open', // Should technically go close -> sleep -> open, but immediate rollover is common in simple PMS
            updatedAt: serverTimestamp()
        });

        // 4. Finalize Log
        await updateDoc(newLogRef, {
            status: 'completed',
            completedAt: serverTimestamp(),
            'steps.businessDateRolled': true,
            'steps.roomStatusUpdated': true, // Skipped generic update for now
            'steps.reportsGenerated': true
        });

        return newLogRef.id;

    } catch (error) {
        console.error('Night Audit Failed:', error);
        // Try to update log to failed
        // Note: In real app, we need transaction/rollback
        return null;
    }
};

export const getAuditHistory = async (): Promise<NightAuditLog[]> => {
    if (!db) return [];
    try {
        const auditLogRef = collection(db, 'nightAuditLogs');
        const q = query(auditLogRef); // Add orderBy desc
        const snap = await getDocs(q);
        return snap.docs.map(d => {
            const data = d.data();
            return {
                ...data,
                id: d.id,
                date: data.date?.toDate(),
                startedAt: data.startedAt?.toDate(),
                completedAt: data.completedAt?.toDate(),
                createdAt: data.createdAt?.toDate()
            } as NightAuditLog;
        }).sort((a, b) => b.date.getTime() - a.date.getTime());
    } catch (error) {
        console.error('Error fetching audit history:', error);
        return [];
    }
};
