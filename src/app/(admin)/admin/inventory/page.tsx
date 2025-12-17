"use client";

import React, { useState, useEffect } from 'react';
import { getInventoryItems } from '@/lib/inventoryService';
import type { InventoryItem } from '@/lib/firestoreService';
import InventoryOverviewTab from '@/components/admin/inventory/InventoryOverviewTab';
import InventoryItemsTab from '@/components/admin/inventory/InventoryItemsTab';
import StockAdjustmentsTab from '@/components/admin/inventory/StockAdjustmentsTab';
import InventoryReportsTab from '@/components/admin/inventory/InventoryReportsTab';
import PurchaseOrdersPage from './purchase-orders/page';
import SuppliersPage from './suppliers/page';
import {
    Squares2X2Icon,
    ListBulletIcon,
    ShoppingCartIcon,
    TruckIcon,
    ClipboardDocumentListIcon,
    ChartBarIcon
} from '@heroicons/react/24/outline';

const TABS = [
    { id: 'overview', label: 'Overview', icon: Squares2X2Icon },
    { id: 'items', label: 'Items', icon: ListBulletIcon },
    { id: 'purchase_orders', label: 'Purchase Orders', icon: ShoppingCartIcon },
    { id: 'suppliers', label: 'Suppliers', icon: TruckIcon },
    { id: 'adjustments', label: 'Adjustments', icon: ClipboardDocumentListIcon },
    { id: 'reports', label: 'Reports', icon: ChartBarIcon }
] as const;

type TabId = typeof TABS[number]['id'];

export default function InventoryDashboard() {
    const [activeTab, setActiveTab] = useState<TabId>('overview');
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await getInventoryItems();
            setItems(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'overview':
                return <InventoryOverviewTab items={items} loading={loading} onNavigateToItems={() => setActiveTab('items')} />;
            case 'items':
                return <InventoryItemsTab items={items} loading={loading} onRefresh={loadData} />;
            case 'purchase_orders':
                return <PurchaseOrdersPage />;
            case 'suppliers':
                return <SuppliersPage />;
            case 'adjustments':
                return <StockAdjustmentsTab items={items} onRefresh={loadData} />;
            case 'reports':
                return <InventoryReportsTab />;
            default:
                return null;
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Tabs & Header Compact Layout */}
            {/* Tabs & Header - Clean Tab Strip */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="flex flex-col sm:flex-row justify-between items-center px-4 sm:px-6 lg:px-8">
                    {/* Tabs */}
                    <div className="flex overflow-x-auto gap-8 w-full sm:w-auto no-scrollbar">
                        {TABS.map(tab => {
                            const isActive = activeTab === tab.id;
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`group inline-flex items-center py-4 border-b-2 text-sm font-medium whitespace-nowrap transition-colors ${isActive
                                        ? 'border-[#FF6A00] text-[#FF6A00]'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                >
                                    <Icon className={`-ml-0.5 mr-2 h-5 w-5 ${isActive ? 'text-[#FF6A00]' : 'text-gray-400 group-hover:text-gray-500'}`} />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Tab Content */}
            <div className="min-h-[500px]">
                {renderContent()}
            </div>
        </div>
    );
}
