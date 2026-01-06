import React, { useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, ClockIcon, CheckCircleIcon, BanknotesIcon, UserIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { GuestService, updateGuestService } from '@/lib/firestoreService';
import { useToast } from '@/context/ToastContext';

interface ServiceDetailDrawerProps {
    open: boolean;
    onClose: () => void;
    service: GuestService | null;
    onUpdate: () => void; // Refresh list
}

export default function ServiceDetailDrawer({ open, onClose, service, onUpdate }: ServiceDetailDrawerProps) {
    const { showToast } = useToast();
    const [isProcessing, setIsProcessing] = useState(false);

    if (!service) return null;

    const handleStatusUpdate = async (newStatus: GuestService['status']) => {
        setIsProcessing(true);
        try {
            const createTransaction = newStatus === 'completed';

            await updateGuestService(service.id, {
                status: newStatus,
                createTransaction // This triggers the auto-billing defined in firestoreService
            });

            showToast(
                newStatus === 'completed'
                    ? 'Service completed and charge posted to folio!'
                    : `Service marked as ${newStatus.replace('_', ' ')}`,
                'success'
            );
            onUpdate();
            onClose();
        } catch (error) {
            console.error(error);
            showToast('Failed to update status', 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'requested': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'completed': return 'bg-green-100 text-green-800 border-green-200';
            case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    return (
        <Transition.Root show={open} as={React.Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <div className="fixed inset-0 bg-gray-900/30 backdrop-blur-sm transition-opacity" />

                <div className="fixed inset-0 overflow-hidden">
                    <div className="absolute inset-0 overflow-hidden">
                        <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
                            <Transition.Child
                                as={React.Fragment}
                                enter="transform transition ease-in-out duration-500 sm:duration-700"
                                enterFrom="translate-x-full"
                                enterTo="translate-x-0"
                                leave="transform transition ease-in-out duration-500 sm:duration-700"
                                leaveFrom="translate-x-0"
                                leaveTo="translate-x-full"
                            >
                                <Dialog.Panel className="pointer-events-auto w-screen max-w-md">
                                    <div className="flex h-full flex-col overflow-y-scroll bg-white shadow-xl">

                                        {/* Header */}
                                        <div className="px-4 py-6 sm:px-6 bg-gray-50 border-b border-gray-200">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <Dialog.Title className="text-lg font-semibold leading-6 text-gray-900">
                                                        Service Request Details
                                                    </Dialog.Title>
                                                    <p className="mt-1 text-sm text-gray-500">
                                                        #{service.id.slice(-6).toUpperCase()} • Created {service.requestedAt?.toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <div className="ml-3 flex h-7 items-center">
                                                    <button
                                                        type="button"
                                                        className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none"
                                                        onClick={onClose}
                                                    >
                                                        <span className="sr-only">Close panel</span>
                                                        <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 px-4 py-6 sm:px-6 space-y-8">

                                            {/* Status Banner */}
                                            <div className={`p-4 rounded-lg border-l-4 flex items-center justify-between ${getStatusColor(service.status).replace('bg-', 'bg-opacity-20 ')}`}>
                                                <span className="font-bold uppercase text-sm tracking-wide">
                                                    {service.status.replace('_', ' ')}
                                                </span>
                                                {service.transactionId && (
                                                    <div className="flex items-center gap-1 text-xs font-semibold text-green-700">
                                                        <BanknotesIcon className="h-4 w-4" />
                                                        <span>Charged</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Guest Info */}
                                            <div>
                                                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Guest Information</h3>
                                                <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold">
                                                            {service.guestName.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-gray-900">{service.guestName}</p>
                                                            <p className="text-xs text-gray-500">{service.guestPhone}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="flex items-center gap-1 text-gray-600">
                                                            <MapPinIcon className="h-4 w-4" />
                                                            <span className="font-medium">{service.roomNumber || 'N/A'}</span>
                                                        </div>
                                                        <p className="text-xs text-gray-400">Room No.</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Request Items */}
                                            <div>
                                                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
                                                    {service.serviceCategory} Details
                                                </h3>

                                                <div className="border border-gray-200 rounded-lg overflow-hidden">
                                                    {/* Specific Layouts based on Category */}
                                                    {service.serviceCategory === 'laundry' && service.items && (
                                                        <div className="divide-y divide-gray-100">
                                                            {service.items.map((item, idx) => (
                                                                <div key={idx} className="p-3 flex justify-between items-center text-sm">
                                                                    <div className="flex items-center gap-3">
                                                                        <span className="h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600">
                                                                            {item.qty}
                                                                        </span>
                                                                        <span className="text-gray-900">{item.name}</span>
                                                                    </div>
                                                                    <span className="font-medium text-gray-900">{formatCurrency(item.qty * item.price)}</span>
                                                                </div>
                                                            ))}
                                                            {service.fastService && (
                                                                <div className="p-3 bg-yellow-50 flex justify-between items-center text-sm border-t border-yellow-100">
                                                                    <span className="text-yellow-800 font-medium">Fast Service Surcharge (50%)</span>
                                                                    <span className="font-bold text-yellow-800">{formatCurrency(service.fastServiceSurcharge || 0)}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    {service.serviceCategory === 'spa' && (
                                                        <div className="p-4 bg-purple-50 space-y-2">
                                                            <div className="flex justify-between">
                                                                <span className="text-purple-900 font-medium">{service.spaType}</span>
                                                                <span className="text-purple-900 font-bold">{formatCurrency(service.amount)}</span>
                                                            </div>
                                                            <div className="text-xs text-purple-700 flex gap-4">
                                                                <span>{service.durationMinutes} mins</span>
                                                                <span>•</span>
                                                                <span>{service.guestCount} Person(s)</span>
                                                            </div>
                                                            <div className="pt-2 border-t border-purple-200 mt-2 flex items-center gap-2 text-sm text-purple-800">
                                                                <ClockIcon className="h-4 w-4" />
                                                                <span>
                                                                    {service.appointmentDate?.toLocaleDateString()} at {service.appointmentTime}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Fallback description */}
                                                    {(!service.items && service.serviceCategory !== 'spa') && (
                                                        <div className="p-4 text-gray-700 italic">
                                                            "{service.description}"
                                                        </div>
                                                    )}

                                                    {/* Totals */}
                                                    <div className="bg-gray-50 p-4 border-t border-gray-200">
                                                        <div className="flex justify-between items-center">
                                                            <span className="font-bold text-gray-700">Total Billable</span>
                                                            <span className="font-bold text-xl text-[#FF6A00]">
                                                                {formatCurrency(service.totalAmount || service.amount || 0)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Timeline / Dates */}
                                            <div>
                                                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Schedule</h3>
                                                <div className="grid grid-cols-2 gap-4 text-sm">
                                                    {service.pickupDate && (
                                                        <div className="bg-white border border-gray-200 p-3 rounded-lg">
                                                            <p className="text-xs text-gray-500">Pickup</p>
                                                            <p className="font-medium text-gray-900">{service.pickupDate.toLocaleDateString()}</p>
                                                            <p className="text-xs text-gray-600">{service.pickupTime}</p>
                                                        </div>
                                                    )}
                                                    {service.deliveryDate && (
                                                        <div className={`bg-white border border-gray-200 p-3 rounded-lg ${service.serviceCategory === 'laundry' ? (service.fastService ? 'border-l-4 border-l-yellow-500' : 'border-l-4 border-l-blue-500') : ''}`}>
                                                            <p className="text-xs text-gray-500">Delivery/Due</p>
                                                            <p className="font-medium text-gray-900">{service.deliveryDate.toLocaleDateString()}</p>
                                                            <p className="text-xs text-gray-600">{service.deliveryTime}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                        </div>

                                        {/* Footer Actions */}
                                        <div className="flex-shrink-0 border-t border-gray-200 p-4 sm:px-6 bg-gray-50 flex justify-end gap-3 pb-8">
                                            {service.status === 'requested' && (
                                                <button
                                                    onClick={() => handleStatusUpdate('in_progress')}
                                                    disabled={isProcessing}
                                                    className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg font-semibold shadow-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
                                                >
                                                    Start Service
                                                </button>
                                            )}

                                            {service.status === 'in_progress' && (
                                                <button
                                                    onClick={() => handleStatusUpdate('completed')}
                                                    disabled={isProcessing}
                                                    className="flex-1 bg-green-600 text-white px-4 py-3 rounded-lg font-bold shadow-md hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                                >
                                                    {isProcessing ? 'Processing Bill...' : (
                                                        <>
                                                            <CheckCircleIcon className="h-5 w-5" />
                                                            Complete & Charge Folio
                                                        </>
                                                    )}
                                                </button>
                                            )}

                                            {service.status !== 'completed' && service.status !== 'cancelled' && (
                                                <button
                                                    onClick={() => handleStatusUpdate('cancelled')}
                                                    disabled={isProcessing}
                                                    className="bg-white text-red-600 border border-red-200 px-4 py-3 rounded-lg font-semibold hover:bg-red-50 transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                            )}

                                            {service.status === 'completed' && (
                                                <div className="w-full text-center text-sm text-gray-500 italic py-2">
                                                    Service completed on {service.completedAt?.toLocaleDateString()}
                                                </div>
                                            )}
                                        </div>

                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    );
}
