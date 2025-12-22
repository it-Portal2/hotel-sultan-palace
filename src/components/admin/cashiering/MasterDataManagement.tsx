"use client";

import React, { useState, useEffect } from 'react';
import { useAdminRole } from '@/context/AdminRoleContext';
import { useToast } from '@/context/ToastContext';
import {
    getMasterData,
    AuditLogEntry,
    getAuditLogs,
    addMasterData,
    updateMasterData,
    deleteMasterData,
    checkMasterDataUsage,
    UsageRecord
} from '@/lib/firestoreService';
import {
    PlusIcon,
    PencilIcon,
    TrashIcon,
    MagnifyingGlassIcon,
    XMarkIcon,
    ArrowDownTrayIcon,
    ClockIcon,
    EllipsisVerticalIcon,
    ExclamationCircleIcon,
    InformationCircleIcon
} from '@heroicons/react/24/outline';

interface Column {
    key: string;
    label: string;
    type?: 'text' | 'email' | 'phone' | 'boolean' | 'currency';
}

interface FormField {
    key: string;
    label: string;
    type: 'text' | 'email' | 'tel' | 'number' | 'textarea' | 'checkbox';
    required?: boolean;
}

interface MasterDataManagementProps {
    title: string;
    collectionName: string;
    columns: Column[];
    formFields: FormField[];
}

