"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    BuildingOfficeIcon,
    UserGroupIcon,
    TicketIcon,
    CreditCardIcon
} from '@heroicons/react/24/outline';
import Companies from '@/components/admin/cashiering/Companies';
import SalesPersons from '@/components/admin/cashiering/SalesPersons';
import TravelAgents from '@/components/admin/cashiering/TravelAgents';
import IncidentalInvoices from '@/components/admin/cashiering/IncidentalInvoices';

export default function CashieringPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentTab = searchParams.get('tab') as 'companies' | 'sales-persons' | 'travel-agents' | 'pos' | null;
    const [activeTab, setActiveTab] = useState<'companies' | 'sales-persons' | 'travel-agents' | 'pos'>('companies');

    useEffect(() => {
        if (currentTab) {
            setActiveTab(currentTab);
        }
    }, [currentTab]);

    const handleTabChange = (tabId: 'companies' | 'sales-persons' | 'travel-agents' | 'pos') => {
        setActiveTab(tabId);
        router.push(`/admin/cashiering?tab=${tabId}`);
    };

    const tabs = [
        { id: 'companies', label: 'Company Database', icon: BuildingOfficeIcon },
        { id: 'sales-persons', label: 'Sales Person Database', icon: UserGroupIcon },
        { id: 'travel-agents', label: 'Travel Agent Database', icon: TicketIcon },
        { id: 'pos', label: 'Point of Sale (Incidental)', icon: CreditCardIcon },
    ];

    return (
        <div className="h-full w-full bg-gray-50 animate-fade-in">
            {activeTab === 'companies' && <Companies />}
            {activeTab === 'sales-persons' && <SalesPersons />}
            {activeTab === 'travel-agents' && <TravelAgents />}
            {activeTab === 'pos' && <IncidentalInvoices />}
        </div>
    );
}
