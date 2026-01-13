import { db } from './firebase';
import { collection, doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove, writeBatch, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { getRooms, getAllBookings, Room, Booking } from './firestoreService';

export interface DailyInventory {
    date: string; // YYYY-MM-DD
    occupiedRooms: string[]; // List of Room IDs (e.g., "Room 101")
}

// Helper to formulate date strings YYYY-MM-DD
export const getDateString = (date: Date): string => {
    return date.toISOString().split('T')[0];
};

export const getDatesInRange = (startDate: Date, endDate: Date): string[] => {
    const dates: string[] = [];
    const currentDate = new Date(startDate);
    const lastDate = new Date(endDate);

    // Normalize to start of day to avoid time issues
    currentDate.setHours(0, 0, 0, 0);
    lastDate.setHours(0, 0, 0, 0);

    // Loop through dates
    // note: check-out date is usually not included in "occupation" for that night, 
    // but standard hotel logic is: you stay the night of check-in, up to (but not including night of) check-out.
    // So we iterate: currentDate < lastDate
    while (currentDate < lastDate) {
        dates.push(getDateString(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
    }
    return dates;
};

// Reserve a room for a date range
export const reserveRoomInInventory = async (
    checkIn: Date,
    checkOut: Date,
    roomName: string
): Promise<void> => {
    const firestore = db;
    if (!firestore) {
        throw new Error('Firestore is not initialized');
    }

    try {
        const dates = getDatesInRange(checkIn, checkOut);
        const batch = writeBatch(firestore);

        for (const dateStr of dates) {
            const docRef = doc(firestore, 'daily_inventory', dateStr);
            // We use setDoc with merge to ensure document exists, 
            // but arrayUnion requires an update or set-merge.
            // Ideally we check existence or just set with merge strategy.
            // Firestore batch set with merge is efficient.
            batch.set(docRef, {
                date: dateStr,
                occupiedRooms: arrayUnion(roomName)
            }, { merge: true });
        }

        await batch.commit();
        console.log(`Reserved ${roomName} from ${getDateString(checkIn)} to ${getDateString(checkOut)}`);
    } catch (error) {
        console.error('Error reserving room in inventory:', error);
        throw error;
    }
};

// Release a room for a date range (Cancellation/Modification)
export const releaseRoomFromInventory = async (
    checkIn: Date,
    checkOut: Date,
    roomName: string
): Promise<void> => {
    const firestore = db;
    if (!firestore) {
        throw new Error('Firestore is not initialized');
    }

    try {
        const dates = getDatesInRange(checkIn, checkOut);
        const batch = writeBatch(firestore);

        for (const dateStr of dates) {
            const docRef = doc(firestore, 'daily_inventory', dateStr);
            batch.set(docRef, {
                occupiedRooms: arrayRemove(roomName)
            }, { merge: true });
        }

        await batch.commit();
        console.log(`Released ${roomName} from ${getDateString(checkIn)} to ${getDateString(checkOut)}`);
    } catch (error) {
        console.error('Error releasing room from inventory:', error);
        throw error;
    }
};

// Check availability for a specific suite (or all rooms) in a date range
export const checkDailyAvailability = async (
    checkIn: Date,
    checkOut: Date,
    suiteType?: string
): Promise<string[]> => {
    const firestore = db;
    if (!firestore) {
        console.error('Firestore not initialized');
        return [];
    }

    try {
        const dates = getDatesInRange(checkIn, checkOut);
        if (dates.length === 0) return [];

        // 1. Get all daily inventory docs for the date range
        // Optimization: If range is huge, this might be many reads, but typically < 30 docs.
        // We can use Promise.all to fetch them.
        const inventoryPromises = dates.map(dateStr => getDoc(doc(firestore, 'daily_inventory', dateStr)));
        const inventorySnapshots = await Promise.all(inventoryPromises);

        const occupiedRoomSet = new Set<string>();

        inventorySnapshots.forEach(snap => {
            if (snap.exists()) {
                const data = snap.data() as DailyInventory;
                if (data.occupiedRooms) {
                    data.occupiedRooms.forEach(r => occupiedRoomSet.add(r));
                }
            }
        });

        // 2. Get all rooms from system
        const allRooms = await getRooms();

        // 3. Filter rooms
        const availableRooms = allRooms.filter(room => {
            // Filter by suite type if requested
            if (suiteType && room.suiteType !== suiteType) return false;

            // Check if occupied
            if (occupiedRoomSet.has(room.name)) return false;

            // Also check maintenance status (from room object or status collection?)
            // Assuming 'status' on room object reflects CURRENT status, but for future dates we rely on inventory.
            // If maintenance is strictly date-based, it should also be in inventory or separate check.
            // For now, assuming standard inventory validation.

            return true;
        });

        return availableRooms.map(r => r.name);
    } catch (error) {
        console.error('Error checking daily availability:', error);
        throw error;
    }
};

// One-time Sync Function: Populate inventory from existing bookings
export const syncBookingsToInventory = async (): Promise<string> => {
    const firestore = db;
    if (!firestore) {
        throw new Error('Firestore is not initialized');
    }

    try {
        console.log('Starting Inventory Sync...');
        const allBookings = await getAllBookings();
        let count = 0;

        // Filter for active bookings only
        const activeBookings = allBookings.filter(b =>
            b.status === 'confirmed' || b.status === 'checked_in'
        );

        const batch = writeBatch(firestore);
        // Note: Batches have 500 ops limit. If bookings > 100, we might need multiple batches.
        // For now assuming typical dev load. If prod, logic needs chunking.

        // We will simple call reserve logic sequentially to avoid batch complexity here 
        // or group them. Actually, reserveRoomInInventory uses a batch, so we can't nest batches.
        // We will run them sequentially.

        for (const booking of activeBookings) {
            const startDate = new Date(booking.checkIn);
            const endDate = new Date(booking.checkOut);

            if (booking.rooms) {
                for (const room of booking.rooms) {
                    if (room.allocatedRoomType) {
                        // We reuse the logic, but without creating a new batch every time if we want speed.
                        // But for safety/simplicity, calling the function is fine.
                        await reserveRoomInInventory(startDate, endDate, room.allocatedRoomType);
                        count++;
                    }
                }
            }
        }

        return `Successfully synced ${count} room allocations to inventory.`;
    } catch (error) {
        console.error('Error syncing inventory:', error);
        throw error;
    }
};
