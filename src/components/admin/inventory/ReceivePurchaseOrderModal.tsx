import React, { useState, useEffect } from 'react';
import type { PurchaseOrder } from '@/lib/firestoreService';
import { receivePurchaseOrder } from '@/lib/inventoryService';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { XMarkIcon, ExclamationTriangleIcon, PhotoIcon } from '@heroicons/react/24/outline';
import { useToast } from '@/context/ToastContext';

interface ReceivePurchaseOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    po: PurchaseOrder | null;
    onSuccess: () => void;
}

interface ItemReceiveRow {
    itemId: string;
    name: string;
    unit: string;
    orderedQty: number;
    unitCost: number; // Original cost

    receivedQty: number; // Good stock
    rejectedQty: number; // Broken/Missing
    missingQty: number; // Auto-calc

    actualUnitCost: number; // New cost if changed
    expiryDate: string;

    rejectionReason: string;
}

export default function ReceivePurchaseOrderModal({ isOpen, onClose, po, onSuccess }: ReceivePurchaseOrderModalProps) {
    const { showToast } = useToast();
    const [submitting, setSubmitting] = useState(false);
    const [uploading, setUploading] = useState(false);

    const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
    const [invoicePreview, setInvoicePreview] = useState<string | null>(null);

    const [items, setItems] = useState<ItemReceiveRow[]>([]);
    const [notes, setNotes] = useState('');
    const [creditNoteRequested, setCreditNoteRequested] = useState(false);

    useEffect(() => {
        if (isOpen && po) {
            // Initialize form with PO items
            setItems(po.items.map(i => ({
                itemId: i.itemId,
                name: i.name,
                unit: (i as any).unit || 'units',
                orderedQty: i.quantity,
                unitCost: i.unitCost,
                receivedQty: i.quantity, // Default to full receive
                rejectedQty: 0,
                missingQty: 0,
                actualUnitCost: i.unitCost, // Default to same price
                expiryDate: '',
                rejectionReason: ''
            })));
            setInvoiceFile(null);
            setInvoicePreview(null);
            setNotes('');
            setCreditNoteRequested(false);
        }
    }, [isOpen, po]);

    // Recalculate Missing Qty when Received or Rejected changes
    const updateItem = (index: number, field: keyof ItemReceiveRow, value: any) => {
        const newItems = [...items];
        const item = { ...newItems[index], [field]: value };

        if (field === 'receivedQty' || field === 'rejectedQty') {
            item.missingQty = item.orderedQty - item.receivedQty - item.rejectedQty;
        }

        newItems[index] = item;
        setItems(newItems);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setInvoiceFile(file);
            setInvoicePreview(URL.createObjectURL(file));
        }
    };

    const uploadInvoice = async (): Promise<string | undefined> => {
        if (!invoiceFile) return undefined;
        if (!storage) return undefined;

        const storageRef = ref(storage, `purchase-orders/${po?.poNumber}_invoice_${Date.now()}`);
        await uploadBytes(storageRef, invoiceFile);
        return await getDownloadURL(storageRef);
    };

    const handleSubmit = async () => {
        if (!po) return;
        setSubmitting(true);
        try {
            // 1. Upload Invoice if exists
            let invoiceUrl = undefined;
            if (invoiceFile) {
                setUploading(true);
                invoiceUrl = await uploadInvoice();
                setUploading(false);
            }

            // 2. Submit Data
            await receivePurchaseOrder(po.id, {
                invoiceUrl,
                items: items.map(i => ({
                    itemId: i.itemId,
                    orderedQty: i.orderedQty,
                    receivedQty: i.receivedQty,
                    rejectedQty: i.rejectedQty,
                    actualUnitCost: i.actualUnitCost,
                    expiryDate: i.expiryDate || undefined
                })),
                creditNoteRequested,
                notes
            }, 'Admin'); // TODO: Pass actual user

            showToast("Order received successfully", "success");
            onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            showToast("Failed to process reception", "error");
        } finally {
            setSubmitting(false);
            setUploading(false);
        }
    };

    // Calculations
    const totalOrderValue = items.reduce((sum, i) => sum + (i.orderedQty * i.unitCost), 0);
    const totalReceivedValue = items.reduce((sum, i) => sum + (i.receivedQty * i.actualUnitCost), 0);
    const totalRejectedValue = items.reduce((sum, i) => sum + (i.rejectedQty * i.actualUnitCost), 0);
    const totalMissingValue = items.reduce((sum, i) => sum + (i.missingQty * i.unitCost), 0);

    // If actual cost changed, we need to show the difference
    const priceDiff = items.reduce((sum, i) => sum + ((i.actualUnitCost - i.unitCost) * i.receivedQty), 0);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto flex flex-col rounded-xl animate-fade-in-up">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/80 sticky top-0 backdrop-blur-md z-10">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Receive Stock: {po?.poNumber}</h2>
                        <p className="text-sm text-gray-500 mt-1">Verify goods, record breakage, and upload invoice.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                        <XMarkIcon className="w-6 h-6 text-gray-500" />
                    </button>
                </div>

                <div className="p-6 space-y-8">

                    {/* 1. Invoice Upload */}
                    <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100 flex flex-col md:flex-row gap-6 items-start">
                        <div className="flex-1">
                            <label className="block text-sm font-bold text-gray-900 mb-2">Upload Invoice / Receipt</label>
                            <p className="text-xs text-gray-500 mb-3">Upload a photo of the physical bill for audit purposes.</p>

                            <div className="flex gap-4 items-center">
                                <label className="cursor-pointer bg-white border border-gray-300 hover:border-blue-500 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 transition-all shadow-sm">
                                    <PhotoIcon className="w-5 h-5 text-blue-500" />
                                    <span>Select Image</span>
                                    <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                                </label>
                                {invoiceFile && <span className="text-sm text-gray-600 font-medium">{invoiceFile.name}</span>}
                            </div>
                        </div>
                        {invoicePreview && (
                            <div className="w-32 h-32 bg-gray-200 rounded-lg overflow-hidden border border-gray-300 shadow-sm relative group">
                                <img src={invoicePreview} alt="Preview" className="w-full h-full object-cover" />
                                <button
                                    onClick={() => { setInvoiceFile(null); setInvoicePreview(null); }}
                                    className="absolute top-1 right-1 bg-red-500/80 hover:bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <XMarkIcon className="w-3 h-3" />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* 2. Items Table */}
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Received Items</h3>
                        <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
                            <table className="min-w-full divide-y divide-gray-200 text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-600 w-1/4">Item</th>
                                        <th className="px-4 py-3 text-center font-semibold text-gray-600">Ordered</th>
                                        <th className="px-4 py-3 text-center font-semibold text-green-700 bg-green-50">Good Qty</th>
                                        <th className="px-4 py-3 text-center font-semibold text-red-700 bg-red-50">Bad/Broken</th>
                                        <th className="px-4 py-3 text-center font-semibold text-gray-600">Cost ($)</th>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-600">Expiry / Notes</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {items.map((item, idx) => (
                                        <tr key={item.itemId} className="hover:bg-gray-50">
                                            <td className="px-4 py-3">
                                                <div className="font-medium text-gray-900">{item.name}</div>
                                                <div className="text-xs text-gray-500">{item.unit}</div>
                                            </td>
                                            <td className="px-4 py-3 text-center text-gray-500">
                                                {item.orderedQty}
                                            </td>
                                            <td className="px-4 py-3 bg-green-50/30">
                                                <input
                                                    type="number" min="0"
                                                    className="w-20 text-center border-gray-300 focus:border-green-500 focus:ring-green-500 rounded-md shadow-sm"
                                                    value={item.receivedQty}
                                                    onChange={e => updateItem(idx, 'receivedQty', Number(e.target.value))}
                                                />
                                            </td>
                                            <td className="px-4 py-3 bg-red-50/30">
                                                <input
                                                    type="number" min="0"
                                                    className="w-20 text-center border-gray-300 focus:border-red-500 focus:ring-red-500 text-red-600 font-medium rounded-md shadow-sm"
                                                    value={item.rejectedQty}
                                                    onChange={e => updateItem(idx, 'rejectedQty', Number(e.target.value))}
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <input
                                                    type="number" min="0" step="0.01"
                                                    className="w-24 text-right border-gray-300 focus:border-blue-500 rounded-md shadow-sm"
                                                    value={item.actualUnitCost}
                                                    onChange={e => updateItem(idx, 'actualUnitCost', Number(e.target.value))}
                                                />
                                                {item.actualUnitCost !== item.unitCost && (
                                                    <div className="text-[10px] text-gray-400 text-right line-through">${item.unitCost}</div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 space-y-2">
                                                <input
                                                    type="date"
                                                    className="block w-full text-xs border-gray-200 rounded focus:border-blue-500"
                                                    value={item.expiryDate}
                                                    onChange={e => updateItem(idx, 'expiryDate', e.target.value)}
                                                />
                                                {(item.rejectedQty > 0 || item.missingQty > 0) && (
                                                    <input
                                                        type="text"
                                                        placeholder="Reason for rejection/missing..."
                                                        className="block w-full text-xs border-gray-200 rounded focus:border-red-500 text-red-600 placeholder-red-200"
                                                        value={item.rejectionReason}
                                                        onChange={e => updateItem(idx, 'rejectionReason', e.target.value)}
                                                    />
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* 3. Summary & Financials */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-gray-50 rounded-xl p-6 border border-gray-200">
                        <div>
                            <h4 className="text-sm font-bold text-gray-900 uppercase mb-3">Supplier Liability</h4>

                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Total Rejected / Broken:</span>
                                    <span className="font-bold text-red-600">${totalRejectedValue.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Missing Items:</span>
                                    <span className="font-bold text-orange-600">${totalMissingValue.toFixed(2)}</span>
                                </div>

                                {(totalRejectedValue > 0 || totalMissingValue > 0) && (
                                    <div className="mt-4 pt-3 border-t border-gray-200">
                                        <label className="flex items-start gap-3 cursor-pointer p-3 bg-white border border-red-200 rounded-lg shadow-sm hover:border-red-300 transition-colors">
                                            <input
                                                type="checkbox"
                                                className="mt-1 h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                                                checked={creditNoteRequested}
                                                onChange={e => setCreditNoteRequested(e.target.checked)}
                                            />
                                            <div>
                                                <span className="block font-medium text-gray-900">Request Credit Note</span>
                                                <span className="block text-xs text-gray-500">Flag this order to claim ${(totalRejectedValue + totalMissingValue).toFixed(2)} from supplier.</span>
                                            </div>
                                        </label>
                                    </div>
                                )}
                            </div>

                            <div className="mt-6">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Internal Notes</label>
                                <textarea
                                    className="w-full text-sm border-gray-300 rounded-lg focus:border-blue-500 focus:ring-0"
                                    rows={3}
                                    placeholder="Any additional details about this delivery..."
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col justify-center">
                            <h4 className="text-sm font-bold text-gray-500 uppercase mb-6 border-b pb-2">Financial Summary</h4>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Original Order Value</span>
                                    <span className="font-medium text-gray-900 text-lg">${totalOrderValue.toFixed(2)}</span>
                                </div>

                                {priceDiff !== 0 && (
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-amber-600 flex items-center gap-1">
                                            <ExclamationTriangleIcon className="w-4 h-4" /> Price Changes
                                        </span>
                                        <span className={priceDiff > 0 ? "text-red-500" : "text-green-500"}>
                                            {priceDiff > 0 ? '+' : ''}{priceDiff.toFixed(2)}
                                        </span>
                                    </div>
                                )}

                                <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                                    <div className="flex flex-col">
                                        <span className="text-lg font-bold text-gray-900">Final Payable</span>
                                        <span className="text-xs text-gray-500">Value of goods accepted</span>
                                    </div>
                                    <div className="text-3xl font-bold text-[#FF6A00]">
                                        ${totalReceivedValue.toFixed(2)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 sticky bottom-0">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 font-medium transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="px-8 py-2 bg-[#FF6A00] text-white rounded-lg hover:bg-[#FF6A00]/90 font-bold shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                        {submitting ? (
                            <>
                                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                                Processing...
                            </>
                        ) : (
                            'Confirm Reception'
                        )}
                    </button>
                </div>

            </div>
        </div>
    );
}
