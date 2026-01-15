"use client";

import React, { useState, useEffect } from 'react';
import ReportFilters, { ReportFilterState } from '@/components/admin/reports/ReportFilters';
import { getAllBookings, Booking } from '@/lib/firestoreService';
import { useToast } from '@/context/ToastContext';
import { PrinterIcon, CalendarDaysIcon, ClockIcon } from '@heroicons/react/24/outline';
import { useAdminRole } from '@/context/AdminRoleContext';

export default function ArrivalListPage() {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(false);
    const { showToast } = useToast();
    const { adminUser } = useAdminRole();

    // Initial load
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await getAllBookings();
            setBookings(data);
            // Don't auto-filter immediately, wait for user or initial filter effect
        } catch (error) {
            console.error(error);
            showToast('Failed to load data', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (filters: ReportFilterState) => {
        const start = new Date(filters.startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(filters.endDate);
        end.setHours(23, 59, 59, 999);

        let result = bookings.filter(b => {
            // Filter Logic
            // ... (keep existing filters)
            // 6. Filter by Market (Mock)
            if (filters.market && (b as any).market !== filters.market) return false;

            // 7. Room Type
            if (filters.roomType) {
                const hasType = b.rooms.some(r => r.allocatedRoomType === filters.roomType);
                if (!hasType) return false;
            }

            // 8. Meal Plan
            if (filters.rateTypeId) {
                const hasMealPlan = b.rooms.some(r => r.mealPlan === filters.rateTypeId);
                if (!hasMealPlan) return false;
            }

            // 9. Rate Range
            if (filters.rateFrom && b.totalAmount < Number(filters.rateFrom)) return false;
            if (filters.rateTo && b.totalAmount > Number(filters.rateTo)) return false;

            // 10. Business Source (Mock)
            if (filters.businessSource && (b as any).businessSource !== filters.businessSource) return false;

            return true;
        });

        // Sort by User Selection
        result.sort((a, b) => {
            if (filters.orderBy === 'guest_name') {
                return a.guestDetails.lastName.localeCompare(b.guestDetails.lastName);
            } else if (filters.orderBy === 'room_no') {
                const roomA = a.rooms[0]?.allocatedRoomType || '';
                const roomB = b.rooms[0]?.allocatedRoomType || '';
                return roomA.localeCompare(roomB);
            } else if (filters.orderBy === 'booking_id') {
                return (a.bookingId || '').localeCompare(b.bookingId || '');
            } else {
                return new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime();
            }
        });

        setFilteredBookings(result);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        }).format(amount);
    };

    // Helper to check if column is selected
    // Default columns if filter state is empty (initial load)
    const isColVisible = (id: string) => {
        // If no filter selected yet (initial), show defaults
        // But ReportFilters initializes with defaults, so we rely on passed filters if we had access to them in render.
        // Issue: 'filters' state is inside ReportFilters component, we only get updates via onFilterChange. 
        // Strategy: We need to store the current filter state in this page (which we do implicitly via setFilteredBookings, but not the filter config itself).
        // We need to keep track of 'currentFilters'
        return currentFilters?.columns ? currentFilters.columns.includes(id) : true;
    };

    const [currentFilters, setCurrentFilters] = useState<ReportFilterState | null>(null);

    const handleFilterUpdate = (filters: ReportFilterState) => {
        setCurrentFilters(filters);
        handleFilterChange(filters);
    };

    return (
        <div className="min-h-screen bg-gray-50/50 font-sans print:bg-white print:p-0">
            {/* === PRINT ONLY HEADER === */}
            <div className="hidden print:block mb-8">
                <div className="flex items-start justify-between border-b-2 border-gray-900 pb-4 mb-4">
                    <div className="flex items-center gap-4">
                        <div className="h-16 w-16 bg-gray-900 text-white flex items-center justify-center rounded-lg">
                            <span className="text-2xl font-bold">SP</span>
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Sultan Palace</h1>
                            <p className="text-sm text-gray-600 font-medium tracking-widest uppercase">Luxury Hotel & Resort</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <h2 className="text-2xl font-bold text-gray-900">Arrival List</h2>
                        <p className="text-xs text-gray-400 mt-1">Generated: {new Date().toLocaleString()}</p>
                    </div>
                </div>
            </div>

            {/* Screen Header */}
            <div className="space-y-6 print:space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Arrival List</h1>
                        <p className="text-sm text-gray-500">Expected guest arrivals.</p>
                    </div>
                </div>

                <div className="print:hidden">
                    <ReportFilters
                        title="Arrival List"
                        reportType="arrival"
                        onFilterChange={handleFilterUpdate}
                    />
                </div>

                <div className="bg-white rounded-xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-gray-100 overflow-hidden print:shadow-none print:border-gray-200 print:rounded-none">
                    <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center print:bg-white print:border-gray-300">
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse print:hidden"></div>
                            <h3 className="font-bold text-gray-800">Arrivals</h3>
                        </div>
                        <span className="text-xs font-semibold text-gray-500 bg-white px-2 py-1 rounded border border-gray-200 print:border-0">
                            {filteredBookings.length} Guests
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 text-left">
                            <thead className="bg-gray-50 print:bg-gray-100">
                                <tr>
                                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider print:text-black">Res. No</th>
                                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider print:text-black">Guest</th>
                                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider print:text-black">Meal Plan</th>
                                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider print:text-black">Room</th>
                                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider print:text-black">Rate</th>
                                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider print:text-black">Arrival</th>
                                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider print:text-black">Departure</th>
                                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider print:text-black">Pax</th>
                                    {isColVisible('pickup') && <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider print:text-black">Pick-Up</th>}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {filteredBookings.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="px-6 py-12 text-center text-gray-400 italic">
                                            No arrivals found for the selected criteria.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredBookings.map((b) => {
                                        const allocated = b.rooms[0]?.allocatedRoomType || 'Unassigned';

                                        return (
                                            <tr key={b.id} className="hover:bg-gray-50/80 transition-colors group print:hover:bg-transparent">
                                                <td className="px-6 py-4">
                                                    <span className="text-xs font-mono text-gray-500 uppercase">{b.bookingId || b.id.substring(0, 8)}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors print:text-black">
                                                        {b.guestDetails.lastName}, {b.guestDetails.firstName}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-xs text-gray-700">
                                                        {b.rooms[0]?.mealPlan === 'HB' ? 'Half Board' : b.rooms[0]?.mealPlan === 'FB' ? 'Full Board' : b.rooms[0]?.mealPlan || '-'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-xs text-gray-700">{allocated}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-xs font-mono">{formatCurrency(b.totalAmount)}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-xs text-gray-700">
                                                        {new Date(b.checkIn).toLocaleDateString()} <span className="text-gray-400">14:00</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-xs text-gray-700">{new Date(b.checkOut).toLocaleDateString()}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-xs text-gray-700">{b.guests?.adults || 0}A / {b.guests?.children || 0}C</span>
                                                </td>
                                                {isColVisible('pickup') && (
                                                    <td className="px-6 py-4">
                                                        <span className="text-xs text-gray-400 italic">No Pickup</span>
                                                    </td>
                                                )}
                                            </tr>
                                        )
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Help Guide Section (Strict Match) */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 mt-8">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Help Guide</h3>
                <p className="text-xs text-gray-600 mb-4 leading-relaxed">
                    An <strong>Arrival List</strong> report is used to check the Expected guest <strong>arrivals</strong> of the property. It captures all the information about hotel guest arrivals. It can help the hotel staff have enough time to prepare the correct room and cater to any special requests as indicated on the arrival report.
                </p>

                <h4 className="text-sm font-bold text-gray-800 mb-2">How can you compare the report data with other reports?</h4>
                <p className="text-xs text-gray-600 mb-1">
                    1) Arrival list report for can be matched with folio List report for the same date range with columns "arrival date, pax, guest name and reservation type" by <span className="font-bold">arrival</span> in folio list for cross-checking data.
                </p>
                <p className="text-xs text-gray-600 mb-4">
                    2) Arrival List report for particular date can be matched with guest List report for the same date with list of data of confirm booking and hold confirm booking by enabling <span className="font-bold">reservation</span> and <span className="font-bold">arrival</span> in guest list report for cross-checking data.
                    <br />
                    <span className="text-red-500 font-bold">Note :</span> Other data cannot be compared with any other report as this report's behavior is different as its pulling out data based on all reservation types.
                </p>

                <h4 className="text-sm font-bold text-gray-800 mb-2">Report Column Explanation</h4>
                <ul className="text-xs text-gray-600 space-y-1">
                    <li><strong>Res. no :</strong> Reservation number and remark of booking</li>
                    <li><strong>Guest :</strong> Name of the guest.</li>
                    <li><strong>Meal Plan :</strong> Meal Plan of booking</li>
                    <li><strong>Room :</strong> Room number and room name of booking</li>
                    <li><strong>Rate :</strong> Total rate of booking.</li>
                    <li><strong>Arrival :</strong> Arrival date and arrival time of booking</li>
                    <li><strong>Departure :</strong> Departure date of booking</li>
                    <li><strong>pax :</strong> Pax information of booking</li>
                    <li><strong>Pick-up :</strong> Pickup location of booking</li>
                </ul>
            </div>

            {/* === PRINT ONLY FOOTER === */}
            <div className="hidden print:flex mt-auto pt-8 border-t border-gray-300 justify-between items-end break-inside-avoid">
                <div className="text-xs text-gray-500">
                    <p>Verified By:</p>
                    <div className="h-8 border-b border-gray-300 w-48 mb-1"></div>
                    <p className="italic">Front Desk Officer</p>
                </div>
                <div className="text-xs text-gray-400 text-right">
                    <p>Confidential • Internal Use Only</p>
                </div>
            </div>
        </div>
    );
}
