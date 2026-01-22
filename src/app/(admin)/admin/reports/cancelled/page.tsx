"use client";

import React, { useState, useEffect } from 'react';
import ReportFilters, { ReportFilterState } from '@/components/admin/reports/ReportFilters';
import { getAllBookings, Booking } from '@/lib/firestoreService';
import { useToast } from '@/context/ToastContext';
import { XCircleIcon, CalendarDaysIcon, ExclamationTriangleIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';

export default function CancelledReportPage() {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
    const [filters, setFilters] = useState<ReportFilterState>({
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        dateType: 'cancellation',
        roomType: '',
        rateTypeId: '',
        companyId: '',
        travelAgentId: '',
        reservationTypeId: '',
        showAmount: 'Rent Per Night',
        remarks: [],
        propertyId: '1',
        source: '',
        orderBy: 'arrival_date',
        cancellationReason: '',
        market: '',
        rateFrom: '',
        rateTo: '',
        user: '',
        businessSource: '',
        taxInclusive: true,
        columns: [],
        cancelledBy: '',
        reportTemplate: 'Default'
    });
    const { showToast } = useToast();

    useEffect(() => {
        applyFilters();
    }, [bookings, filters]);

    useEffect(() => {
        applyFilters();
    }, [bookings, filters]);

    const loadData = async () => {
        try {
            const data = await getAllBookings();
            setBookings(data);
        } catch (error) {
            console.error(error);
            showToast('Failed to load data', 'error');
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleFilterChange = (newFilters: ReportFilterState) => {
        setFilters(newFilters);
    };

    const applyFilters = () => {
        const start = new Date(filters.startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(filters.endDate);
        end.setHours(23, 59, 59, 999);

        let result = bookings.filter(b => {
            // 1. Must be cancelled
            const status = b.status?.toLowerCase() || '';
            const isCancelled = status.includes('cancel');

            // Console log for debugging


            if (!isCancelled) return false;

            // 2. Filter by Date Type (Cancellation Date vs Arrival Date)
            let targetDate: Date;

            if (filters.dateType === 'arrival') {
                targetDate = new Date(b.checkIn);
            } else {
                // Default to Cancellation Date (updatedAt)
                targetDate = b.updatedAt instanceof Date ? b.updatedAt : new Date(b.updatedAt);
            }

            if (targetDate < start || targetDate > end) return false;

            // 3. Filter by Company/Agent
            if (filters.companyId && b.companyId !== filters.companyId) return false;
            if (filters.travelAgentId && b.travelAgentId !== filters.travelAgentId) return false;

            // 4. Source Filter
            if (filters.source) {
                const bSource = b.source?.toLowerCase().replace('_', '') || 'direct';
                const fSource = filters.source.toLowerCase().replace('_', '');
                if (!bSource.includes(fSource)) return false;
            }

            // 5. Reason Filter
            if (filters.cancellationReason && b.notes) {
                // partial match since we store reasons in notes usually
                if (!b.notes.toLowerCase().includes(filters.cancellationReason.toLowerCase())) return false;
            }

            // 6. Room Type
            if (filters.roomType) {
                const hasType = b.rooms.some(r => r.allocatedRoomType?.toLowerCase() === filters.roomType.toLowerCase());
                if (!hasType) return false;
            }

            // 7. Meal Plan
            if (filters.rateTypeId) {
                const search = filters.rateTypeId.toLowerCase();
                const hasMealPlan = b.rooms.some(r =>
                    r.mealPlan?.toLowerCase() === search ||
                    r.ratePlan?.toLowerCase() === search
                );
                if (!hasMealPlan) return false;
            }

            return true;
        });

        // Sort by Cancellation Date (Newest First)
        result.sort((a, b) => {
            const dateA = a.updatedAt instanceof Date ? a.updatedAt : new Date(a.updatedAt);
            const dateB = b.updatedAt instanceof Date ? b.updatedAt : new Date(b.updatedAt);
            return dateB.getTime() - dateA.getTime();
        });

        setFilteredBookings(result);
    };

    const handleExportCSV = () => {
        if (filteredBookings.length === 0) {
            showToast('No data to export', 'error');
            return;
        }

        const headers = [
            'Res. No', 'Guest Name', 'Company', 'Source', 'Agent', 'Meal Plan', 'Arrival Date', 'Cancelled On', 'Reason', 'Lost Value', 'Status'
        ];

        const csvContent = [
            headers.join(','),
            ...filteredBookings.map(b => {
                const source = b.source ? b.source.replace('_', ' ').toUpperCase() : 'DIRECT';
                const agent = b.travelAgentId || 'None';
                const mealPlan = b.rooms[0]?.mealPlan || '-';

                return [
                    `"${b.bookingId || b.id.substring(0, 8)}"`,
                    `"${b.guestDetails.lastName}, ${b.guestDetails.firstName}"`,
                    `"${b.companyId || ''}"`,
                    `"${source}"`,
                    `"${agent}"`,
                    `"${mealPlan}"`,
                    `"${new Date(b.checkIn).toLocaleDateString()}"`,
                    `"${new Date(b.updatedAt).toLocaleDateString()} ${new Date(b.updatedAt).toLocaleTimeString()}"`,
                    `"${b.notes || ''}"`,
                    `"${b.totalAmount}"`,
                    `"Cancelled"`
                ].join(',');
            })
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `cancelled_reservations_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        }).format(amount);
    };

    const totalLostRevenue = filteredBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);

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
                        <h2 className="text-2xl font-bold text-gray-900">Cancelled Reservations</h2>
                        <p className="text-xs text-gray-400 mt-1">Generated: {new Date().toLocaleString()}</p>
                    </div>
                </div>
            </div>

            <div className="space-y-6 print:space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Cancelled Reservations</h1>
                        <p className="text-sm text-gray-500">Analysis of cancelled bookings and lost revenue.</p>
                    </div>
                </div>

                <div className="print:hidden flex flex-col md:flex-row md:items-end gap-4">
                    <div className="flex-1">
                        <ReportFilters
                            title="Cancelled Reservation"
                            reportType="cancellation"
                            onFilterChange={handleFilterChange}
                        />
                    </div>
                    <button
                        onClick={handleExportCSV}
                        className="mb-6 inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium shadow-sm"
                    >
                        <ArrowDownTrayIcon className="h-4 w-4" />
                        Export CSV
                    </button>
                </div>

                {/* KPI Card for Lost Revenue */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:hidden">
                    <div className="bg-white p-4 rounded-xl border border-red-100 shadow-sm flex items-center gap-4">
                        <div className="p-3 bg-red-50 rounded-lg text-red-600">
                            <XCircleIcon className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Lost Revenue</p>
                            <h3 className="text-xl font-bold text-gray-900">{formatCurrency(totalLostRevenue)}</h3>
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                        <div className="p-3 bg-gray-50 rounded-lg text-gray-600">
                            <ExclamationTriangleIcon className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Cancellation Rate</p>
                            <h3 className="text-xl font-bold text-gray-900">
                                {bookings.length > 0 ? ((filteredBookings.length / bookings.length) * 100).toFixed(1) : 0}%
                            </h3>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-gray-100 overflow-hidden print:shadow-none print:border-gray-200 print:rounded-none">
                    <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center print:bg-white print:border-gray-300">
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse print:hidden"></div>
                            <h3 className="font-bold text-gray-800">Cancellation Log</h3>
                        </div>
                        <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-1 rounded border border-red-100 print:border-0">
                            {filteredBookings.length} Records
                        </span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 text-left">
                            <thead className="bg-red-50/30 print:bg-gray-100">
                                <tr>
                                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider print:text-black">Guest / Company</th>
                                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider print:text-black">Source / Agent</th>
                                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider print:text-black">Meal Plan</th>
                                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider print:text-black">Arrival Date</th>
                                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider print:text-black">Cancelled On</th>
                                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider print:text-black">Reason</th>
                                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider print:text-black text-right">Lost Value</th>
                                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider print:text-black text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {filteredBookings.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-gray-400 italic">
                                            No cancellations found for this period.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredBookings.map((b) => {
                                        const source = b.source ? b.source.replace('_', ' ').toUpperCase() : 'DIRECT';
                                        const agent = b.travelAgentId || 'None';

                                        return (
                                            <tr key={b.id} className="hover:bg-red-50/30 transition-colors group print:hover:bg-transparent">
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-gray-900 group-hover:text-red-700 transition-colors print:text-black">
                                                            {b.guestDetails.lastName}, {b.guestDetails.firstName}
                                                        </span>
                                                        {b.companyId && (
                                                            <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded w-fit mt-0.5 print:text-black print:bg-transparent print:border print:border-gray-300">
                                                                {b.companyId}
                                                            </span>
                                                        )}
                                                        <span className="text-xs text-gray-400 font-mono mt-0.5 print:text-gray-600">
                                                            #{b.bookingId || b.id.substring(0, 6).toUpperCase()}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold text-gray-700 print:text-black">{source}</span>
                                                        {agent !== 'None' && (
                                                            <span className="text-[10px] text-blue-600 print:text-black">{agent}</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-xs text-gray-700">
                                                        {b.rooms[0]?.mealPlan === 'HB' ? 'Half Board' : b.rooms[0]?.mealPlan === 'FB' ? 'Full Board' : b.rooms[0]?.mealPlan || '-'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-xs text-gray-600 print:text-black">
                                                    <div className="flex items-center gap-1.5">
                                                        <CalendarDaysIcon className="h-3.5 w-3.5 text-gray-400 print:hidden" />
                                                        {new Date(b.checkIn).toLocaleDateString()}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-xs font-semibold text-gray-700 print:text-black">
                                                    {new Date(b.updatedAt).toLocaleDateString()}
                                                    <span className="text-gray-400 font-normal ml-1 text-[10px] block">
                                                        {new Date(b.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-xs text-gray-500 italic print:text-black">
                                                        {b.notes || 'No reason provided'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className="text-sm font-bold font-mono text-gray-900 print:text-black">
                                                        {formatCurrency(b.totalAmount)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-red-100 text-red-700 print:bg-white print:border print:border-black print:text-black">
                                                        Cancelled
                                                    </span>
                                                </td>
                                            </tr>
                                        )
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* === PRINT ONLY FOOTER === */}
            <div className="hidden print:flex mt-auto pt-8 border-t border-gray-300 justify-between items-end break-inside-avoid">
                <div className="text-xs text-gray-500">
                    <p>Verified By:</p>
                    <div className="h-8 border-b border-gray-300 w-48 mb-1"></div>
                    <p className="italic">Front Desk Manager</p>
                </div>
                <div className="text-xs text-gray-400 text-right">
                    <p>Confidential • Internal Use Only</p>
                </div>
            </div>
            {/* Help Guide Section (Strict Match) */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 mt-8">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Help Guide</h3>
                <p className="text-xs text-gray-600 mb-4 leading-relaxed">
                    This report will give you cancellations based on the date selected in the property management system. We store the cancellation date according to the system date of a property. So if you are not performing night audit on a regular basis, there are chances that the report will not render proper data.
                </p>

                <h4 className="text-sm font-bold text-gray-800 mb-2">How can you compare the report data with other reports?</h4>
                <p className="text-xs text-gray-600 mb-1">
                    1) Cancellation Revenue of this report can be matched with the manager report or weekly manager report, room charges - Cancellation Revenue when both reports are pulled for a specific date.
                </p>
                <div className="text-xs text-gray-600 mb-4">
                    <span className="text-red-500 font-bold">Note :</span> It will not match only when some manual cancellation charge is posted on any active booking, then it will come in the calculation on Manager Report but Cancelled Reservation report will pull out only canceled bookings. This is usually considered as a user's mistake.
                    <p className="mt-1">
                        2) Cancellation Revenue of this report can be matched with the Daily Revenue Report when pulled out by Cancellation Revenue for a specific date.
                    </p>
                </div>

                <h4 className="text-sm font-bold text-gray-800 mb-2">Report Column Explanation</h4>
                <ul className="text-xs text-gray-600 space-y-1">
                    <li><strong>Res. No :</strong> Reservation no of booking</li>
                    <li><strong>Booking Date :</strong> Booking date on which reservation has been taken in the system</li>
                    <li><strong>Guest Name :</strong> Name of the Guest</li>
                    <li><strong>Meal Plan :</strong> Meal Plan of booking</li>
                    <li><strong>Arr. :</strong> Arrival Date of booking in property's short format set in the configuration panel</li>
                    <li><strong>Dpt :</strong> Departure Date of a booking in property's short format set in the configuration panel</li>
                    <li><strong>Folio No :</strong> Folio No of a booking</li>
                    <li><strong>ADR :</strong> Shows Average daily rate considering all stay nights.</li>
                    <li><strong>Can. Revenue :</strong> Shows cancellation fee as tax inclusive or exclusive collected for the booking in property's base currency (based on Tax Inclusive Rates (Disc./Adj. included, if applied) filter option checked)</li>
                    <li><strong>Charges :</strong> Shows total booking amount to be paid in property's base currency</li>
                    <li><strong>Paid :</strong> Shows total payment paid for the booking in the property's base currency</li>
                    <li><strong>Balance :</strong> Shows total due amount in property's base currency</li>
                    <li><strong>Source :</strong> A business source of the booking</li>
                    <li><strong>Can. By :</strong> User who has canceled the booking</li>
                    <li><strong>Can Date :</strong> Date on which reservation was canceled</li>
                    <li><strong>Remarks :</strong> Shows cancellation remarks (reason of cancellation)</li>
                </ul>
            </div>
        </div>
    );
}
