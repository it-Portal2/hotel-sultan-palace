import React, { useEffect, useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface DrawerProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
    footer?: React.ReactNode;
}

export default function Drawer({ isOpen, onClose, title, children, size = 'md', footer }: DrawerProps) {
    const [isVisible, setIsVisible] = useState(false);

    // Handle animation timing
    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
            document.body.style.overflow = 'hidden';
        } else {
            const timer = setTimeout(() => {
                setIsVisible(false);
                document.body.style.overflow = 'unset';
            }, 300); // Match transition duration
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isVisible && !isOpen) return null;

    const sizeClass = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        '2xl': 'max-w-2xl',
        'full': 'max-w-full',
    }[size];

    return (
        <div className="relative z-50" aria-labelledby="slide-over-title" role="dialog" aria-modal="true">
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity duration-300 ease-in-out ${isOpen ? 'opacity-100' : 'opacity-0'
                    }`}
                onClick={onClose}
            />

            <div className="fixed inset-0 overflow-hidden">
                <div className="absolute inset-0 overflow-hidden">
                    <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
                        <div
                            className={`pointer-events-auto w-screen ${sizeClass} transform transition duration-300 ease-in-out sm:duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'
                                }`}
                        >
                            <div className="flex h-full flex-col overflow-y-scroll bg-white shadow-2xl">
                                {/* Header */}
                                <div className="px-4 py-6 sm:px-6 border-b border-gray-100 bg-gray-50/50">
                                    <div className="flex items-start justify-between">
                                        {title && (
                                            <h2 className="text-xl font-bold text-gray-900 leading-6" id="slide-over-title">
                                                {title}
                                            </h2>
                                        )}
                                        <div className="ml-3 flex h-7 items-center">
                                            <button
                                                type="button"
                                                className="rounded-full bg-white text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#FF6A00] focus:ring-offset-2 p-1 transition-all"
                                                onClick={onClose}
                                            >
                                                <span className="sr-only">Close panel</span>
                                                <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Body */}
                                <div className="relative flex-1 px-4 py-6 sm:px-6">
                                    {children}
                                </div>

                                {/* Footer */}
                                {footer && (
                                    <div className="border-t border-gray-100 bg-gray-50/50 px-4 py-4 sm:px-6">
                                        {footer}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
