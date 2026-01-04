"use client";

import React, { useState, useEffect } from 'react';
import {
    getMasterData,
    getRoomTypes,
    TravelAgent,
    Company,
    RateType,
    RoomType,
    ReservationType,
    ensureDefaultRateTypes
} from '@/lib/firestoreService';
import { MagnifyingGlassIcon, FunnelIcon, XMarkIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';

export interface ReportFilterState {
    startDate: string;
    endDate: string;
    companyId: string;
    travelAgentId: string;
    rateTypeId: string;
    reservationTypeId: string;
    showAmount: string; // Changed to string for dropdown 'Rent Per Night' etc.
    remarks: string[]; // For checkboxes like 'Check In', 'Check Out' etc.
    // New Fields
    propertyId: string;
    source: string;
    orderBy: string;
    dateType: string;
    cancellationReason: string;
    roomType: string;
    market: string;
    rateFrom: string;
    rateTo: string;
    user: string;
    businessSource: string;
    taxInclusive: boolean;
    columns: string[]; // For 'Select Column'
    cancelledBy: string;
    reportTemplate: string;
}

interface ReportFiltersProps {
    onFilterChange: (filters: ReportFilterState) => void;
    title?: string; // Optional now as we might not show it
    reportType: 'arrival' | 'cancellation' | 'no_show';
}

const SECTION_TITLE_STYLE = "text-xs font-bold text-blue-800 uppercase tracking-wider mb-2 border-b border-blue-100 pb-1";
const LABEL_STYLE = "block text-[11px] font-bold text-gray-700 mb-0.5";
const INPUT_STYLE = "block w-full rounded border-gray-300 py-1 px-2 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-xs";
const CHECKBOX_CONTAINER_STYLE = "flex items-center gap-2";
const CHECKBOX_STYLE = "h-3.5 w-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500";

export default function ReportFilters({ onFilterChange, title, reportType }: ReportFiltersProps) {
    // Master Data State
    const [travelAgents, setTravelAgents] = useState<TravelAgent[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [rateTypes, setRateTypes] = useState<RateType[]>([]);
    const [reservationTypes, setReservationTypes] = useState<ReservationType[]>([]);
    const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
    // UI State for Collapsible Filters (More Options)
    const [isExpanded, setIsExpanded] = useState(false);

    // Constants
    const properties = [{ id: '1', name: 'Sultan Palace' }];
    const sources = ['Direct', 'Booking.com', 'Expedia', 'Airbnb', 'Agoda', 'Walk-In', 'Telephone', 'Email'];
    const businessSources = ['Corporate', 'Fit', 'Group', 'Wholesale', 'Complementary'];
    const markets = ['Corporate', 'Leisure', 'Online', 'Direct'];
    // Room Types are now fetched from DB
    const users = ['Admin', 'Reception', 'Manager']; // Mock
    const showAmountOptions = ['Rent Per Night', 'Total Rent', 'Do Not Show'];

    // Config for "Select Column" (Arrival List)
    const arrivalColumns = [
        { id: 'pickup', label: 'Pick Up', default: true },
        { id: 'dropoff', label: 'Drop Off', default: true },
        { id: 'res_type', label: 'Res.Type', default: true },
        { id: 'company', label: 'Company', default: true },
        { id: 'user', label: 'User', default: true },
        { id: 'deposit', label: 'Deposit', default: true },
        { id: 'balance', label: 'Balance Due', default: false },
        { id: 'market', label: 'Market Code', default: false },
        { id: 'business_source', label: 'Business Source', default: false },
        { id: 'meal_plan', label: 'Meal Plan', default: false },
        { id: 'rate_type', label: 'Rate Type', default: false },
    ];

    // Config for "Remarks" (Arrival List)
    const remarksOptions = ['Check In', 'Check Out', 'Guest Folio', 'House Keeping', 'Important Info', 'Internal Note'];

    // Filter State
    const [filters, setFilters] = useState<ReportFilterState>({
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        companyId: '',
        travelAgentId: '',
        rateTypeId: '',
        reservationTypeId: '',
        showAmount: 'Rent Per Night',
        remarks: ['Check In', 'Check Out'], // Default checked
        propertyId: '1',
        source: '',
        orderBy: 'arrival_date',
        dateType: reportType === 'cancellation' ? 'cancellation' : 'arrival',
        cancellationReason: '',
        roomType: '',
        market: '',
        rateFrom: '',
        rateTo: '',
        user: '',
        businessSource: '',
        taxInclusive: true,
        columns: arrivalColumns.filter(c => c.default).map(c => c.id),
        cancelledBy: '',
        reportTemplate: 'Default'
    });

    useEffect(() => {
        const init = async () => {
            await ensureDefaultRateTypes();
            loadMasterData();
        };
        init();
    }, []);

    const loadMasterData = async () => {
        try {
            const [ta, co, rt, rst, rooms] = await Promise.all([
                getMasterData<TravelAgent>('travelAgents'),
                getMasterData<Company>('companies'),
                getMasterData<RateType>('rateTypes'),
                getMasterData<ReservationType>('reservationTypes'),
                getRoomTypes()
            ]);
            setTravelAgents(ta);
            setCompanies(co);

            // Deduplicate Rate Types by Name
            const uniqueRates = Array.from(new Map(rt.map(r => [r.name, r])).values());
            setRateTypes(uniqueRates);

            setReservationTypes(rst);

            // Deduplicate Room Types by Name
            const uniqueRooms = Array.from(new Map(rooms.map(r => [r.roomName, r])).values());
            setRoomTypes(uniqueRooms);

        } catch (error) {
            console.error("Error loading filter master data:", error);
        }
    };

    const handleChange = (key: keyof ReportFilterState, value: any) => {
        const newFilters = { ...filters, [key]: value };
        setFilters(newFilters);
    };

    const handleCheckboxGroupChange = (group: 'remarks' | 'columns', id: string, checked: boolean) => {
        let current = [...filters[group]];
        if (checked) {
            current.push(id);
        } else {
            current = current.filter(item => item !== id);
        }
        handleChange(group, current);
    };

    const handleApply = () => {
        onFilterChange(filters);
    };

    const handleReset = () => {
        // Reset logic here (simplified for brevity)
        setFilters({
            ...filters,
            companyId: '',
            travelAgentId: '',
            rateTypeId: '',
            // ... reset others
        });
    };

    return (
        <div className="bg-white border border-gray-300 shadow-sm mb-6 p-4">
            {/* Header / Title Row */}
            <div className="mb-4 flex items-center justify-between pb-2 border-b border-gray-100">
                <div className="flex items-center gap-2">
                    <FunnelIcon className="h-4 w-4 text-gray-500" />
                    <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide">{title || 'Filters'}</h2>
                </div>

                <div className="flex items-center gap-2">
                    {/* Expand / Collapse Filters Button */}
                    {(reportType === 'no_show' || reportType === 'cancellation' || reportType === 'arrival') && (
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className={`p-1.5 rounded transition-colors flex items-center gap-1 text-xs font-medium ${isExpanded ? 'bg-orange-50 text-orange-600' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
                            title={isExpanded ? "Show Less Filters" : "Show More Filters"}
                        >
                            {isExpanded ? <XMarkIcon className="h-4 w-4" /> : <AdjustmentsHorizontalIcon className="h-4 w-4" />}
                            {isExpanded ? 'Less' : 'More'}
                        </button>
                    )}
                </div>
            </div>

            <div className="space-y-4">
                {/* --- FIRST ROW: Primary Filters (Visible by Default) --- */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-x-4 gap-y-3 items-end">

                    {/* Date Type Dropdown */}
                    <div className="md:col-span-2">
                        <label className={LABEL_STYLE}>Date Type</label>
                        <select className={INPUT_STYLE} value={filters.dateType} onChange={(e) => handleChange('dateType', e.target.value)}>
                            {reportType === 'arrival' && <option value="arrival">Arrival Date</option>}
                            {reportType === 'cancellation' && (
                                <>
                                    <option value="cancellation">Cancelled Date</option>
                                    <option value="arrival">Arrival Date</option>
                                </>
                            )}
                            {reportType === 'no_show' && (
                                <>
                                    <option value="arrival">Arrival Date</option>
                                    <option value="stay">Stay Date</option>
                                    <option value="booking">Booking Date</option>
                                </>
                            )}
                        </select>
                    </div>

                    {/* Date Range */}
                    <div className="md:col-span-3">
                        <label className={LABEL_STYLE}>
                            {/* Label is dynamic based on Date Type if needed, or generic */}
                            Date Range
                        </label>
                        <div className="flex items-center gap-2">
                            <input type="date" className={INPUT_STYLE} value={filters.startDate} onChange={(e) => handleChange('startDate', e.target.value)} />
                            <span className="text-gray-400 text-xs">To</span>
                            <input type="date" className={INPUT_STYLE} value={filters.endDate} onChange={(e) => handleChange('endDate', e.target.value)} />
                        </div>
                    </div>

                    <div className="md:col-span-2">
                        <label className={LABEL_STYLE}>Room Type</label>
                        <select className={INPUT_STYLE} value={filters.roomType} onChange={(e) => handleChange('roomType', e.target.value)}>
                            <option value="">--Select--</option>
                            {roomTypes.map(r => <option key={r.id} value={r.roomName}>{r.roomName}</option>)}
                        </select>
                    </div>

                    <div className="md:col-span-2">
                        <label className={LABEL_STYLE}>Rate Type</label>
                        <select className={INPUT_STYLE} value={filters.rateTypeId} onChange={(e) => handleChange('rateTypeId', e.target.value)}>
                            <option value="">--Select--</option>
                            {rateTypes.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                        </select>
                    </div>

                    {/* For No Show, these are the 4 primary fields matching the link. Stop here if collapsed. */}
                </div>

                {/* --- SECOND AREA: Expanded Filters --- */}
                {/* Dynamically shown based on report type and expansion state */}

                {/* For Arrival Loop, we usually show more by default, but user wants 'Pencil' behavior. 
                    If ReportType is 'no_show', HIDE the rest unless Expanded. 
                */}

                <div className={`grid grid-cols-1 md:grid-cols-6 gap-x-4 gap-y-3 pt-2 border-t border-gray-50 ${(!isExpanded && reportType === 'no_show') ? 'hidden' : 'block'}`}>

                    <div>
                        <label className={LABEL_STYLE}>Company</label>
                        <select className={INPUT_STYLE} value={filters.companyId} onChange={(e) => handleChange('companyId', e.target.value)}>
                            <option value="">--Select--</option>
                            {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className={LABEL_STYLE}>Travel Agent</label>
                        <select className={INPUT_STYLE} value={filters.travelAgentId} onChange={(e) => handleChange('travelAgentId', e.target.value)}>
                            <option value="">--Select--</option>
                            <option value="ALL">ALL</option>
                            {travelAgents.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                    </div>

                    {reportType === 'arrival' && (
                        <>
                            <div>
                                <label className={LABEL_STYLE}>Market</label>
                                <select className={INPUT_STYLE} value={filters.market} onChange={(e) => handleChange('market', e.target.value)}>
                                    <option value="">--Select--</option>
                                    {markets.map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className={LABEL_STYLE}>Rate From</label>
                                <div className="flex items-center gap-1">
                                    <input type="number" className={INPUT_STYLE} placeholder="0" value={filters.rateFrom} onChange={(e) => handleChange('rateFrom', e.target.value)} />
                                    <span className="text-gray-400 text-[10px]">To</span>
                                    <input type="number" className={INPUT_STYLE} placeholder="0" value={filters.rateTo} onChange={(e) => handleChange('rateTo', e.target.value)} />
                                </div>
                            </div>
                        </>
                    )}

                    <div>
                        <label className={LABEL_STYLE}>Business Source</label>
                        <select className={INPUT_STYLE} value={filters.businessSource} onChange={(e) => handleChange('businessSource', e.target.value)}>
                            <option value="">--Select--</option>
                            {businessSources.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                    </div>

                    {reportType === 'arrival' && (
                        <div>
                            <label className={LABEL_STYLE}>Show Amount</label>
                            <select className={INPUT_STYLE} value={filters.showAmount} onChange={(e) => handleChange('showAmount', e.target.value)}>
                                {showAmountOptions.map(o => <option key={o} value={o}>{o}</option>)}
                            </select>
                        </div>
                    )}

                    {reportType === 'cancellation' && (
                        <div>
                            <label className={LABEL_STYLE}>Cancelled By</label>
                            <select className={INPUT_STYLE} value={filters.cancelledBy} onChange={(e) => handleChange('cancelledBy', e.target.value)}>
                                <option value="">--Select--</option>
                                {users.map(u => <option key={u} value={u}>{u}</option>)}
                            </select>
                        </div>
                    )}

                    <div>
                        <label className={LABEL_STYLE}>Tax Inclusive Rates</label>
                        <div className="mt-2 flex items-center">
                            <input
                                type="checkbox"
                                checked={filters.taxInclusive}
                                onChange={(e) => handleChange('taxInclusive', e.target.checked)}
                                className={CHECKBOX_STYLE}
                            />
                            <span className="ml-2 text-xs text-gray-600">(Disc./Adj...)</span>
                        </div>
                    </div>
                </div>

                {/* --- THIRD ROW: Arrival Specifics (Remarks & Columns) --- */}
                {reportType === 'arrival' && (
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-2 border-t border-gray-100">
                        {/* Remarks Multi-select */}
                        <div className="md:col-span-3">
                            <label className={LABEL_STYLE}>Remarks</label>
                            <div className="h-32 overflow-y-auto border border-gray-300 rounded bg-white p-2 space-y-1">
                                <div className={CHECKBOX_CONTAINER_STYLE}>
                                    <input type="checkbox" className={CHECKBOX_STYLE} />
                                    <span className="text-xs font-bold text-gray-700">Select All</span>
                                </div>
                                {remarksOptions.map(remark => (
                                    <div key={remark} className={CHECKBOX_CONTAINER_STYLE}>
                                        <input
                                            type="checkbox"
                                            className={CHECKBOX_STYLE}
                                            checked={filters.remarks.includes(remark)}
                                            onChange={(e) => handleCheckboxGroupChange('remarks', remark, e.target.checked)}
                                        />
                                        <span className="text-xs text-gray-600">{remark}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Select Columns */}
                        <div className="md:col-span-9">
                            <label className={LABEL_STYLE}>Select Column(Any 5)</label>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-y-2 gap-x-4 mt-1 bg-gray-50 p-3 rounded border border-gray-200">
                                {arrivalColumns.map(col => (
                                    <div key={col.id} className={CHECKBOX_CONTAINER_STYLE}>
                                        <input
                                            type="checkbox"
                                            className={CHECKBOX_STYLE}
                                            checked={filters.columns.includes(col.id)}
                                            onChange={(e) => handleCheckboxGroupChange('columns', col.id, e.target.checked)}
                                        />
                                        <span className="text-xs text-gray-600">{col.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* --- End of Filters --- */}

            </div>
        </div>
    );
}
