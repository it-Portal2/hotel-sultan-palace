import React, { useState, useEffect } from 'react';
import type { PurchaseOrder, Supplier, InventoryItem } from '@/lib/firestoreService';
import { createPurchaseOrder, updatePurchaseOrder } from '@/lib/inventoryService';
import Drawer from '@/components/ui/Drawer';
import { PlusIcon, TrashIcon, CalculatorIcon, PrinterIcon } from '@heroicons/react/24/outline';
import { useToast } from '@/context/ToastContext';
import { Timestamp } from 'firebase/firestore';
import { generatePurchaseOrderHTML } from '@/utils/invoiceGenerator';

interface PurchaseOrderDrawerProps {
    po: PurchaseOrder | null;
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    suppliers: Supplier[];
    inventoryItems: InventoryItem[];
    readonly?: boolean;
    onMarkPaid?: (id: string) => void;
}

interface POLineItem {
    itemId: string;
    description: string;
    unit: string;
    quantity: number;
    unitCost: number;
    totalCost: number;
}

export default function PurchaseOrderDrawer({ po, isOpen, onClose, onSave, suppliers, inventoryItems, readonly = false, onMarkPaid }: PurchaseOrderDrawerProps) {
    const { showToast } = useToast();
    const [supplierId, setSupplierId] = useState('');
    const [expectedDate, setExpectedDate] = useState('');
    const [notes, setNotes] = useState('');
    const [lineItems, setLineItems] = useState<POLineItem[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Initial Load / Reset
    useEffect(() => {
        if (po) {
            setSupplierId(po.supplierId);
            // Safely convert expectedDeliveryDate (could be Firestore Timestamp, Date, or null)
            let formattedDate = '';
            if (po.expectedDeliveryDate) {
                try {
                    // Handle Firestore Timestamp
                    const dateValue = po.expectedDeliveryDate instanceof Timestamp
                        ? po.expectedDeliveryDate.toDate()
                        : new Date(po.expectedDeliveryDate);

                    // Check if date is valid before calling toISOString
                    if (!isNaN(dateValue.getTime())) {
                        formattedDate = dateValue.toISOString().split('T')[0];
                    }
                } catch (error) {
                    console.error('Error parsing expectedDeliveryDate:', error);
                }
            }
            setExpectedDate(formattedDate);
            setNotes(po.notes || '');
            // Map existing items if structure matches, otherwise start empty or need migration logic
            // Assuming simple structure for now or manual add
            setLineItems(po.items?.map(i => ({
                itemId: i.itemId,
                description: i.name,
                unit: i.unit || 'units',
                quantity: i.quantity,
                unitCost: i.unitCost,
                totalCost: i.totalCost
            })) || []);
        } else {
            resetForm();
        }
    }, [po, isOpen]);

    const resetForm = () => {
        setSupplierId('');
        setExpectedDate('');
        setNotes('');
        setLineItems([]);
    };

    const handleAddItem = () => {
        setLineItems([...lineItems, { itemId: '', description: '', unit: '', quantity: 1, unitCost: 0, totalCost: 0 }]);
    };

    const handleUpdateItem = (index: number, field: keyof POLineItem, value: any) => {
        if (readonly) return;
        const newItems = [...lineItems];
        const item = newItems[index];

        if (field === 'itemId') {
            const selectedInvItem = inventoryItems.find(i => i.id === value);
            item.itemId = value;
            item.description = selectedInvItem ? selectedInvItem.name : '';
            item.unit = selectedInvItem ? selectedInvItem.unit : 'units';
            item.unitCost = selectedInvItem ? selectedInvItem.unitCost : 0;
        } else {
            (item as any)[field] = value;
        }

        // Auto-calc total
        item.totalCost = item.quantity * item.unitCost;
        setLineItems(newItems);
    };

    const handleRemoveItem = (index: number) => {
        if (readonly) return;
        setLineItems(lineItems.filter((_, i) => i !== index));
    };

    const [errors, setErrors] = useState<Record<string, string>>({});

    const validateForm = (targetStatus?: string) => {
        const newErrors: Record<string, string> = {};

        // Valid supplier check
        const isValidSupplier = suppliers.some(s => s.id === supplierId);

        // If status is ordered, STRICTLY require valid supplier.
        // If draft, we allow 'pending' or empty (if we decide to allow empty, but currently state inits to '').
        if (targetStatus === 'ordered' && !isValidSupplier) {
            newErrors.supplierId = "A valid supplier is required to place order";
        } else if (!supplierId && targetStatus !== 'draft') {
            // Basic check for other cases
            newErrors.supplierId = "Supplier is required";
        }

        if (lineItems.length === 0) {
            newErrors.lineItems = "At least one item is required";
        } else {
            lineItems.forEach((item, index) => {
                if (!item.itemId) newErrors[`items.${index}.itemId`] = "Item is required";
                if (item.quantity <= 0) newErrors[`items.${index}.quantity`] = "Quantity must be > 0";
                if (item.unitCost < 0) newErrors[`items.${index}.unitCost`] = "Cost cannot be negative";
            });
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const calculateGrandTotal = () => {
        return lineItems.reduce((sum, item) => sum + item.totalCost, 0);
    };

    const handlePrint = () => {
        if (!po) return;
        try {
            const html = generatePurchaseOrderHTML(po);
            const printWindow = window.open('', '_blank');
            if (printWindow) {
                printWindow.document.write(html);
                printWindow.document.close();
            } else {
                showToast("Popup blocked. Please allow popups to print.", "error");
            }
        } catch (error) {
            console.error("Print failed", error);
            showToast("Failed to generate print view", "error");
        }
    };

    const handleSave = async (status: string) => {
        if (readonly) return;
        if (!validateForm(status)) {
            showToast("Please fix the validation errors", "error");
            return;
        }

        setIsSubmitting(true);
        try {
            const supplier = suppliers.find(s => s.id === supplierId);
            const poData: Partial<PurchaseOrder> = {
                supplierId,
                supplierName: supplier?.name || 'Unknown',
                // If it's already ordered or received, keep it. If we are placing it, set to ordered. Else draft.
                status: (po && (po.status === 'ordered' || po.status === 'received')) ? po.status : status as any,
                items: lineItems.map(i => ({
                    itemId: i.itemId,
                    name: i.description,
                    unit: i.unit || 'units',
                    quantity: i.quantity,
                    unitCost: i.unitCost,
                    totalCost: i.totalCost
                })),
                totalAmount: calculateGrandTotal(),
                expectedDeliveryDate: expectedDate ? new Date(expectedDate) as any : null,
                notes
            };

            if (po) {
                await updatePurchaseOrder(po.id, poData);
                showToast(status === 'ordered' ? "Order Placed Successfully" : "Purchase Order updated", "success");
            } else {
                await createPurchaseOrder(poData);
                showToast(status === 'ordered' ? "Order Placed Successfully" : "Purchase Order created", "success");
            }
            onSave();
            onClose();
        } catch (error) {
            console.error(error);
            showToast("Failed to save Purchase Order", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Drawer
            isOpen={isOpen}
            onClose={onClose}
            title={po ? (readonly ? `View Bill: ${po.poNumber}` : `Edit PO: ${po.poNumber}`) : 'New Purchase Order'}
            size="2xl"
            footer={
                <div className="flex justify-between items-center w-full">
                    <div className="text-lg font-bold text-gray-900">
                        Total: <span className="text-[#FF6A00]">${calculateGrandTotal().toFixed(2)}</span>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            type="button"
                            className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                        >
                            Close
                        </button>
                        {po && (
                            <button
                                onClick={handlePrint}
                                type="button"
                                className="px-5 py-2.5 bg-white text-gray-700 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
                            >
                                <PrinterIcon className="w-5 h-5" />
                                <span className="hidden sm:inline">Print</span>
                            </button>
                        )}

                        {/* Mark Paid Button (Only in Readonly mode if not paid) */}
                        {readonly && po && !po.paymentMethod && onMarkPaid && (
                            <button
                                onClick={() => onMarkPaid(po.id)}
                                className="px-5 py-2.5 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition-colors shadow-sm"
                            >
                                Mark as Paid
                            </button>
                        )}

                        {/* Save Buttons (Hidden in Readonly) */}
                        {!readonly && (
                            <>
                                {(!po || po.status === 'draft') && (
                                    <button
                                        onClick={() => handleSave('draft')}
                                        disabled={isSubmitting}
                                        className="px-5 py-2.5 bg-gray-100 text-gray-700 border border-gray-300 rounded-lg font-bold hover:bg-gray-200 transition-colors shadow-sm disabled:opacity-50"
                                    >
                                        {isSubmitting ? 'Saving...' : 'Save Draft'}
                                    </button>
                                )}

                                <button
                                    onClick={() => handleSave(po && po.status !== 'draft' ? po.status : 'ordered')}
                                    disabled={isSubmitting}
                                    className="px-6 py-2.5 bg-[#FF6A00] text-white rounded-lg font-bold hover:bg-[#FF6A00]/90 transition-colors shadow-sm disabled:opacity-50"
                                >
                                    {isSubmitting ? 'Processing...' : (
                                        po && po.status !== 'draft' ? 'Update Order' : 'Place Order'
                                    )}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            }
        >
            <form className="space-y-8">
                {/* Supplier & Details */}
                <div className="bg-gray-50 p-5 rounded-xl border border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-1.5">Supplier</label>
                        <select
                            disabled={readonly}
                            value={supplierId}
                            onChange={(e) => {
                                setSupplierId(e.target.value);
                                if (errors.supplierId) {
                                    const newErrors = { ...errors };
                                    delete newErrors.supplierId;
                                    setErrors(newErrors);
                                }
                            }}
                            className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#FF6A00]/20 focus:border-[#FF6A00] bg-white transition-all shadow-sm ${errors.supplierId ? 'border-red-500' : 'border-gray-200'} ${readonly ? 'bg-gray-100 text-gray-500' : ''}`}
                        >
                            <option value="">Select Supplier...</option>
                            {suppliers.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                        {errors.supplierId && <p className="text-xs text-red-500 mt-1">{errors.supplierId}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-1.5">Expected Delivery</label>
                        <input
                            disabled={readonly}
                            type="date"
                            value={expectedDate}
                            onChange={(e) => setExpectedDate(e.target.value)}
                            className={`w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FF6A00]/20 focus:border-[#FF6A00] bg-white transition-all shadow-sm ${readonly ? 'bg-gray-100 text-gray-500' : ''}`}
                        />
                    </div>
                    <div className="col-span-1 md:col-span-2">
                        <label className="block text-sm font-semibold text-gray-900 mb-1.5">Notes</label>
                        <textarea
                            disabled={readonly}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={2}
                            placeholder="Delivery instructions, reference numbers, etc."
                            className={`w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FF6A00]/20 focus:border-[#FF6A00] outline-none transition-all shadow-sm resize-none ${readonly ? 'bg-gray-100 text-gray-500' : ''}`}
                        />
                    </div>
                </div>

                {/* Line Items */}
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Order Items</h3>
                        {!readonly && (
                            <button
                                type="button"
                                onClick={handleAddItem}
                                className="text-xs flex items-center gap-1 bg-gray-900 text-white px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-colors"
                            >
                                <PlusIcon className="w-4 h-4" />
                                Add Item
                            </button>
                        )}
                    </div>
                    {errors.lineItems && <p className="text-xs text-red-500 mb-2">{errors.lineItems}</p>}

                    <div className="space-y-3">
                        {lineItems.length === 0 ? (
                            <div className="text-center py-12 bg-gray-50 border border-dashed border-gray-300 rounded-xl text-gray-400">
                                <CalculatorIcon className="w-10 h-10 mx-auto mb-2 opacity-50" />
                                <p>No items added yet.</p>
                                {!readonly && (
                                    <button type="button" onClick={handleAddItem} className="text-[#FF6A00] font-bold text-sm hover:underline mt-2">Add your first item</button>
                                )}
                            </div>
                        ) : (
                            lineItems.map((item, index) => (
                                <div key={index} className="flex flex-col md:flex-row gap-3 items-start md:items-center bg-white p-3 rounded-xl border border-gray-100 shadow-sm transition-all hover:border-gray-300">
                                    <div className="flex-1 w-full">
                                        <select
                                            disabled={readonly}
                                            value={item.itemId}
                                            onChange={(e) => handleUpdateItem(index, 'itemId', e.target.value)}
                                            className={`w-full text-sm px-3 py-2 border rounded-lg focus:ring-1 focus:ring-[#FF6A00] focus:border-[#FF6A00] ${errors[`items.${index}.itemId`] ? 'border-red-500' : 'border-gray-200'} ${readonly ? 'bg-gray-100' : ''}`}
                                        >
                                            <option value="">Select Item...</option>
                                            {inventoryItems.map(inv => (
                                                <option key={inv.id} value={inv.id}>{inv.name} (Current: {inv.currentStock})</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="w-24">
                                        <input
                                            disabled={readonly}
                                            type="number"
                                            min="1"
                                            placeholder="Qty"
                                            value={item.quantity}
                                            onChange={(e) => handleUpdateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                                            className={`w-full text-sm px-3 py-2 border rounded-lg focus:ring-1 focus:ring-[#FF6A00] focus:border-[#FF6A00] text-center font-semibold ${errors[`items.${index}.quantity`] ? 'border-red-500' : 'border-gray-200'} ${readonly ? 'bg-gray-100' : ''}`}
                                        />
                                    </div>
                                    <div className="w-28 relative">
                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                                        <input
                                            disabled={readonly}
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            placeholder="Cost"
                                            value={item.unitCost}
                                            onChange={(e) => handleUpdateItem(index, 'unitCost', parseFloat(e.target.value) || 0)}
                                            className={`w-full text-sm pl-5 pr-2 py-2 border rounded-lg focus:ring-1 focus:ring-[#FF6A00] focus:border-[#FF6A00] ${errors[`items.${index}.unitCost`] ? 'border-red-500' : 'border-gray-200'} ${readonly ? 'bg-gray-100' : ''}`}
                                        />
                                    </div>
                                    <div className="w-24 text-right font-bold text-gray-700 text-sm">
                                        ${item.totalCost.toFixed(2)}
                                    </div>
                                    {!readonly && (
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveItem(index)}
                                            className="text-gray-400 hover:text-red-500 p-1 rounded-md hover:bg-red-50 transition-colors"
                                        >
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </form>
        </Drawer>
    );
}
