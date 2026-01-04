"use client";


import React from 'react';
import PremiumLoader from '@/components/ui/PremiumLoader';
import { useAdminRole } from '@/context/AdminRoleContext';
import RoomViewGrid from '@/components/admin/front-desk/RoomViewGrid';

export default function FrontDeskPage() {
  const { isReadOnly } = useAdminRole();

  // The "Room View" is now the primary and only view for Front Desk.
  // Legacy "Table View" and "Stats" found in FrontDeskTable.tsx have been deprecated.

  return (
    <div className="flex-1 min-h-0 relative overflow-y-auto overflow-x-hidden">
      <div className="p-2 md:p-6 pb-20">
        <React.Suspense fallback={<div className="h-full flex items-center justify-center min-h-[50vh]"><PremiumLoader /></div>}>
          <RoomViewGrid isReadOnly={isReadOnly} />
        </React.Suspense>
      </div>
    </div>
  );
}
