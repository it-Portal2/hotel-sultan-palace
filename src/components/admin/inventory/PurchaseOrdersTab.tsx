import React, { useState, useEffect } from 'react';
import type { PurchaseOrder, Supplier, InventoryItem } from '@/lib/firestoreService';
import { getAllPurchaseOrders, getSuppliers, deletePurchaseOrder, getInventoryItems } from '@/lib/inventoryService';
import PurchaseOrderDrawer from './PurchaseOrderDrawer';
import ReceivePurchaseOrderModal from './ReceivePurchaseOrderModal';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { PlusIcon, FunnelIcon, MagnifyingGlassIcon, TrashIcon, CheckCircleIcon, PencilIcon, TruckIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { useToast } from '@/context/ToastContext';

interface PurchaseOrdersTabProps {
    // items passed from parent if available, else we fetch
    loading?: boolean;
    onRefresh?: () => void;
}

export default function PurchaseOrdersTab() {
    const { showToast } = useToast();
    const [orders, setOrders] = useState<PurchaseOrder[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'ordered' | 'received'>('all'); // Basic filtering

    // Modal States
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [confirmReceiveId, setConfirmReceiveId] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [poData, supplierData, itemData] = await Promise.all([
                getAllPurchaseOrders(),
                getSuppliers(),
                getInventoryItems()
            ]);
            setOrders(poData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
            setSuppliers(supplierData);
            setInventoryItems(itemData);
        } catch (error) {
            console.error(error);
            showToast("Failed to load purchase orders", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirmDeleteId) return;
        try {
            await deletePurchaseOrder(confirmDeleteId);
            showToast("Purchase Order deleted", "success");
            loadData();
        } catch (error) {
            console.error(error);
            showToast("Failed to delete order", "error");
        } finally {
            setConfirmDeleteId(null);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'draft': return 'bg-gray-100 text-gray-600';
            case 'ordered': return 'bg-blue-100 text-blue-700';
            case 'received': return 'bg-green-100 text-green-700';
            case 'cancelled': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-600';
        }
    };

    const filteredOrders = orders.filter(order => {
        const matchesSearch =
            order.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.supplierName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    if (loading) return <div className="text-center py-12 text-gray-500">Loading orders...</div>;

    return (
        <div className="flex flex-col h-[calc(100vh-140px)] gap-4">
            {/* Top Bar */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex gap-2">
                    {['all', 'draft', 'ordered', 'received'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status as any)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${statusFilter === status
                                ? 'bg-[#FF6A00] text-white shadow-sm'
                                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                                }`}
                        >
                            {status}
                        </button>
                    ))}
                </div>

                <div className="flex w-full md:w-auto gap-3">
                    <div className="relative flex-1 md:w-64">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search PO # or Supplier..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#FF6A00] transition-all"
                        />
                    </div>
                    <button
                        onClick={() => { setSelectedOrder(null); setIsDrawerOpen(true); }}
                        className="flex items-center gap-2 px-4 py-2 bg-[#FF6A00] text-white rounded-lg hover:bg-[#FF6A00]/90 transition-transform active:scale-95 font-bold text-sm shadow-sm whitespace-nowrap"
                    >
                        <PlusIcon className="w-5 h-5" />
                        <span className="hidden sm:inline">New Order</span>
                    </button>
                </div>
            </div>

            {/* Orders List */}
            <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-[#F9FAFB]">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">PO Number</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Supplier</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Items / Total</th>
                                <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                            {filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-20 text-center text-gray-500">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="p-4 bg-gray-50 rounded-full">
                                                <TruckIcon className="h-8 w-8 text-gray-300" />
                                            </div>
                                            <p className="font-semibold text-lg text-gray-900">No orders found</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredOrders.map((po) => (
                                    <tr key={po.id} className="hover:bg-gray-50 transition-colors group">
                                        <td className="px-6 py-4 font-mono text-sm font-bold text-gray-900">
                                            {po.poNumber}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-gray-900">{po.supplierName}</div>
                                            {po.notes && <div className="text-xs text-gray-400 truncate max-w-[200px]">{po.notes}</div>}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {po.createdAt.toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm">
                                                <span className="font-bold text-gray-900">{po.items.length} Items</span>
                                                <span className="text-gray-400 mx-2">|</span>
                                                <span className="font-mono text-gray-700">${po.totalAmount.toFixed(2)}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${getStatusColor(po.status)}`}>
                                                {po.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end gap-2">
                                                {po.status !== 'received' && (
                                                    <>
                                                        <button
                                                            onClick={() => setConfirmReceiveId(po.id)}
                                                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                            title="Receive Order"
                                                        >
                                                            <CheckCircleIcon className="w-5 h-5" />
                                                        </button>
                                                        <button
                                                            onClick={() => { setSelectedOrder(po); setIsDrawerOpen(true); }}
                                                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                            title="Edit Order"
                                                        >
                                                            <PencilIcon className="w-5 h-5" />
                                                        </button>
                                                        <button
                                                            onClick={() => setConfirmDeleteId(po.id)}
                                                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Delete Order"
                                                        >
                                                            <TrashIcon className="w-5 h-5" />
                                                        </button>
                                                    </>
                                                )}
                                                {po.status === 'received' && (
                                                    <div className="flex items-center gap-2">
                                                        {po.invoiceUrl && (
                                                            <button
                                                                onClick={() => window.open(po.invoiceUrl, '_blank')}
                                                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                                title="View Invoice"
                                                            >
                                                                <DocumentTextIcon className="w-5 h-5" />
                                                            </button>
                                                        )}
                                                        <span className="text-xs text-gray-400 italic pr-2">Received</span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <PurchaseOrderDrawer
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                onSave={loadData}
                po={selectedOrder}
                suppliers={suppliers}
                inventoryItems={inventoryItems}
            />

            <ReceivePurchaseOrderModal
                isOpen={!!confirmReceiveId}
                onClose={() => setConfirmReceiveId(null)}
                po={orders.find(o => o.id === confirmReceiveId) || null}
                onSuccess={() => {
                    loadData();
                    setConfirmReceiveId(null);
                }}
            />

            <ConfirmationModal
                isOpen={!!confirmDeleteId}
                onClose={() => setConfirmDeleteId(null)}
                onConfirm={handleDelete}
                title="Delete Purchase Order"
                message="Are you sure you want to delete this order? This cannot be undone."
                confirmText="Delete Order"
                cancelText="Keep Order"
            />
        </div>
    );
}