export default function MasterDataManagement({
    title,
    collectionName,
    columns,
    formFields
}: MasterDataManagementProps) {
    const { isReadOnly } = useAdminRole();
    const { showToast } = useToast();

    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Audit Trail State
    const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
    const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
    const [auditLoading, setAuditLoading] = useState(false);

    const [editingItem, setEditingItem] = useState<any | null>(null);
    const [formData, setFormData] = useState<any>({});

    // Detail Log State & Usage Check
    const [isDetailLogOpen, setIsDetailLogOpen] = useState(false);
    const [usageRecords, setUsageRecords] = useState<UsageRecord[]>([]);
    const [detailLogLoading, setDetailLogLoading] = useState(false);
    const [activeActionMenu, setActiveActionMenu] = useState<string | null>(null); // ID of item with open menu

    // Mock User Info (In real app, get from Context)
    const userInfo = { user: 'Admin', ip: '127.0.0.1' };

    useEffect(() => {
        loadData();
    }, [collectionName]);

    // Close action menu when clicking outside
    useEffect(() => {
        const handleClickOutside = () => setActiveActionMenu(null);
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const result = await getMasterData(collectionName);
            setData(result);
        } catch (error) {
            console.error(error);
            showToast(`Failed to load ${title}`, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (query: string) => {
        setSearchQuery(query);
    };

    const filteredData = data.filter(item =>
        Object.values(item).some(val =>
            String(val).toLowerCase().includes(searchQuery.toLowerCase())
        )
    );

    // Export Functionality
    const handleExport = () => {
        if (filteredData.length === 0) {
            showToast('No data to export', 'error');
            return;
        }

        // Generate CSV Header
        const headers = columns.map(col => col.label).join(',');

        // Generate CSV Rows
        const rows = filteredData.map(item => {
            return columns.map(col => {
                let cellData = item[col.key] || '';
                // Handle booleans
                if (typeof cellData === 'boolean') cellData = cellData ? 'Active' : 'Inactive';
                // Escape commas and quotes
                const escaped = String(cellData).replace(/"/g, '""');
                return `"${escaped}"`;
            }).join(',');
        }).join('\n');

        const csvContent = `${headers}\n${rows}`;
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `${collectionName}_export_${new Date().toISOString().slice(0, 10)}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Audit Trail Functionality
    const handleOpenAuditTrail = async () => {
        setIsAuditModalOpen(true);
        setAuditLoading(true);
        try {
            // Fetch logs filtering by this collection category
            const logs = await getAuditLogs(undefined, collectionName);
            setAuditLogs(logs);
        } catch (e) {
            console.error(e);
            showToast('Failed to load audit logs', 'error');
        } finally {
            setAuditLoading(false);
        }
    }

    const handleOpenDetailLog = async (item: any) => {
        setIsDetailLogOpen(true);
        setDetailLogLoading(true);
        setEditingItem(item); // Use editingItem to store current focused item
        try {
            const usage = await checkMasterDataUsage(collectionName, item.id);
            setUsageRecords(usage);
        } catch (e) {
            console.error(e);
            showToast('Failed to check dependencies', 'error');
        } finally {
            setDetailLogLoading(false);
        }
    }


    const handleCreate = () => {
        setEditingItem(null);
        setFormData({});
        setIsModalOpen(true);
    };

    const handleEdit = (item: any) => {
        setEditingItem(item);
        setFormData({ ...item });
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this item?')) return;

        try {
            const success = await deleteMasterData(collectionName, id, userInfo);
            if (success) {
                showToast('Item deleted successfully', 'success');
                loadData();
            } else {
                showToast('Failed to delete item', 'error');
            }
        } catch (error) {
            console.error(error);
            showToast('Error deleting item', 'error');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            if (editingItem && !isDetailLogOpen) { // Ensure we are in edit mode, not detail log mode
                const success = await updateMasterData(collectionName, editingItem.id, formData, userInfo);
                if (success) {
                    showToast('Item updated successfully', 'success');
                    setIsModalOpen(false);
                    loadData();
                } else {
                    showToast('Failed to update item', 'error');
                }
            } else if (!editingItem && !isDetailLogOpen) {
                const id = await addMasterData(collectionName, formData, userInfo);
                if (id) {
                    showToast('Item created successfully', 'success');
                    setIsModalOpen(false);
                    loadData();
                } else {
                    showToast('Failed to create item', 'error');
                }
            }
        } catch (error) {
            console.error(error);
            showToast('Error saving item', 'error');
        }
    };

    const handleChange = (key: string, value: any) => {
        setFormData((prev: any) => ({ ...prev, [key]: value }));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF6A00]"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                    <p className="text-sm text-gray-500">Manage {title.toLowerCase()} records</p>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
                    {/* New Buttons */}
                    {!isReadOnly && (
                        <button
                            onClick={handleCreate}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-blue-600 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium w-full sm:w-auto justify-center"
                        >
                            <PlusIcon className="h-4 w-4" />
                            Add <span className="hidden sm:inline">{title}</span><span className="sm:hidden">New</span>
                        </button>
                    )}
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium w-full sm:w-auto justify-center"
                    >
                        <ArrowDownTrayIcon className="h-4 w-4" />
                        <span className="hidden sm:inline">Export</span>
                    </button>
                    <button
                        onClick={handleOpenAuditTrail}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium w-full sm:w-auto justify-center"
                    >
                        <ClockIcon className="h-4 w-4" />
                        <span className="hidden sm:inline">Audit Trail</span>
                    </button>

                    <div className="relative w-full sm:w-auto sm:ml-2 mt-2 sm:mt-0">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder={`Search ${title}...`}
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-[#FF6A00] focus:border-[#FF6A00] text-sm w-full"
                        />
                    </div>

                </div>
            </div>

            <div className="bg-white border border-gray-200 shadow-sm rounded-lg overflow-hidden min-h-[400px] overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                <input type="checkbox" className="rounded border-gray-300 text-[#FF6A00] focus:ring-[#FF6A00]" />
                            </th>
                            {columns.map((col) => (
                                <th key={col.key} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    {col.label}
                                </th>
                            ))}
                            {!isReadOnly && (
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredData.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length + (isReadOnly ? 0 : 2)} className="px-6 py-12 text-center text-gray-500">
                                    No records found.
                                </td>
                            </tr>
                        ) : (
                            filteredData.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50 group">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <input type="checkbox" className="rounded border-gray-300 text-[#FF6A00] focus:ring-[#FF6A00]" />
                                    </td>
                                    {columns.map((col) => (
                                        <td key={`${item.id}-${col.key}`} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {col.type === 'boolean' ? (
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${item[col.key] ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                    }`}>
                                                    {item[col.key] ? 'Active' : 'Inactive'}
                                                </span>
                                            ) : (
                                                item[col.key] || '-'
                                            )}
                                        </td>
                                    ))}
                                    {!isReadOnly && (
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium relative">
                                            <div
                                                className="relative inline-block"
                                                onMouseEnter={() => setActiveActionMenu(item.id)}
                                                onMouseLeave={() => setActiveActionMenu(null)}
                                            >
                                                <button
                                                    className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
                                                >
                                                    <EllipsisVerticalIcon className="h-5 w-5" />
                                                </button>

                                                {/* Action Menu Dropdown */}
                                                {activeActionMenu === item.id && (
                                                    <div className="absolute right-0 top-5 mt-1 w-48 bg-white rounded-md shadow-lg z-50 border border-gray-100 animate-in fade-in zoom-in-95 duration-100">
                                                        <div className="py-1">
                                                            <button
                                                                onClick={() => { handleEdit(item); setActiveActionMenu(null); }}
                                                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                                            >
                                                                <PencilIcon className="mr-3 h-4 w-4 text-gray-400" />
                                                                Edit
                                                            </button>
                                                            <button
                                                                onClick={() => { handleOpenDetailLog(item); setActiveActionMenu(null); }}
                                                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                                            >
                                                                <InformationCircleIcon className="mr-3 h-4 w-4 text-gray-400" />
                                                                Detail Log
                                                            </button>
                                                            <button
                                                                onClick={() => { handleDelete(item.id); setActiveActionMenu(null); }}
                                                                className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                                            >
                                                                <TrashIcon className="mr-3 h-4 w-4 text-red-500" />
                                                                Delete
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Add/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 transform transition-all">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-gray-900">
                                {editingItem ? `Edit ${title}` : `Add ${title}`}
                            </h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-gray-400 hover:text-gray-500"
                            >
                                <XMarkIcon className="h-6 w-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {formFields.map((field) => (
                                <div key={field.key}>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {field.label} {field.required && <span className="text-red-500">*</span>}
                                    </label>
                                    {field.type === 'textarea' ? (
                                        <textarea
                                            value={formData[field.key] || ''}
                                            onChange={(e) => handleChange(field.key, e.target.value)}
                                            required={field.required}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#FF6A00] focus:border-[#FF6A00]"
                                            rows={3}
                                        />
                                    ) : field.type === 'checkbox' ? (
                                        <div className="flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={formData[field.key] || false}
                                                onChange={(e) => handleChange(field.key, e.target.checked)}
                                                className="h-4 w-4 text-[#FF6A00] focus:ring-[#FF6A00] border-gray-300 rounded"
                                            />
                                            <span className="ml-2 text-sm text-gray-600">Active</span>
                                        </div>
                                    ) : (
                                        <input
                                            type={field.type}
                                            value={formData[field.key] || ''}
                                            onChange={(e) => handleChange(field.key, e.target.value)}
                                            required={field.required}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#FF6A00] focus:border-[#FF6A00]"
                                        />
                                    )}
                                </div>
                            ))}

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors border border-gray-300"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-[#FF6A00] text-white rounded-lg hover:bg-[#e66000] transition-colors shadow-sm font-medium"
                                >
                                    Save
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Detail Log Modal */}
            {isDetailLogOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl mx-4 transform transition-all overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between p-4 border-b border-gray-100">
                            <h2 className="text-lg font-bold text-gray-900">Detail Log</h2>
                            <button
                                onClick={() => setIsDetailLogOpen(false)}
                                className="text-gray-400 hover:text-gray-500"
                            >
                                <XMarkIcon className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto">
                            <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6 flex items-start gap-3">
                                <ExclamationCircleIcon className="h-6 w-6 text-blue-500 flex-shrink-0 mt-0.5" />
                                <div>
                                    <h3 className="font-semibold text-blue-800 text-sm">This record is currently in use</h3>
                                    <p className="text-blue-600 text-xs mt-1">In order to inactivate/delete please remove the record from below listed module(s).</p>
                                </div>
                            </div>

                            <table className="min-w-full">
                                <thead>
                                    <tr className="border-b border-gray-200">
                                        <th className="text-left text-xs font-bold text-gray-500 uppercase tracking-wider pb-3 pl-2">Module Name</th>
                                        <th className="text-left text-xs font-bold text-gray-500 uppercase tracking-wider pb-3">Record(s) is in use</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {detailLogLoading ? (
                                        <tr><td colSpan={2} className="py-8 text-center text-gray-500">Checking usages...</td></tr>
                                    ) : usageRecords.length === 0 ? (
                                        <tr><td colSpan={2} className="py-8 text-center text-gray-500">No dependencies found. Record is safe to delete.</td></tr>
                                    ) : (
                                        usageRecords.map((usage, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50">
                                                <td className="py-3 pl-2 text-sm font-medium text-gray-900 flex items-center gap-2">
                                                    {usage.module}
                                                    <span className="h-2 w-2 rounded-full bg-orange-400"></span>
                                                </td>
                                                <td className="py-3 text-sm text-gray-600">
                                                    {usage.record}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>

                            <div className="mt-8 flex gap-6 text-xs text-gray-500 justify-center border-t border-gray-100 pt-4">
                                <div className="flex items-center gap-2">
                                    <span className="h-3 w-3 rounded-full bg-orange-400"></span>
                                    Used for Delete Only
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="h-3 w-3 rounded-full bg-slate-500"></span>
                                    Used for inactive only
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="h-3 w-3 rounded-full bg-red-400"></span>
                                    Used for Inactive and delete
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Audit Trail Modal */}
            {isAuditModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 transform transition-all h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">{title} - Audit Trail</h2>
                            </div>
                            <button
                                onClick={() => setIsAuditModalOpen(false)}
                                className="text-gray-400 hover:text-gray-500"
                            >
                                <XMarkIcon className="h-6 w-6" />
                            </button>
                        </div>

                        {/* Filter Bar (Mock for visuals) */}
                        <div className="p-4 bg-gray-50 border-b flex gap-4">
                            <input
                                type="text"
                                placeholder={`Search by ${title}...`}
                                className="px-3 py-2 border border-gray-300 rounded-md text-sm w-64"
                            />
                            <button className="p-2 border border-gray-300 rounded-md bg-white text-gray-500">
                                <MagnifyingGlassIcon className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-auto p-0">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-[#F8F9FA] sticky top-0">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-40">Date/Time</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Logs</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-32">User</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-32">IP</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {auditLoading ? (
                                        <tr><td colSpan={4} className="p-10 text-center">Loading logs...</td></tr>
                                    ) : auditLogs.length === 0 ? (
                                        <tr><td colSpan={4} className="p-10 text-center text-gray-500">No audit logs found.</td></tr>
                                    ) : (
                                        auditLogs.map((log) => (
                                            <tr key={log.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                    {log.timestamp.toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-900">
                                                    <div className="font-semibold">{log.action}</div>
                                                    <div className="text-gray-500 text-xs">{log.details}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                                    {log.user}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {log.ip}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
