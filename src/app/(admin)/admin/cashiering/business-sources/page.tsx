"use client";

import React from 'react';
import MasterDataManagement from '@/components/admin/cashiering/MasterDataManagement';

export default function BusinessSourcesPage() {
    return (
        <MasterDataManagement
            title="Business Sources"
            collectionName="businessSources"
            columns={[
                { key: 'name', label: 'Source Name' },
                { key: 'code', label: 'Code' },
                { key: 'description', label: 'Description' },
                { key: 'isActive', label: 'Status', type: 'boolean' }
            ]}
            formFields={[
                { key: 'name', label: 'Source Name', type: 'text', required: true },
                { key: 'code', label: 'Code (e.g. OTA)', type: 'text', required: true },
                { key: 'description', label: 'Description', type: 'textarea' },
                { key: 'isActive', label: 'Active', type: 'checkbox' }
            ]}
        />
    );
}
