"use client";

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { getInventoryItems } from '@/lib/inventoryService';
import type { InventoryItem } from '@/lib/firestoreService';
import InventoryOverviewTab from '@/components/admin/inventory/InventoryOverviewTab';
import InventoryItemsTab from '@/components/admin/inventory/InventoryItemsTab';
import StockAdjustmentsTab from '@/components/admin/inventory/StockAdjustmentsTab';
import InventoryReportsTab from '@/components/admin/inventory/InventoryReportsTab';
import PurchaseOrdersTab from '@/components/admin/inventory/PurchaseOrdersTab';
import SuppliersTab from '@/components/admin/inventory/SuppliersTab';
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
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    // Get initial tab from URL or default to overview
    const currentTab = searchParams.get('tab') as TabId || 'overview';

    // We keep local state to allow fast switching, but we sync it with URL
    const [activeTab, setActiveTabState] = useState<TabId>(currentTab);
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);

    // Sync state with URL changes (e.g. back button)
    useEffect(() => {
        if (currentTab && TABS.some(t => t.id === currentTab)) {
            setActiveTabState(currentTab);
        } else {
            setActiveTabState('overview');
        }
    }, [currentTab]);

    const handleTabChange = (tabId: TabId) => {
        // Optimistic update
        setActiveTabState(tabId);
        const params = new URLSearchParams(searchParams.toString());
        params.set('tab', tabId);
        router.push(`${pathname}?${params.toString()}`);
    };

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

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Tab Content */}
            <div className="min-h-[500px]">
                {renderContent()}
            </div>
        </div>
    );
}
