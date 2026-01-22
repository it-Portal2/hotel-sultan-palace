"use client";

import React, { useState, useEffect } from 'react';
import ReportFilters, { ReportFilterState } from '@/components/admin/reports/ReportFilters';
import { getAllBookings, Booking, getMasterData, RateType } from '@/lib/firestoreService';
import { useToast } from '@/context/ToastContext';
import { UserMinusIcon, CalendarDaysIcon, CurrencyDollarIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';

export default function NoShowReportPage() {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
    const [rateTypes, setRateTypes] = useState<RateType[]>([]);
    const [filters, setFilters] = useState<ReportFilterState>({
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        dateType: 'arrival', // No Show usually checks arrival/stay date
        companyId: '',
        travelAgentId: '',
        rateTypeId: '',
        reservationTypeId: '',
        showAmount: 'Rent Per Night',
        remarks: [],
        propertyId: '1',
        source: '',
        orderBy: 'arrival_date',
        cancellationReason: '',
        roomType: '',
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
        loadData();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [bookings, filters]);

    const loadData = async () => {
        try {
            const [data, rates] = await Promise.all([
                getAllBookings(),
                getMasterData<RateType>('rateTypes')
            ]);
            setBookings(data);
            setRateTypes(rates);
        } catch (error) {
            console.error(error);
            showToast('Failed to load data', 'error');
        }
    };

    const handleFilterChange = (newFilters: ReportFilterState) => {
        setFilters(newFilters);
    };

    const applyFilters = () => {
        const start = new Date(filters.startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(filters.endDate);
        end.setHours(23, 59, 59, 999);

        let result = bookings.filter(b => {
            // 1. Must be No Show
            const status = b.status?.toLowerCase() || '';
            if (!status.includes('no') || !status.includes('show')) return false;

            // 2. Filter by Date (based on dateType)
            // ...
            // Default to checkIn (Arrival Date) if not specified or 'arrival'/'stay'
            let dateField: keyof Booking = 'checkIn';
            if (filters.dateType === 'booking') {
                // For booking date, use createdAt
                dateField = 'createdAt';
            }

            const recordDate = new Date(b[dateField] as string | Date);
            recordDate.setHours(0, 0, 0, 0); // Normalize time

            // Compare normalized dates
            if (recordDate < start || recordDate > end) return false;

            // 3. Filter by Company/Agent
            if (filters.companyId && b.companyId !== filters.companyId) return false;
            if (filters.travelAgentId && b.travelAgentId !== filters.travelAgentId) return false;

            // 4. Source Filter
            if (filters.source) {
                const bSource = b.source?.toLowerCase().replace('_', '') || 'direct';
                const fSource = filters.source.toLowerCase().replace('_', '');
                if (!bSource.includes(fSource)) return false;
            }

            // 5. Room Type
            if (filters.roomType) {
                const hasType = b.rooms.some(r => r.allocatedRoomType?.toLowerCase() === filters.roomType.toLowerCase());
                if (!hasType) return false;
            }

            // 6. Meal Plan
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

        // Sort by Arrival Date (Oldest First potentially, or Newest)
        result.sort((a, b) => {
            const dateA = new Date(a.checkIn);
            const dateB = new Date(b.checkIn);
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
            'Res. No', 'Booking Date', 'Guest Name', 'Meal Plan', 'Arrival Date', 'Departure Date', 'Charges', 'No Show Revenue', 'Source', 'No Show Date', 'Remarks'
        ];

        const csvContent = [
            headers.join(','),
            ...filteredBookings.map(b => {
                const source = b.source ? b.source.replace('_', ' ').toUpperCase() : 'DIRECT';
                const charges = b.totalAmount || 0;
                const noShowRevenue = b.paidAmount || 0;

                return [
                    `"${b.bookingId || b.id.substring(0, 8)}"`,
                    `"${new Date(b.createdAt).toLocaleDateString()}"`,
                    `"${b.guestDetails.lastName}, ${b.guestDetails.firstName}"`,
                    `"${b.rooms[0]?.mealPlan || '-'}"`,
                    `"${new Date(b.checkIn).toLocaleDateString()}"`,
                    `"${new Date(b.checkOut).toLocaleDateString()}"`,
                    `"${charges}"`,
                    `"${noShowRevenue}"`,
                    `"${source}"`,
                    `"${new Date(b.updatedAt).toLocaleDateString()}"`,
                    `"${b.notes || ''}"`
                ].join(',');
            })
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `no_show_report_${new Date().toISOString().split('T')[0]}.csv`);
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

    const totalRevenueImpact = filteredBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);

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
                        <h2 className="text-2xl font-bold text-gray-900">No Show Report</h2>
                        <p className="text-xs text-gray-400 mt-1">Generated: {new Date().toLocaleString()}</p>
                    </div>
                </div>
            </div>

            <div className="space-y-6 print:space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">No Show Reservations</h1>
                        <p className="text-sm text-gray-500">Tracking guests who failed to arrive.</p>
                    </div>
                </div>

                <div className="print:hidden flex flex-col md:flex-row md:items-end gap-4">
                    <div className="flex-1">
                        <ReportFilters
                            title="No Show Reservation"
                            reportType="no_show"
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

                {/* KPI Card */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:hidden">
                    <div className="bg-white p-4 rounded-xl border border-orange-100 shadow-sm flex items-center gap-4">
                        <div className="p-3 bg-orange-50 rounded-lg text-orange-600">
                            <CurrencyDollarIcon className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">No Show Revenue</p>
                            <h3 className="text-xl font-bold text-gray-900">{formatCurrency(totalRevenueImpact)}</h3>
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                        <div className="p-3 bg-gray-50 rounded-lg text-gray-600">
                            <UserMinusIcon className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Total No Shows</p>
                            <h3 className="text-xl font-bold text-gray-900">
                                {filteredBookings.length} Guests
                            </h3>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-gray-100 overflow-hidden print:shadow-none print:border-gray-200 print:rounded-none">
                    <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center print:bg-white print:border-gray-300">
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-orange-500 animate-pulse print:hidden"></div>
                            <h3 className="font-bold text-gray-800">No Show Log</h3>
                        </div>
                        <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-1 rounded border border-orange-100 print:border-0">
                            {filteredBookings.length} Records
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 text-left">
                            <thead className="bg-orange-50/30 print:bg-gray-100">
                                <tr>
                                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider print:text-black">Res. No</th>
                                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider print:text-black">Booking Date</th>
                                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider print:text-black">Guest Name</th>
                                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider print:text-black">Meal Plan</th>
                                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider print:text-black">Arr.</th>
                                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider print:text-black">Dpt.</th>
                                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider print:text-black text-right">Charges</th>
                                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider print:text-black text-right">No Show Rev.</th>
                                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider print:text-black">Source</th>
                                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider print:text-black">No Show Date</th>
                                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider print:text-black">Remarks</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {filteredBookings.length === 0 ? (
                                    <tr>
                                        <td colSpan={10} className="px-6 py-12 text-center text-gray-400 italic">
                                            No no-show reservations found for this period.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredBookings.map((b) => {
                                        const source = b.source ? b.source.replace('_', ' ').toUpperCase() : 'DIRECT';
                                        const charges = b.totalAmount;
                                        // Mock No Show Revenue as total amount if paid/retention, otherwise 0 or partial?
                                        // For simplicity, assuming if status is no_show, and there is a payment or it is "retention", we count it.
                                        // But usually No Show Revenue = Charged Amount.
                                        const noShowRevenue = b.paidAmount || 0;

                                        return (
                                            <tr key={b.id} className="hover:bg-orange-50/30 transition-colors group print:hover:bg-transparent">
                                                <td className="px-6 py-4">
                                                    <span className="text-xs font-mono text-gray-500 uppercase">{b.bookingId || b.id.substring(0, 8)}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-xs text-gray-700">{new Date(b.createdAt).toLocaleDateString()}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-gray-900 group-hover:text-orange-700 transition-colors print:text-black">
                                                            {b.guestDetails.lastName}, {b.guestDetails.firstName}
                                                        </span>
                                                        {b.companyId && (
                                                            <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded w-fit mt-0.5 print:text-black print:bg-transparent print:border print:border-gray-300">
                                                                {b.companyId}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-xs text-gray-700">
                                                        {b.rooms[0]?.mealPlan === 'HB' ? 'Half Board' : b.rooms[0]?.mealPlan === 'FB' ? 'Full Board' : b.rooms[0]?.mealPlan || '-'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-xs text-gray-600 print:text-black">
                                                    {new Date(b.checkIn).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 text-xs text-gray-600 print:text-black">
                                                    {new Date(b.checkOut).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className="text-xs font-mono text-gray-600">
                                                        {formatCurrency(charges)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className="text-sm font-bold font-mono text-gray-900 print:text-black">
                                                        {formatCurrency(noShowRevenue)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-xs font-bold text-gray-700 print:text-black">{source}</span>
                                                </td>
                                                <td className="px-6 py-4 text-xs text-gray-600 print:text-black">
                                                    {/* Using updatedAt as proxy for No Show Date logic */}
                                                    {new Date(b.updatedAt).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-xs text-gray-500 italic max-w-[150px] inline-block truncate print:text-black print:whitespace-normal">
                                                        {b.notes || 'Guest did not arrive'}
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
                    <p className="italic">Night Auditor</p>
                </div>
                <div className="text-xs text-gray-400 text-right">
                    <p>Confidential • Internal Use Only</p>
                </div>
            </div>
            {/* Help Guide Section (Strict Match) */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 mt-8">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Help Guide</h3>
                <p className="text-xs text-gray-600 mb-4 leading-relaxed">
                    This report will give you no-show data based on the date selected in the property management system. We store no-show date according to the system date of a property. So if you are not performing night audit on a regular basis, there are chances that the report will not render proper data.
                </p>

                <h4 className="text-sm font-bold text-gray-800 mb-2">How can you compare the report data with other reports?</h4>
                <p className="text-xs text-gray-600 mb-1">
                    1) No show Revenue of this report can be matched with the manager report or weekly manager report, room charges - no show Revenue when both reports are pulled for a specific date.
                </p>
                <div className="text-xs text-gray-600 mb-4">
                    <span className="text-red-500 font-bold">Note :</span> It will not match only when some manual no-show charge is posted on any active booking, then it will come in the calculation on Manager Report but No Show Reservation report will pull out only no-showed bookings. This is usually considered as a user's mistake.
                    <p className="mt-1">
                        2) No Show Revenue of this report can be matched with Daily Revenue Report when pulled out by No Show Revenue for a specific date.
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
                    <li><strong>No Show Revenue :</strong> Shows no show fee as tax inclusive or exclusive collected for the booking in property's base currency (based on Tax Inclusive Rates (Disc./Adj. included, if applied) filter option checked)</li>
                    <li><strong>Charges :</strong> Shows total booking amount to be paid in property's base currency</li>
                    <li><strong>Paid :</strong> Shows total payment paid for the booking in the property's base currency</li>
                    <li><strong>Balance :</strong> Shows total due amount in property's base currency</li>
                    <li><strong>Source :</strong> A business source of the booking</li>
                    <li><strong>User :</strong> User who has marked no-show the booking</li>
                    <li><strong>No Show Date :</strong> Date on which reservation was marked no-show</li>
                    <li><strong>Remarks :</strong> Shows no-show remarks (reason of no-show)</li>
                </ul>
            </div>
        </div>
    );
}
