"use client";

import React, { useState } from 'react';
import { LockClosedIcon } from '@heroicons/react/24/solid';
import { useToast } from '@/context/ToastContext';

interface RestrictedActionProps {
  children: React.ReactNode;

  /** The message to display in toast/tooltip when access is denied */
  message?: string;

  /** 
   * 'hide': The content is completely removed from DOM
   * 'disable': The content is rendered but disabled (opacity reduced, pointer-events-none)
   * 'lock': The content is visible but overlaid with a lock icon and blocked
   */
  variant?: 'hide' | 'disable' | 'lock';

  /** Additional classes */
  className?: string;

  /** Whether the user HAS access (if true, children render normally) */
  hasAccess?: boolean; // Optional prop to invert logic if convenient, though usually handled by parent conditional
}

export default function RestrictedAction({
  children,
  message = "You don't have permission to perform this action.",
  variant = 'lock',
  className = "",
  hasAccess = false // Default to false so it blocks by default if used
}: RestrictedActionProps) {
  const { showToast } = useToast();
  const [isHovered, setIsHovered] = useState(false);

  // If access is granted, just render the children
  // Note: Usually parents use this component like: <RestrictedAction> <Button /> </RestrictedAction> 
  // ONLY when they know access is blocked. 
  // Or they pass `hasAccess={check()}`. 
  if (hasAccess) {
    return <>{children}</>;
  }

  if (variant === 'hide') {
    return null;
  }

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    showToast(message, 'error');
  };

  if (variant === 'lock') {
    return (
      <div
        className={`relative inline-flex items-center justify-center group ${className}`}
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Dim the content */}
        <div className="opacity-50 pointer-events-none grayscale select-none">
          {children}
        </div>

        {/* Lock Overlay */}
        <div className="absolute inset-0 flex items-center justify-center cursor-not-allowed z-10 transition-all duration-200">
          <div className={`p-2 rounded-full bg-gray-900/80 text-white shadow-lg backdrop-blur-sm transform transition-transform ${isHovered ? 'scale-110' : 'scale-100'}`}>
            <LockClosedIcon className="h-4 w-4" />
          </div>
        </div>
      </div>
    );
  }

  // Variant = 'disable' (Classic Tooltip behavior)
  return (
    <div
      className={`relative inline-block cursor-not-allowed opacity-60 ${className}`}
      onClick={handleClick}
    >
      <div className="pointer-events-none">
        {children}
      </div>
    </div>
  );
}


