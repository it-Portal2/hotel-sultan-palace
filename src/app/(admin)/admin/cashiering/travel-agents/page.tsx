"use client";

import React from 'react';
import MasterDataManagement from '@/components/admin/cashiering/MasterDataManagement';

export default function TravelAgentsPage() {
    return (
        <MasterDataManagement
            title="Travel Agents"
            collectionName="travelAgents"
            columns={[
                { key: 'name', label: 'Agency Name' },
                { key: 'email', label: 'Email', type: 'email' },
                { key: 'phone', label: 'Phone', type: 'phone' },
                { key: 'commissionRate', label: 'Commission (%)' },
                { key: 'isActive', label: 'Status', type: 'boolean' }
            ]}
            formFields={[
                { key: 'name', label: 'Agency Name', type: 'text', required: true },
                { key: 'email', label: 'Email', type: 'email' },
                { key: 'phone', label: 'Phone', type: 'tel' },
                { key: 'commissionRate', label: 'Commission Rate (%)', type: 'number' },
                { key: 'contactPerson', label: 'Contact Person', type: 'text' },
                { key: 'address', label: 'Address', type: 'textarea' },
                { key: 'isActive', label: 'Active', type: 'checkbox' }
            ]}
        />
    );
}
