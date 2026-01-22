
import React, { useState, Fragment, useEffect, useRef } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Booking, generateCheckoutBill, getCheckoutBill, CheckoutBill } from '@/lib/firestoreService';
import { XCircleIcon, PrinterIcon, BanknotesIcon } from '@heroicons/react/24/outline';
import { useReactToPrint } from 'react-to-print';
import { InvoiceTemplate } from '@/components/admin/finance/InvoiceTemplate';

interface InvoiceViewModalProps {
    booking: Booking;
    onClose: () => void;
}

export default function InvoiceViewModal({ booking, onClose }: InvoiceViewModalProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [bill, setBill] = useState<CheckoutBill | null>(null);
    const [loading, setLoading] = useState(true);

    const componentRef = useRef<HTMLDivElement>(null);
    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        documentTitle: `Invoice-${booking.bookingId}`,
    });

    useEffect(() => {
        // Trigger enter animation
        setIsOpen(true);

        const fetchBill = async () => {
            setLoading(true);
            try {
                // Generate/Fetch bill
                const billId = await generateCheckoutBill(booking.id);
                if (billId) {
                    const billData = await getCheckoutBill(billId);
                    setBill(billData);
                }
            } catch (error) {
                console.error("Failed to load invoice", error);
            } finally {
                setLoading(false);
            }
        };

        if (booking) {
            fetchBill();
        }
    }, [booking]);

    const handleClose = () => {
        setIsOpen(false);
        setTimeout(onClose, 200); // Wait for animation
    };

    return (
        <Transition.Root show={isOpen} as={Fragment} afterLeave={onClose}>
            <Dialog as="div" className="relative z-[60]" onClose={handleClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="transform transition ease-out duration-300"
                            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                            enterTo="opacity-100 translate-y-0 sm:scale-100"
                            leave="transform transition ease-in duration-200"
                            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">

                                {/* Header */}
                                <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
                                    <Dialog.Title as="h3" className="text-lg font-bold leading-6 text-gray-900 flex items-center gap-2">
                                        <BanknotesIcon className="h-6 w-6 text-green-600" />
                                        Invoice View
                                        <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-1 rounded ml-2">
                                            #{booking.bookingId}
                                        </span>
                                    </Dialog.Title>
                                    <div className="flex items-center gap-3">
                                        <button
                                            type="button"
                                            onClick={() => handlePrint && handlePrint()}
                                            disabled={loading || !bill}
                                            className="inline-flex justify-center items-center gap-2 rounded-lg border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            <PrinterIcon className="h-4 w-4" />
                                            Print Invoice
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleClose}
                                            className="rounded-full p-1 text-gray-400 hover:text-gray-500 hover:bg-gray-100 transition-colors focus:outline-none"
                                        >
                                            <XCircleIcon className="h-8 w-8" />
                                        </button>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="mt-2 h-[75vh] overflow-y-auto custom-scrollbar border border-gray-200 rounded-xl bg-gray-50 flex justify-center p-8">
                                    {loading ? (
                                        <div className="flex flex-col items-center justify-center h-full text-gray-500">
                                            <div className="animate-spin h-10 w-10 border-4 border-indigo-500 border-t-transparent rounded-full mb-4"></div>
                                            <p>Generating Invoice Preview...</p>
                                        </div>
                                    ) : bill ? (
                                        <div className="shadow-lg bg-white w-fit">
                                            <InvoiceTemplate ref={componentRef} bill={bill} />
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full text-gray-500">
                                            <XCircleIcon className="h-12 w-12 text-red-300 mb-2" />
                                            <p>Could not load invoice data.</p>
                                        </div>
                                    )}
                                </div>

                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    );
}
