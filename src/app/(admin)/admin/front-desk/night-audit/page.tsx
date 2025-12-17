"use client";

import React, { useState, useEffect } from 'react';
import { useAdminRole } from '@/context/AdminRoleContext';
import { useToast } from '@/context/ToastContext';
import {
    getCurrentBusinessDate,
    getAuditBlockers,
    performNightAudit,
    getAuditHistory,
    AuditBlockers
} from '@/lib/nightAuditService';
import type { NightAuditLog } from '@/lib/firestoreService';
import {
    CalendarDaysIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    ClockIcon,
    DocumentChartBarIcon
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';

export default function NightAuditPage() {
    const { adminUser, isReadOnly } = useAdminRole();
    const { showToast } = useToast();
    const router = useRouter();

    // State
    const [businessDate, setBusinessDate] = useState<Date | null>(null);
    const [blockers, setBlockers] = useState<AuditBlockers | null>(null);
    const [history, setHistory] = useState<NightAuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [runningAudit, setRunningAudit] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [date, blockersData, historyData] = await Promise.all([
                getCurrentBusinessDate(),
                // Pass today's date context if needed, but service handles standard logic
                getCurrentBusinessDate().then(d => getAuditBlockers(d)),
                getAuditHistory()
            ]);
            setBusinessDate(date);
            setBlockers(blockersData);
            setHistory(historyData);
        } catch (error) {
            console.error(error);
            showToast('Failed to load audit data', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleRunAudit = async () => {
        if (isReadOnly) return;

        setRunningAudit(true);
        try {
            // Use actual logged-in user ID
            const staffId = adminUser?.id || 'unknown';
            const staffName = adminUser?.name || 'Unknown Staff';
            const resultId = await performNightAudit(staffId, staffName);

            if (resultId) {
                showToast('Night Audit Completed Successfully!', 'success');
                setShowConfirm(false);
                await loadData();
            } else {
                showToast('Night Audit Failed. Check logs.', 'error');
            }
        } catch (error) {
            console.error(error);
            showToast('An unexpected error occurred', 'error');
        } finally {
            setRunningAudit(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF6A00]"></div>
            </div>
        );
    }

    const hasBlockers = blockers && (blockers.pendingArrivals > 0 || blockers.pendingDepartures > 0);

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-light text-gray-900">Night Audit</h1>
                    <p className="text-gray-500 mt-2">End-of-day processing and reporting</p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500">Business Date:</span>
                    <span className="text-lg font-mono font-bold text-[#FF6A00]">
                        {businessDate?.toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}
                    </span>
                </div>
            </div>

            {/* Main Status Area */}
            <div className="bg-white border border-gray-200 p-8 shadow-sm">
                <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="flex-1">
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Audit Status</h2>
                        {hasBlockers ? (
                            <div className="flex items-center gap-3 text-red-600">
                                <ExclamationTriangleIcon className="h-6 w-6" />
                                <span className="text-lg">Attention Required</span>
                                <p className="text-sm text-gray-500 ml-2">Resolve pending items before closing the day.</p>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3 text-green-600">
                                <CheckCircleIcon className="h-6 w-6" />
                                <span className="text-lg">Ready to Close</span>
                                <p className="text-sm text-gray-500 ml-2">All pre-audit checks passed.</p>
                            </div>
                        )}
                    </div>

                    <div>
                        <button
                            onClick={() => setShowConfirm(true)}
                            disabled={hasBlockers || runningAudit || isReadOnly}
                            className={`
                                flex items-center gap-2 px-8 py-4 text-white font-bold transition-all
                                ${hasBlockers || isReadOnly
                                    ? 'bg-gray-300 cursor-not-allowed'
                                    : 'bg-[#FF6A00] hover:bg-[#FF6A00]/90 shadow-md hover:shadow-lg active:translate-y-0.5'
                                }
                            `}
                        >
                            {runningAudit ? (
                                <>
                                    <div className="h-5 w-5 border-2 border-white border-t-transparent animate-spin"></div>
                                    Running System Audit...
                                </>
                            ) : (
                                <>
                                    <ClockIcon className="h-5 w-5" />
                                    RUN NIGHT AUDIT
                                </>
                            )}
                        </button>
                    </div>
                </div>

                <hr className="my-8 border-gray-100" />

                {/* Pre-Audit Grid */}
                <div>
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-6">Pre-Audit Checklist</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Pending Arrivals */}
                        <div className={`p-6 border transition-all ${blockers?.pendingArrivals ? 'bg-orange-50/30 border-orange-200' : 'bg-white border-gray-200'}`}>
                            <div className="flex justify-between items-start mb-4">
                                <span className="text-gray-600 font-medium">Pending Arrivals</span>
                                {blockers?.pendingArrivals ? <ExclamationTriangleIcon className="h-5 w-5 text-orange-500" /> : <CheckCircleIcon className="h-5 w-5 text-green-500" />}
                            </div>
                            <div className="flex items-baseline justify-between">
                                <span className="text-4xl font-light text-gray-900">{blockers?.pendingArrivals}</span>
                                {blockers?.pendingArrivals ? (
                                    <a href="/admin/front-desk?tab=arrivals" className="text-sm font-bold text-[#FF6A00] hover:underline uppercase tracking-wide">Resolve</a>
                                ) : (
                                    <span className="text-xs font-bold text-green-700 bg-green-50 px-3 py-1">CLEARED</span>
                                )}
                            </div>
                        </div>

                        {/* Pending Departures */}
                        <div className={`p-6 border transition-all ${blockers?.pendingDepartures ? 'bg-orange-50/30 border-orange-200' : 'bg-white border-gray-200'}`}>
                            <div className="flex justify-between items-start mb-4">
                                <span className="text-gray-600 font-medium">Pending Departures</span>
                                {blockers?.pendingDepartures ? <ExclamationTriangleIcon className="h-5 w-5 text-orange-500" /> : <CheckCircleIcon className="h-5 w-5 text-green-500" />}
                            </div>
                            <div className="flex items-baseline justify-between">
                                <span className="text-4xl font-light text-gray-900">{blockers?.pendingDepartures}</span>
                                {blockers?.pendingDepartures ? (
                                    <a href="/admin/front-desk?tab=departures" className="text-sm font-bold text-[#FF6A00] hover:underline uppercase tracking-wide">Resolve</a>
                                ) : (
                                    <span className="text-xs font-bold text-green-700 bg-green-50 px-3 py-1">CLEARED</span>
                                )}
                            </div>
                        </div>

                        {/* Unclean Rooms */}
                        <div className={`p-6 border transition-all ${blockers?.uncleanRooms ? 'bg-orange-50/30 border-orange-200' : 'bg-white border-gray-200'}`}>
                            <div className="flex justify-between items-start mb-4">
                                <span className="text-gray-600 font-medium">Unclean Rooms</span>
                                {blockers?.uncleanRooms ? <ExclamationTriangleIcon className="h-5 w-5 text-orange-500" /> : <CheckCircleIcon className="h-5 w-5 text-green-500" />}
                            </div>
                            <div className="flex items-baseline justify-between">
                                <span className="text-4xl font-light text-gray-900">{blockers?.uncleanRooms}</span>
                                {blockers?.uncleanRooms ? (
                                    <a href="/admin/housekeeping" className="text-sm font-bold text-[#FF6A00] hover:underline uppercase tracking-wide">View</a>
                                ) : (
                                    <span className="text-xs font-bold text-green-700 bg-green-50 px-3 py-1">CLEARED</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Workflow Steps - Clean/Minimal */}
                <div className="mt-12">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-6">Audit Sequence</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-0 border border-gray-200 divide-y md:divide-y-0 md:divide-x divide-gray-200 bg-gray-50/30">
                        <div className="p-6">
                            <span className="block text-2xl font-bold text-gray-200 mb-2">01</span>
                            <h4 className="font-bold text-gray-900">Post Charges</h4>
                            <p className="text-sm text-gray-500 mt-1">Room rates & tax posted to guest folios</p>
                        </div>
                        <div className="p-6">
                            <span className="block text-2xl font-bold text-gray-200 mb-2">02</span>
                            <h4 className="font-bold text-gray-900">Update Rooms</h4>
                            <p className="text-sm text-gray-500 mt-1">Status verified & no-shows processed</p>
                        </div>
                        <div className="p-6">
                            <span className="block text-2xl font-bold text-gray-200 mb-2">03</span>
                            <h4 className="font-bold text-gray-900">Reports</h4>
                            <p className="text-sm text-gray-500 mt-1">Daily revenue & occupancy reports</p>
                        </div>
                        <div className="p-6 bg-[#FF6A00]/5">
                            <span className="block text-2xl font-bold text-[#FF6A00]/20 mb-2">04</span>
                            <h4 className="font-bold text-[#FF6A00]">Roll Date</h4>
                            <p className="text-sm text-gray-500 mt-1">System advances to next business day</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Audit History - Clean Table */}
            <div className="bg-white border border-gray-200 shadow-sm">
                <div className="px-8 py-6 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                        <DocumentChartBarIcon className="h-5 w-5 text-[#FF6A00]" />
                        Audit History
                    </h3>
                    <button className="text-sm text-gray-500 hover:text-[#FF6A00] transition-colors">View All Logs</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-100">
                        <thead>
                            <tr className="bg-gray-50/50">
                                <th className="px-8 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Business Date</th>
                                <th className="px-8 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Time</th>
                                <th className="px-8 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Revenue</th>
                                <th className="px-8 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Occupancy</th>
                                <th className="px-8 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                            {history.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-12 text-center text-gray-500">
                                        No audit history found.
                                    </td>
                                </tr>
                            ) : (
                                history.map((log) => (
                                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-8 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {log.date?.toLocaleDateString()}
                                        </td>
                                        <td className="px-8 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {log.startedAt?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td className="px-8 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                                            ${log.summary?.totalRevenue?.toFixed(2)}
                                        </td>
                                        <td className="px-8 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {log.summary?.totalOccupiedRooms} <span className="text-xs">rms</span>
                                        </td>
                                        <td className="px-8 py-4 whitespace-nowrap">
                                            <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wide border ${log.status === 'completed'
                                                ? 'bg-green-50 text-green-700 border-green-100'
                                                : 'bg-red-50 text-red-700 border-red-100'
                                                }`}>
                                                {log.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Confirmation Modal - Sharp */}
            {showConfirm && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white shadow-2xl max-w-md w-full p-8 animate-scale-up border-t-4 border-[#FF6A00]">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="bg-orange-50 p-3">
                                <ExclamationTriangleIcon className="h-8 w-8 text-[#FF6A00]" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">Confirm Audit</h3>
                                <p className="text-sm text-gray-500">End of Day Processing</p>
                            </div>
                        </div>

                        <div className="bg-gray-50 p-4 border-l-2 border-gray-300 mb-6">
                            <p className="text-sm text-gray-600">
                                You are closing the business day for <span className="font-bold text-gray-900">{businessDate?.toLocaleDateString()}</span>.
                            </p>
                        </div>

                        <div className="space-y-4 mb-8">
                            <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">System Actions:</p>
                            <ul className="space-y-3">
                                {[
                                    'Post room charges for in-house guests',
                                    'Finalize consumption and revenue',
                                    'Lock inventory and financial data',
                                    'Update room statuses',
                                    'Generate daily reports',
                                    'Roll system date to next day'
                                ].map((item, i) => (
                                    <li key={i} className="flex items-start gap-3 text-sm text-gray-600">
                                        <CheckCircleIcon className="h-5 w-5 text-gray-400 shrink-0" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="flex justify-end gap-0 border-t border-gray-100 pt-6">
                            <button
                                onClick={() => setShowConfirm(false)}
                                className="px-6 py-2 text-gray-600 hover:text-gray-900 font-medium transition-colors mr-4"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRunAudit}
                                className="px-6 py-2 bg-[#FF6A00] text-white font-bold hover:bg-[#FF6A00]/90 transition-all shadow-sm"
                            >
                                CONFIRM & RUN
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
