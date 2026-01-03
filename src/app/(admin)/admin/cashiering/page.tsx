"use client";

import React, { useState } from 'react';
import MasterDataManagement from '@/components/admin/cashiering/MasterDataManagement';
import {
    BriefcaseIcon,
    BuildingOfficeIcon,
    GlobeAltIcon,
    UserGroupIcon,
    UsersIcon,
    TicketIcon
} from '@heroicons/react/24/outline';

export default function CashieringPage() {
    const [activeTab, setActiveTab] = useState<'business-sources' | 'companies' | 'market-segments' | 'sales-persons' | 'travel-agents'>('business-sources');

    const tabs = [
        { id: 'business-sources', label: 'Business Sources', icon: BriefcaseIcon },
        { id: 'companies', label: 'Companies', icon: BuildingOfficeIcon },
        { id: 'market-segments', label: 'Market Segments', icon: GlobeAltIcon },
        { id: 'sales-persons', label: 'Sales Persons', icon: UserGroupIcon },
        { id: 'travel-agents', label: 'Travel Agents', icon: TicketIcon },
    ];

    return (
        <div className="space-y-6 pb-20 p-6 max-w-[1600px] mx-auto animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Cashiering Settings</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage master data and configurations for cashiering operations.</p>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-1 flex overflow-x-auto gap-1">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${isActive
                                ? 'bg-gray-900 text-white shadow-md'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                        >
                            <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Tab Content */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 min-h-[600px]">
                {activeTab === 'business-sources' && (
                    <MasterDataManagement
                        title="Business Sources"
                        collectionName="businessSources" // Collection in Firestore
                        columns={[
                            { key: 'code', label: 'Source Code' },
                            { key: 'name', label: 'Source Name' },
                            { key: 'description', label: 'Description' },
                            { key: 'isActive', label: 'Status', type: 'boolean' }
                        ]}
                        formFields={[
                            { key: 'code', label: 'Code', type: 'text', required: true },
                            { key: 'name', label: 'Name', type: 'text', required: true },
                            { key: 'description', label: 'Description', type: 'textarea', required: false },
                            { key: 'isActive', label: 'Active', type: 'checkbox', required: false }
                        ]}
                    />
                )}

                {activeTab === 'companies' && (
                    <MasterDataManagement
                        title="Companies"
                        collectionName="companies"
                        columns={[
                            { key: 'name', label: 'Company Name' },
                            { key: 'contactPerson', label: 'Contact Person' },
                            { key: 'email', label: 'Email' },
                            { key: 'phone', label: 'Phone' },
                            { key: 'isActive', label: 'Status', type: 'boolean' }
                        ]}
                        formFields={[
                            { key: 'name', label: 'Company Name', type: 'text', required: true },
                            { key: 'contactPerson', label: 'Contact Person', type: 'text', required: true },
                            { key: 'email', label: 'Email', type: 'email', required: true },
                            { key: 'phone', label: 'Phone', type: 'tel', required: true },
                            { key: 'address', label: 'Address', type: 'textarea', required: false },
                            { key: 'taxId', label: 'Tax ID / GST', type: 'text', required: false },
                            { key: 'isActive', label: 'Active', type: 'checkbox', required: false }
                        ]}
                    />
                )}

                {activeTab === 'market-segments' && (
                    <MasterDataManagement
                        title="Market Segments"
                        collectionName="marketSegments"
                        columns={[
                            { key: 'code', label: 'Segment Code' },
                            { key: 'name', label: 'Segment Name' },
                            { key: 'description', label: 'Description' },
                            { key: 'isActive', label: 'Status', type: 'boolean' }
                        ]}
                        formFields={[
                            { key: 'code', label: 'Code', type: 'text', required: true },
                            { key: 'name', label: 'Name', type: 'text', required: true },
                            { key: 'description', label: 'Description', type: 'textarea', required: false },
                            { key: 'isActive', label: 'Active', type: 'checkbox', required: false }
                        ]}
                    />
                )}

                {activeTab === 'sales-persons' && (
                    <MasterDataManagement
                        title="Sales Persons"
                        collectionName="salesPersons"
                        columns={[
                            { key: 'name', label: 'Name' },
                            { key: 'email', label: 'Email' },
                            { key: 'phone', label: 'Phone' },
                            { key: 'target', label: 'Target', type: 'currency' },
                            { key: 'isActive', label: 'Status', type: 'boolean' }
                        ]}
                        formFields={[
                            { key: 'name', label: 'Name', type: 'text', required: true },
                            { key: 'email', label: 'Email', type: 'email', required: true },
                            { key: 'phone', label: 'Phone', type: 'tel', required: true },
                            { key: 'target', label: 'Sales Target ($)', type: 'number', required: false },
                            { key: 'isActive', label: 'Active', type: 'checkbox', required: false }
                        ]}
                    />
                )}

                {activeTab === 'travel-agents' && (
                    <MasterDataManagement
                        title="Travel Agents"
                        collectionName="travelAgents"
                        columns={[
                            { key: 'name', label: 'Agent Name' },
                            { key: 'contactPerson', label: 'Contact' },
                            { key: 'commissionRate', label: 'Commission (%)' },
                            { key: 'email', label: 'Email' },
                            { key: 'isActive', label: 'Status', type: 'boolean' }
                        ]}
                        formFields={[
                            { key: 'name', label: 'Agency Name', type: 'text', required: true },
                            { key: 'contactPerson', label: 'Contact Person', type: 'text', required: true },
                            { key: 'email', label: 'Email', type: 'email', required: true },
                            { key: 'phone', label: 'Phone', type: 'tel', required: true },
                            { key: 'commissionRate', label: 'Commission Rate (%)', type: 'number', required: true },
                            { key: 'isActive', label: 'Active', type: 'checkbox', required: false }
                        ]}
                    />
                )}
            </div>
        </div>
    );
}
