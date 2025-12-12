"use client";

import React, { useState } from 'react';
import { InformationCircleIcon } from '@heroicons/react/24/outline';

interface RestrictedActionProps {
  children: React.ReactNode;
  message?: string;
  className?: string;
}

export default function RestrictedAction({ 
  children, 
  message = "You don't have access to perform this action",
  className = ""
}: RestrictedActionProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div 
      className={`relative inline-block ${className}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div className="opacity-60 pointer-events-none">
        {children}
      </div>
      {showTooltip && (
        <div className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg whitespace-nowrap">
          <div className="flex items-center gap-2">
            <InformationCircleIcon className="h-4 w-4" />
            <span>{message}</span>
          </div>
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
            <div className="border-4 border-transparent border-t-gray-900"></div>
          </div>
        </div>
      )}
    </div>
  );
}

