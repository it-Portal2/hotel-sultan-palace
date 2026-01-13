import { db } from './firebase';
import { collection, doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove, writeBatch, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { getRooms, getAllBookings, Room, Booking, getRoomTypes } from './firestoreService';

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
// Check availability for a specific suite (or all rooms) in a date range
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

        // 2. Get all PHYSICAL rooms from roomTypes collection
        // The 'rooms' collection only contains metadata/definitions. 
        // 'roomTypes' contains the actual 15 bookable units.
        const allPhysicalRooms = await getRoomTypes();
        console.log(`[AvailCheck] Found ${allPhysicalRooms.length} physical rooms from getRoomTypes`);

        // 3. Filter rooms
        const availableRooms = allPhysicalRooms.filter(room => {
            // Filter by suite type if requested
            if (suiteType) {
                // Direct match on the suiteType field in roomTypes collection
                if (room.suiteType !== suiteType) {
                    return false;
                }
            }

            // Check if occupied
            // We check if the specific roomName (e.g. "Papaya") is in the occupied set
            if (occupiedRoomSet.has(room.roomName)) {
                return false;
            }

            // Also check if the room itself is active
            if (!room.isActive) {
                return false;
            }

            return true;
        });

        console.log(`[AvailCheck] Checking ${suiteType || 'ALL'} for ${getDateString(checkIn)} to ${getDateString(checkOut)}`);
        console.log(`[AvailCheck] Occupied set:`, Array.from(occupiedRoomSet));
        console.log(`[AvailCheck] Final available: ${availableRooms.length} rooms`);

        // Return the names of the available physical rooms
        return availableRooms.map(r => r.roomName);
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
