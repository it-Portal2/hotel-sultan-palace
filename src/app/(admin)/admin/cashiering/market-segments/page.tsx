"use client";

import React from 'react';
import MasterDataManagement from '@/components/admin/cashiering/MasterDataManagement';

export default function MarketSegmentsPage() {
    return (
        <MasterDataManagement
            title="Market Segments"
            collectionName="marketSegments"
            columns={[
                { key: 'name', label: 'Segment Name' },
                { key: 'code', label: 'Code' },
                { key: 'description', label: 'Description' },
                { key: 'isActive', label: 'Status', type: 'boolean' }
            ]}
            formFields={[
                { key: 'name', label: 'Segment Name', type: 'text', required: true },
                { key: 'code', label: 'Code (e.g. CRP)', type: 'text', required: true },
                { key: 'description', label: 'Description', type: 'textarea' },
                { key: 'isActive', label: 'Active', type: 'checkbox' }
            ]}
        />
    );
}
