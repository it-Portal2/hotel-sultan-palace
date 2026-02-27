"use client";

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import {
    getInventoryItems,
    seedDefaultLocations,
    seedDefaultDepartments,
    cleanupDuplicates,
    InventoryItem
} from '@/lib/inventoryService';

// Import Tab Components
import InventoryOverviewTab from '@/components/admin/inventory/InventoryOverviewTab';
import InventoryItemsTab from '@/components/admin/inventory/InventoryItemsTab';
import PurchaseOrdersTab from '@/components/admin/inventory/PurchaseOrdersTab';
import SuppliersTab from '@/components/admin/inventory/SuppliersTab';
import StockAdjustmentsTab from '@/components/admin/inventory/StockAdjustmentsTab';
import InventoryReportsTab from '@/components/admin/inventory/InventoryReportsTab';

export default function InventoryPage() {
    // URL State Sync
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    // Component State
    const [activeTab, setActiveTab] = useState('overview');
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);

    // Sync tab with URL
    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab) {
            setActiveTab(tab);
        }
    }, [searchParams]);

    const handleTabChange = (tab: string) => {
        setActiveTab(tab);
        const params = new URLSearchParams(searchParams.toString());
        params.set('tab', tab);
        router.push(`${pathname}?${params.toString()}`);
    };

    const loadData = async () => {
        setLoading(true);
        try {
            // Ensure defaults exist (idempotent) & Cleanup duplicates
            await Promise.all([
                seedDefaultLocations(),
                seedDefaultDepartments(),
                cleanupDuplicates() // Remove duplicate "Main Store" etc.
            ]);

            const data = await getInventoryItems();
            setItems(data);
        } catch (error) {
            console.error("Failed to load inventory data:", error);
        } finally {
            setLoading(false);
        }
    };

    // Initial Load
    useEffect(() => {
        loadData();
    }, []);

    const renderContent = () => {
        switch (activeTab) {
            case 'overview':
                return <InventoryOverviewTab items={items} loading={loading} onNavigateToItems={() => handleTabChange('items')} />;
            case 'items':
                return <InventoryItemsTab items={items} loading={loading} onRefresh={loadData} />;
            case 'purchase_orders':
                return <PurchaseOrdersTab />;
            case 'suppliers':
                return <SuppliersTab />;
            case 'adjustments':
                return <StockAdjustmentsTab initialItems={items} onRefresh={loadData} />;
            case 'reports':
                return <InventoryReportsTab />;
            default:
                return null;
        }
    };

    const tabs = [
        { id: 'overview', label: 'Overview' },
        { id: 'items', label: 'Items' },
        { id: 'purchase_orders', label: 'Purchase Orders' },
        { id: 'suppliers', label: 'Suppliers' },
        { id: 'adjustments', label: 'Stock Adjustments' },
        { id: 'reports', label: 'Reports' },
    ];

    return (
        <div className="space-y-6 animate-fade-in p-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-black">
                    Inventory Management
                </h1>
                <p className="text-gray-700 dark:text-gray-500">
                    Manage stock, suppliers, and purchase orders.
                </p>
            </div>

            {/* Content Area */}
            <div className="min-h-[500px]">
                {renderContent()}
            </div>
        </div>
    );
}
