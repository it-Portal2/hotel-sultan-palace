'use server';

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
import { db } from '@/lib/firebase';
import type { NightAuditLog, Booking, FoodOrder } from '@/lib/firestoreService';
import { createLedgerEntry, getLedgerEntries } from '@/lib/accountsService';
import { generateNightAuditPDF } from '@/lib/reportGenerator';
import { sendNightAuditReport } from '@/lib/emailService';

const BUSINESS_DAY_DOC_ID = 'current';

// Helper to get date (this duplicates logic but needed for server action if we don't import from client service to avoid cycles)
const getCurrentBusinessDateServer = async (): Promise<Date> => {
    if (!db) return new Date();
    try {
        const docRef = doc(db, 'businessDays', BUSINESS_DAY_DOC_ID);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return (docSnap.data()?.date as Timestamp).toDate();
        }
        return new Date();
    } catch (error) {
        console.error('Error fetching business date:', error);
        return new Date();
    }
};

export async function performNightAudit(staffId: string, staffName: string): Promise<string | null> {
    if (!db) return null;

    try {
        const businessDate = await getCurrentBusinessDateServer();

        // Define Next Date for Tomorrow's Arrivals/Departures
        const nextDate = new Date(businessDate);
        nextDate.setDate(nextDate.getDate() + 1);
        const nextDateStr = nextDate.toISOString().split('T')[0];
        const currentDateStr = businessDate.toISOString().split('T')[0];

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

        // Collect Data for Report
        const stayingOver: Booking[] = [];
        const checkedOutToday: Booking[] = [];

        const chargePromises = occupiedSnap.docs.map(async (bDoc) => {
            const booking = bDoc.data() as Booking;
            occupiedCount++;
            stayingOver.push(booking);

            // Calculate daily rate
            const dailyRate = booking.rooms.reduce((sum, r) => sum + (r.price || 0), 0) / 1;

            if (dailyRate > 0) {
                totalRevenue += dailyRate;
                await createLedgerEntry({
                    date: businessDate,
                    entryType: 'income',
                    category: 'room_booking',
                    description: `Night Audit: Room Charge for ${booking.guestDetails.lastName} (Room ${booking.rooms[0].allocatedRoomType || 'Unassigned'})`,
                    amount: dailyRate,
                    paymentMethod: 'online',
                    referenceId: booking.id,
                    notes: `Posted during audit ${newLogRef.id}`,
                    createdBy: 'Night Audit System',
                    accountsReceivable: true
                });
            }
        });

        await Promise.all(chargePromises);

        // Fetch Data for Report
        const startOfDay = new Date(businessDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(businessDate);
        endOfDay.setHours(23, 59, 59, 999);

        // 2a. Finance
        const ledgerEntries = await getLedgerEntries(startOfDay, endOfDay);

        // 2b. F&B
        const foodOrdersRef = collection(db, 'foodOrders');
        const foodOrdersQuery = query(
            foodOrdersRef,
            where('createdAt', '>=', Timestamp.fromDate(startOfDay)),
            where('createdAt', '<=', Timestamp.fromDate(endOfDay))
        );
        const foodOrdersSnap = await getDocs(foodOrdersQuery);
        const foodOrders = foodOrdersSnap.docs.map(d => d.data() as FoodOrder);

        // 2c. Housekeeping
        const roomStatusesRef = collection(db, 'room_statuses');
        const roomStatusesSnap = await getDocs(query(roomStatusesRef));
        const roomStatuses = roomStatusesSnap.docs.map(d => d.data());

        // Arrivals Tomorrow
        const arrivalsQuery = query(bookingsRef, where('checkIn', '==', nextDateStr), where('status', '==', 'confirmed'));
        const arrivalsSnap = await getDocs(arrivalsQuery);
        const arrivalsTomorrow = arrivalsSnap.docs.map(d => d.data() as Booking);

        // Departures Tomorrow
        const departuresQuery = query(bookingsRef, where('checkOut', '==', nextDateStr), where('status', '==', 'checked_in'));
        const departuresSnap = await getDocs(departuresQuery);
        const departuresTomorrow = departuresSnap.docs.map(d => d.data() as Booking);

        // Checked Out Today
        const checkedOutQuery = query(bookingsRef, where('checkOut', '==', currentDateStr), where('status', '==', 'checked_out'));
        const checkedOutSnap = await getDocs(checkedOutQuery);
        checkedOutToday.push(...checkedOutSnap.docs.map(d => d.data() as Booking));

        // Update Log Step 1
        await updateDoc(newLogRef, {
            'steps.roomChargesPosted': true,
            'summary.totalRevenue': totalRevenue,
            'summary.totalOccupiedRooms': occupiedCount,
            'summary.totalArrivals': arrivalsTomorrow.length,
            'summary.totalDepartures': departuresTomorrow.length
        });

        // 3. Roll Business Date
        const businessDayRef = doc(db, 'businessDays', BUSINESS_DAY_DOC_ID);
        await updateDoc(businessDayRef, {
            date: nextDate,
            lastAuditDate: businessDate,
            status: 'open',
            updatedAt: serverTimestamp()
        });

        // 4. Generate & Send Report
        try {
            // No need for dynamic imports since this is running on server
            const pdfBuffer = generateNightAuditPDF({
                businessDate,
                stayingOver,
                arrivalsTomorrow,
                departuresTomorrow,
                checkedOutToday,
                generatedBy: staffName,
                financeData: {
                    ledgerEntries,
                    totalRevenue
                },
                fbData: {
                    orders: foodOrders
                },
                housekeepingData: {
                    rooms: roomStatuses as any
                }
            });

            await sendNightAuditReport(pdfBuffer, 'reservations@sultanpalacehotelznz.com', businessDate);

            await updateDoc(newLogRef, {
                'steps.reportsGenerated': true
            });

        } catch (reportError) {
            console.error("Error generating/sending report:", reportError);
            await updateDoc(newLogRef, {
                error: reportError instanceof Error ? reportError.message : 'Unknown report error'
            });
        }

        // 5. Finalize Log
        const finalStatus = (await getDoc(newLogRef)).data()?.error ? 'completed_with_warnings' : 'completed';

        await updateDoc(newLogRef, {
            status: finalStatus,
            completedAt: serverTimestamp(),
            'steps.businessDateRolled': true,
            'steps.roomStatusUpdated': true
        });

        return newLogRef.id;

    } catch (error) {
        console.error('Night Audit Failed:', error);
        return null;
    }
}
