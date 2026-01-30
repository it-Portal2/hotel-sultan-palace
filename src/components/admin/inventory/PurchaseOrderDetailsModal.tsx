
import React from 'react';
import { PurchaseOrder } from '@/lib/firestoreService';
import { XMarkIcon, ExclamationTriangleIcon, PhotoIcon, BuildingStorefrontIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

interface PurchaseOrderDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    po: PurchaseOrder | null;
}

const formatFirestoreDate = (date: any): string => {
    if (!date) return '-';
    try {
        // Handle Firestore Timestamp (check for method existence to be safe)
        if (date && typeof date.toDate === 'function') {
            return date.toDate().toLocaleString();
        }
        if (date instanceof Date) return date.toLocaleString();
        return new Date(date).toLocaleString();
    } catch (e) {
        return '-';
    }
};

export default function PurchaseOrderDetailsModal({ isOpen, onClose, po }: PurchaseOrderDetailsModalProps) {
    if (!isOpen || !po) return null;

    const details = po.receivedDetails;

    // Use details if received, otherwise basic items
    const isReceived = po.status === 'received' && details;

    // Total Order Value
    const totalOrderValue = po.totalAmount || 0;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col rounded-xl animate-fade-in-up">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/80 sticky top-0 backdrop-blur-md z-10">
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-2xl font-bold text-gray-900">PO Details: {po.poNumber}</h2>
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold capitalize ${po.status === 'received' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                                }`}>
                                {po.status}
                            </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">Supplier: {po.supplierName} • Date: {po.createdAt.toLocaleDateString()}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                        <XMarkIcon className="w-6 h-6 text-gray-500" />
                    </button>
                </div>

                <div className="p-6 space-y-8">
                    {/* 1. Reception Summary (If Received) */}
                    {isReceived && details && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-4 rounded-xl border border-gray-200">
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-gray-900 uppercase">Reception Info</h3>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="block text-gray-500 text-xs">Received By</span>
                                        <span className="font-medium text-gray-900">{details.receivedBy}</span>
                                    </div>
                                    <div>
                                        <span className="block text-gray-500 text-xs">Received At</span>
                                        <span className="font-medium text-gray-900">{formatFirestoreDate(details.receivedAt)}</span>
                                    </div>
                                    <div className="col-span-2">
                                        <span className="block text-gray-500 text-xs">Stock Added To</span>
                                        <span className="font-medium text-gray-900 flex items-center gap-1">
                                            <BuildingStorefrontIcon className="w-4 h-4 text-gray-400" />
                                            {/* We only store ID mostly, UI needs to fetch name or just show ID for now? 
                                                 Ideally we passed Name, but let's show ID or fallback if simple. */}
                                            {po.targetLocationId ? (
                                                <span className="bg-white border border-gray-200 px-2 py-0.5 rounded text-xs">
                                                    Location ID: {po.targetLocationId}
                                                </span>
                                            ) : <span className="text-gray-400 italic">Default Store</span>}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 border-l border-gray-200 pl-6">
                                <h3 className="text-sm font-bold text-gray-900 uppercase">Financials</h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Total Rejected Val:</span>
                                        <span className="font-bold text-red-600">${details.totalRejectedValue.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between pt-2 border-t border-gray-200">
                                        <span className="text-gray-900 font-bold">Final Payable:</span>
                                        <span className="font-bold text-[#FF6A00] text-lg">${details.finalPayableAmount.toFixed(2)}</span>
                                    </div>
                                    {details.creditNoteRequested && (
                                        <div className="inline-flex items-center gap-1 bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold mt-2">
                                            <ExclamationTriangleIcon className="w-3 h-3" /> Credit Note Requested
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 2. Items Table */}
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Item Details</h3>
                        <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
                            <table className="min-w-full divide-y divide-gray-200 text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-600 w-1/3">Item</th>
                                        <th className="px-4 py-3 text-center font-semibold text-gray-600">Ordered</th>
                                        {isReceived && (
                                            <>
                                                <th className="px-4 py-3 text-center font-semibold text-green-700">Accepted</th>
                                                <th className="px-4 py-3 text-center font-semibold text-red-700">Rejected</th>
                                                <th className="px-4 py-3 text-center font-semibold text-orange-600">Missing</th>
                                            </>
                                        )}
                                        <th className="px-4 py-3 text-right font-semibold text-gray-600">Cost</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {(isReceived ? details!.items : po.items).map((item: any) => (
                                        <tr key={item.itemId} className="hover:bg-gray-50">
                                            <td className="px-4 py-3">
                                                <div className="font-medium text-gray-900">{item.name}</div>
                                                {isReceived && item.rejectionReason && (
                                                    <div className="text-xs text-red-500 mt-1 flex items-start gap-1 p-1 bg-red-50 rounded">
                                                        <ExclamationTriangleIcon className="w-3 h-3 shrink-0 mt-0.5" />
                                                        {item.rejectionReason}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-center text-gray-500 font-medium">
                                                {isReceived ? item.orderedQty : item.quantity}
                                            </td>
                                            {isReceived && (
                                                <>
                                                    <td className="px-4 py-3 text-center text-green-700 font-bold bg-green-50/20">
                                                        {item.receivedQty}
                                                    </td>
                                                    <td className="px-4 py-3 text-center text-red-700 font-bold bg-red-50/20">
                                                        {item.rejectedQty}
                                                    </td>
                                                    <td className="px-4 py-3 text-center text-orange-600 font-medium">
                                                        {item.missingQty || 0}
                                                    </td>
                                                </>
                                            )}
                                            <td className="px-4 py-3 text-right text-gray-700 font-mono">
                                                ${(isReceived ? item.actualUnitCost : item.unitCost).toFixed(2)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* 3. Invoice & Notes */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Notes */}
                        {((details && details.notes) || po.notes) && (
                            <div className="bg-amber-50 rounded-lg p-4 border border-amber-100">
                                <h4 className="text-xs font-bold text-amber-800 uppercase mb-2">Notes</h4>
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                    {isReceived ? details!.notes : po.notes}
                                </p>
                            </div>
                        )}

                        {/* Invoice */}
                        {po.invoiceUrl ? (
                            <div className="bg-blue-50 rounded-lg p-4 border border-blue-100 flex flex-col items-center justify-center text-center">
                                <h4 className="text-xs font-bold text-blue-800 uppercase mb-2">Invoice / Receipt</h4>
                                <button
                                    onClick={() => window.open(po.invoiceUrl!, '_blank')}
                                    className="flex items-center gap-2 px-4 py-2 bg-white text-blue-600 border border-blue-200 rounded-lg shadow-sm hover:bg-blue-50 transition-colors font-bold text-sm"
                                >
                                    <DocumentTextIcon className="w-5 h-5" />
                                    View Original Receipt
                                </button>
                            </div>
                        ) : (
                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 text-center flex flex-col justify-center">
                                <p className="text-sm text-gray-400 italic">No invoice uploaded</p>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}
