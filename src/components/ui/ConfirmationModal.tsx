import React from 'react';
import { XMarkIcon, ExclamationTriangleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info';
    disabled?: boolean;
}

export default function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    type = 'danger',
    disabled = false
}: ConfirmationModalProps) {
    if (!isOpen) return null;

    const typeConfig = {
        danger: {
            icon: ExclamationTriangleIcon,
            iconColor: 'text-red-600',
            iconBg: 'bg-red-100',
            buttonBg: 'bg-red-600 hover:bg-red-700',
            buttonText: 'text-white'
        },
        warning: {
            icon: ExclamationTriangleIcon,
            iconColor: 'text-amber-600',
            iconBg: 'bg-amber-100',
            buttonBg: 'bg-amber-600 hover:bg-amber-700',
            buttonText: 'text-white'
        },
        info: {
            icon: InformationCircleIcon,
            iconColor: 'text-blue-600',
            iconBg: 'bg-blue-100',
            buttonBg: 'bg-blue-600 hover:bg-blue-700',
            buttonText: 'text-white'
        }
    };

    const config = typeConfig[type];
    const Icon = config.icon;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
            {/* Transparent overlay to block clicks but show background clearly */}
            <div
                className="absolute inset-0 bg-transparent"
                onClick={onClose}
            />

            <div
                className="relative bg-white rounded-lg shadow-2xl w-full max-w-md overflow-hidden transform transition-all animate-in zoom-in-95 duration-200 border border-gray-100"
                onClick={e => e.stopPropagation()}
                style={{
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 15px rgba(0, 0, 0, 0.1)' // Extra strong shadow
                }}
            >
                <div className="p-6">
                    <div className="flex items-start gap-4">
                        <div className={`flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full ${config.iconBg}`}>
                            <Icon className={`h-6 w-6 ${config.iconColor}`} aria-hidden="true" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-gray-900 leading-6">
                                {title}
                            </h3>
                            <div className="mt-2">
                                <p className="text-sm text-gray-500">
                                    {message}
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                            onClick={onClose}
                        >
                            <span className="sr-only">Close</span>
                            <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                        </button>
                    </div>
                </div>
                <div className="bg-gray-50 px-6 py-4 flex flex-row-reverse gap-3">
                    <button
                        type="button"
                        className={`inline-flex w-full justify-center rounded-md border border-transparent px-4 py-2 text-base font-semibold shadow-sm sm:ml-3 sm:w-auto sm:text-sm ${config.buttonBg} ${config.buttonText} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                        onClick={onConfirm}
                        disabled={disabled}
                    >
                        {confirmText}
                    </button>
                    <button
                        type="button"
                        className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 sm:mt-0 sm:w-auto sm:text-sm"
                        onClick={onClose}
                    >
                        {cancelText}
                    </button>
                </div>
            </div>
        </div>
    );
}
