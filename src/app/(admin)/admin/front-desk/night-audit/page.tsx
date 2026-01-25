"use client";

import React, { useState, useEffect } from 'react';
import { useAdminRole } from '@/context/AdminRoleContext';
import { useToast } from '@/context/ToastContext';
import {
    getCurrentBusinessDate,
    getAuditBlockers,
    getAuditHistory
} from '@/lib/nightAuditService';
import { performNightAudit } from '@/app/actions/nightAuditActions';
import { getAuditLogs, AuditLogEntry, NightAuditLog } from '@/lib/firestoreService';
import {
    CalendarDaysIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    ArrowPathIcon
} from '@heroicons/react/24/outline';

interface PreAuditBlocker {
    type: string;
    message: string;
    count: number;
}

export default function NightAuditPage() {
    const { isReadOnly } = useAdminRole(); // Assuming role object has info, otherwise mock user
    const { showToast } = useToast();

    const [currentDate, setCurrentDate] = useState<string>('');
    const [status, setStatus] = useState<string>('idle');
    const [blockers, setBlockers] = useState<PreAuditBlocker[]>([]);
    const [history, setHistory] = useState<NightAuditLog[]>([]);
    const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'status' | 'history' | 'trail'>('status');
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const date = await getCurrentBusinessDate();
            setCurrentDate(date.toISOString().split('T')[0]);

            const hist = await getAuditHistory();
            setHistory(hist);

            const logs = await getAuditLogs();
            setAuditLogs(logs);

            // Check blockers
            const auditBlockers = await getAuditBlockers(date);
            const newBlockers: PreAuditBlocker[] = [];

            if (auditBlockers.pendingArrivals > 0) {
                newBlockers.push({ type: 'Pending Arrivals', message: 'Guests expected to arrive', count: auditBlockers.pendingArrivals });
            }
            if (auditBlockers.pendingDepartures > 0) {
                newBlockers.push({ type: 'Pending Departures', message: 'Guests expected to checkout', count: auditBlockers.pendingDepartures });
            }
            if (auditBlockers.uncleanRooms > 0) {
                newBlockers.push({ type: 'Unclean Rooms', message: 'Rooms status dirty/inspection', count: auditBlockers.uncleanRooms });
            }
            setBlockers(newBlockers);

        } catch (error) {
            console.error(error);
            showToast('Failed to load night audit data', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleRunAudit = () => {
        if (blockers.length > 0) {
            showToast('Cannot run audit. Resolve blockers first.', 'error');
            return;
        }
        setShowConfirmModal(true);
    };

    const executeAudit = async () => {
        setShowConfirmModal(false);
        setStatus('running');
        try {
            // Mock staff info or get from auth context if available
            const staffId = 'admin';
            const staffName = 'Main Admin';

            const resultId = await performNightAudit(staffId, staffName);

            if (resultId) {
                showToast('Night Audit completed successfully', 'success');
                loadData();
            } else {
                showToast('Night Audit failed. Check console.', 'error');
            }
        } catch (error) {
            console.error(error);
            showToast('Error running night audit', 'error');
        } finally {
            setStatus('idle');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Night Audit</h1>
                    <p className="text-gray-500">Business Date: {currentDate}</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setActiveTab('status')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium ${activeTab === 'status' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border'}`}
                    >
                        Current Status
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium ${activeTab === 'history' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border'}`}
                    >
                        Audit History
                    </button>
                    <button
                        onClick={() => setActiveTab('trail')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium ${activeTab === 'trail' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border'}`}
                    >
                        Audit Trail
                    </button>
                </div>
            </div>

            {activeTab === 'status' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <ExclamationTriangleIcon className="h-5 w-5 text-orange-500" />
                            Pre-Audit Check
                        </h2>
                        {blockers.length === 0 ? (
                            <div className="text-green-600 flex items-center gap-2 bg-green-50 p-4 rounded-lg">
                                <CheckCircleIcon className="h-6 w-6" />
                                <span className="font-medium">All checks passed. Ready to run audit.</span>
                            </div>
                        ) : (
                            <ul className="space-y-3">
                                {blockers.map((blocker, idx) => (
                                    <li key={idx} className="flex items-start gap-3 bg-red-50 p-3 rounded-lg text-red-700">
                                        <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <span className="font-bold block">{blocker.type}</span>
                                            <span className="text-sm">{blocker.message} ({blocker.count} items)</span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col justify-center items-center text-center">
                        <CalendarDaysIcon className="h-16 w-16 text-blue-600 mb-4" />
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Run Night Audit</h3>
                        <p className="text-gray-500 mb-6 max-w-sm">
                            This process will close the current business date ({currentDate}) and roll over to the next day.
                            Ensure all transactions are posted.
                        </p>
                        <button
                            onClick={handleRunAudit}
                            disabled={status === 'running' || blockers.length > 0 || isReadOnly}
                            className={`px-8 py-3 rounded-lg text-white font-bold flex items-center gap-2 shadow-lg transition-all
                                ${status === 'running' || blockers.length > 0 || isReadOnly
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transform hover:scale-105'}`}
                        >
                            {status === 'running' ? (
                                <>
                                    <ArrowPathIcon className="h-5 w-5 animate-spin" />
                                    Running Audit...
                                </>
                            ) : (
                                'Start Night Audit Process'
                            )}
                        </button>
                    </div>
                </div>
            )}

            {activeTab === 'history' && (
                <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Revenue</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Occupancy</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Run At</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {history.length === 0 ? (
                                <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500">No audit history found.</td></tr>
                            ) : (
                                history.map((h) => (
                                    <tr key={h.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {new Date(h.date).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${h.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                {h.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-mono">
                                            ${h.summary?.totalRevenue?.toFixed(2) || '0.00'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            {h.summary?.totalOccupiedRooms || 0} rooms
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {h.completedAt ? new Date(h.completedAt).toLocaleString() : '-'}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {activeTab === 'trail' && (
                <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
                    {/* Filter Header similar to screenshot */}
                    <div className="p-4 bg-gray-50 border-b flex gap-4 overflow-x-auto">
                        <select className="text-sm border-gray-300 rounded"><option>All Users</option></select>
                        <select className="text-sm border-gray-300 rounded"><option>All Actions</option></select>
                        <input type="date" className="text-sm border-gray-300 rounded" />
                    </div>

                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-100 text-gray-700">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-bold uppercase">Date & Time</th>
                                <th className="px-4 py-3 text-left text-xs font-bold uppercase">Logs</th>
                                <th className="px-4 py-3 text-left text-xs font-bold uppercase">User</th>
                                <th className="px-4 py-3 text-left text-xs font-bold uppercase">IP</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                            {auditLogs.length === 0 ? (
                                <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-500">No detailed logs found.</td></tr>
                            ) : (
                                auditLogs.map((log) => (
                                    <tr key={log.id} className="hover:bg-blue-50 transition-colors">
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 font-mono">
                                            {new Date(log.timestamp).toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-800">
                                            <div className="font-bold text-blue-900">{log.action}</div>
                                            {(log.oldValue || log.newValue) ? (
                                                <div className="text-xs text-gray-500 mt-1 bg-gray-50 p-1 rounded border border-gray-100 inline-block">
                                                    {log.oldValue && <span className="text-red-600 mr-2">Old: {log.oldValue}</span>}
                                                    {log.newValue && <span className="text-green-600">New: {log.newValue}</span>}
                                                </div>
                                            ) : (
                                                <div className="text-xs text-gray-500 italic">{log.details}</div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-medium">
                                            {log.user || 'System'}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 font-mono">
                                            {log.ip || '192.168.1.1'} {/* Mock IP if missing */}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}
            {/* Confirmation Modal */}
            {showConfirmModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowConfirmModal(false)}></div>
                    <div className="relative bg-white rounded-xl shadow-2xl p-6 max-w-md w-full border border-gray-100">
                        <div className="flex flex-col items-center text-center">
                            <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                                <ExclamationTriangleIcon className="h-6 w-6 text-orange-600" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Run Night Audit?</h3>
                            <p className="text-gray-500 text-sm mb-6">
                                This action will close the current business date ({currentDate}) and roll over to the next day.
                                <br /><br />
                                <span className="font-semibold text-gray-700">This action cannot be undone.</span>
                            </p>

                            <div className="flex gap-3 w-full">
                                <button
                                    onClick={() => setShowConfirmModal(false)}
                                    className="flex-1 py-2.5 bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={executeAudit}
                                    className="flex-1 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
                                >
                                    Confirm Audit
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
