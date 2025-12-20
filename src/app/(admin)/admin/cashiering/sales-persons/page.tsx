"use client";

import React from 'react';
import MasterDataManagement from '@/components/admin/cashiering/MasterDataManagement';

export default function SalesPersonsPage() {
    return (
        <MasterDataManagement
            title="Sales Persons"
            collectionName="salesPersons"
            columns={[
                { key: 'name', label: 'Name' },
                { key: 'email', label: 'Email', type: 'email' },
                { key: 'phone', label: 'Phone', type: 'phone' },
                { key: 'isActive', label: 'Status', type: 'boolean' }
            ]}
            formFields={[
                { key: 'name', label: 'Full Name', type: 'text', required: true },
                { key: 'email', label: 'Email', type: 'email', required: true },
                { key: 'phone', label: 'Phone', type: 'tel' },
                { key: 'isActive', label: 'Active', type: 'checkbox' }
            ]}
        />
    );
}
