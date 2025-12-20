"use client";

import React, { useState, useEffect } from 'react';
import {
    getMasterData,
    TravelAgent,
    Company,
    RateType,
    ReservationType
} from '@/lib/firestoreService';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

export interface ReportFilterState {
    startDate: string;
    endDate: string;
    companyId: string;
    travelAgentId: string;
    rateTypeId: string;
    reservationTypeId: string;
    showAmount: boolean;
    remarks: string[]; // For checkboxes like 'Check In', 'Check Out' etc.
}

interface ReportFiltersProps {
    onFilterChange: (filters: ReportFilterState) => void;
    title: string;
    reportType: 'arrival' | 'cancellation' | 'no_show';
}

export default function ReportFilters({ onFilterChange, title }: ReportFiltersProps) {
    // Master Data State
    const [travelAgents, setTravelAgents] = useState<TravelAgent[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [rateTypes, setRateTypes] = useState<RateType[]>([]);
    const [reservationTypes, setReservationTypes] = useState<ReservationType[]>([]);

    // Filter State
    const [filters, setFilters] = useState<ReportFilterState>({
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        companyId: '',
        travelAgentId: '',
        rateTypeId: '',
        reservationTypeId: '',
        showAmount: true,
        remarks: []
    });

    useEffect(() => {
        loadMasterData();
    }, []);

    const loadMasterData = async () => {
        const [ta, co, rt, rst] = await Promise.all([
            getMasterData<TravelAgent>('travelAgents'),
            getMasterData<Company>('companies'),
            getMasterData<RateType>('rateTypes'),
            getMasterData<ReservationType>('reservationTypes'),
        ]);
        setTravelAgents(ta);
        setCompanies(co);
        setRateTypes(rt);
        setReservationTypes(rst);
    };

    const handleChange = (key: keyof ReportFilterState, value: any) => {
        const newFilters = { ...filters, [key]: value };
        setFilters(newFilters);
    };

    const handleApply = () => {
        onFilterChange(filters);
    };

    const handleReset = () => {
        const resetFilters = {
            startDate: new Date().toISOString().split('T')[0],
            endDate: new Date().toISOString().split('T')[0],
            companyId: '',
            travelAgentId: '',
            rateTypeId: '',
            reservationTypeId: '',
            showAmount: true,
            remarks: []
        };
        setFilters(resetFilters);
        onFilterChange(resetFilters);
    };

    return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-8">
            <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-bold text-blue-900">{title}</h2>
            </div>

            <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-x-6 gap-y-4">
                    {/* From Date */}
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">From Date</label>
                        <input
                            type="date"
                            value={filters.startDate}
                            onChange={(e) => handleChange('startDate', e.target.value)}
                            className="block w-full rounded-md border-0 py-2 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-xs sm:leading-6"
                        />
                    </div>

                    {/* To Date */}
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">To Date</label>
                        <input
                            type="date"
                            value={filters.endDate}
                            onChange={(e) => handleChange('endDate', e.target.value)}
                            className="block w-full rounded-md border-0 py-2 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-xs sm:leading-6"
                        />
                    </div>

                    {/* Company */}
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Company</label>
                        <select
                            value={filters.companyId}
                            onChange={(e) => handleChange('companyId', e.target.value)}
                            className="block w-full rounded-md border-0 py-2 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-xs sm:leading-6"
                        >
                            <option value="">--Select--</option>
                            {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>

                    {/* Travel Agent */}
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Travel Agent</label>
                        <select
                            value={filters.travelAgentId}
                            onChange={(e) => handleChange('travelAgentId', e.target.value)}
                            className="block w-full rounded-md border-0 py-2 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-xs sm:leading-6"
                        >
                            <option value="">--Select--</option>
                            {travelAgents.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                    </div>

                    {/* Rate Type */}
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Rate Type</label>
                        <select
                            value={filters.rateTypeId}
                            onChange={(e) => handleChange('rateTypeId', e.target.value)}
                            className="block w-full rounded-md border-0 py-2 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-xs sm:leading-6"
                        >
                            <option value="">--Select--</option>
                            {rateTypes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                        </select>
                    </div>

                    {/* Reservation Type */}
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Reservation Type</label>
                        <select
                            value={filters.reservationTypeId}
                            onChange={(e) => handleChange('reservationTypeId', e.target.value)}
                            className="block w-full rounded-md border-0 py-2 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-xs sm:leading-6"
                        >
                            <option value="">--Select--</option>
                            {reservationTypes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                        </select>
                    </div>
                </div>

                <div className="border-t border-gray-100 pt-4">
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={filters.showAmount}
                            onChange={(e) => handleChange('showAmount', e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                        />
                        <span className="text-sm font-medium text-gray-700">Tax Inclusive Rates</span>
                    </div>
                </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3 rounded-b-lg">
                <button
                    onClick={handleReset}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    Reset
                </button>
                <button
                    onClick={handleApply}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    Report
                </button>
            </div>
        </div>
    );
}
