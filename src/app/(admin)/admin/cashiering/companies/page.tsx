"use client";

import React from 'react';
import MasterDataManagement from '@/components/admin/cashiering/MasterDataManagement';

export default function CompaniesPage() {
    return (
        <MasterDataManagement
            title="Companies"
            collectionName="companies"
            columns={[
                { key: 'name', label: 'Company Name' },
                { key: 'email', label: 'Email', type: 'email' },
                { key: 'contactPerson', label: 'Contact Person' },
                { key: 'creditLimit', label: 'Credit Limit', type: 'currency' },
                { key: 'isActive', label: 'Status', type: 'boolean' }
            ]}
            formFields={[
                { key: 'name', label: 'Company Name', type: 'text', required: true },
                { key: 'email', label: 'Email', type: 'email' },
                { key: 'phone', label: 'Phone', type: 'tel' },
                { key: 'contactPerson', label: 'Contact Person', type: 'text' },
                { key: 'taxId', label: 'Tax ID (VAT/GST)', type: 'text' },
                { key: 'creditLimit', label: 'Credit Limit', type: 'number' },
                { key: 'address', label: 'Address', type: 'textarea' },
                { key: 'isActive', label: 'Active', type: 'checkbox' }
            ]}
        />
    );
}
