import React, { useState, Fragment, useEffect, useRef } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Booking, HousekeepingTask, generateCheckoutBill, getCheckoutBill, CheckoutBill, addFolioTransaction } from '@/lib/firestoreService';
import { XCircleIcon, BanknotesIcon, CalculatorIcon, CreditCardIcon, PrinterIcon } from '@heroicons/react/24/outline';
import { useReactToPrint } from 'react-to-print';
import { InvoiceTemplate } from '@/components/admin/finance/InvoiceTemplate';
import { sendEmail, generateBookingConfirmationEmail, generateGeneralReplyEmail } from '@/lib/emailService';
import { sendInvoiceEmailAction } from '@/app/actions/emailActions';

interface CheckOutModalProps {
    booking: Booking;
    roomIndex?: number;
    position?: { top: number, left: number };
    onClose: () => void;
    onConfirm: (data: CheckOutData) => Promise<void>;
    processing: boolean;
}

export interface CheckOutData {
    staffName: string;
    depositReturned: boolean;
    notes?: string;
    housekeepingPriority: 'low' | 'medium' | 'high' | 'urgent';
    housekeepingAssignee?: string;
}

export default function CheckOutModal({ booking, roomIndex, onClose, onConfirm, processing, position }: CheckOutModalProps) {
    const [formData, setFormData] = useState<CheckOutData>({
        staffName: '',
        depositReturned: false,
        notes: '',
        housekeepingPriority: 'high',
        housekeepingAssignee: '',
    });

    const [bill, setBill] = useState<CheckoutBill | null>(null);
    const [loadingBill, setLoadingBill] = useState(true);

    const [paymentAmount, setPaymentAmount] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState('Cash');
    const [isPaying, setIsPaying] = useState(false);

    // Animation State
    const [isOpen, setIsOpen] = useState(false);

    // Print Handling
    const componentRef = useRef<HTMLDivElement>(null);
    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        documentTitle: `Invoice-${booking.bookingId}`,
    });

    const fetchBill = async () => {
        setLoadingBill(true);
        try {
            // Always try to generate fresh to capture latest transactions
            const billId = await generateCheckoutBill(booking.id);
            if (billId) {
                const billData = await getCheckoutBill(billId);
                setBill(billData);
                if (billData && billData.balance > 0) {
                    setPaymentAmount(billData.balance);
                }
            }
        } catch (error) {
            console.error("Failed to load bill", error);
        } finally {
            setLoadingBill(false);
        }
    };

    useEffect(() => {
        // Trigger enter animation
        requestAnimationFrame(() => setIsOpen(true));

        // Auto-generate/fetch bill on open to show latest status
        fetchBill();
    }, [booking.id]);

    const handleQuickPayment = async () => {
        if (!bill) return;
        setIsPaying(true);
        try {
            const transactionCode = paymentMethod === 'Card' ? '9002' : (paymentMethod === 'Bank Transfer' ? '9005' : '9001');

            await addFolioTransaction({
                bookingId: booking.id,
                date: new Date(),
                type: 'payment',
                code: transactionCode,
                description: `Checkout Settlement (${paymentMethod})`,
                amount: paymentAmount,
                userId: formData.staffName || 'Front Desk', // Use entered name or default
                category: 'Payment',
                reference: 'CHECKOUT-QUICK-PAY'
            });

            // Refresh bill to show updated balance
            await fetchBill();

        } catch (e) {
            console.error("Error processing payment", e);
            alert("Failed to process payment");
        } finally {
            setIsPaying(false);
        }
    };

    const handleClose = () => {
        setIsOpen(false);
    };

    const rIndex = roomIndex !== undefined ? roomIndex : 0;
    const targetRoom = booking.rooms[rIndex] || booking.rooms[0];
    const roomName = targetRoom.allocatedRoomType || 'Unassigned';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Confirm Checkout in UI first (this handles Firestore updates via parent)
        await onConfirm(formData);

        // Send Email Notification Check (Fire & Forget)
        if (bill && booking.guestDetails.email) {
            // Trigger server action to generate PDF and send email
            sendInvoiceEmailAction(bill)
                .then((result) => {
                    if (result.success) {
                        console.log("Invoice email sent successfully to " + booking.guestDetails.email);
                    } else {
                        console.error("Failed to send invoice email:", result.error);
                    }
                })
                .catch((err) => {
                    console.error("Error sending invoice email:", err);
                });
        }
    };

    // --- CONTEXTUAL VERTICAL POSITIONING ---
    const WINDOW_HEIGHT = typeof window !== 'undefined' ? window.innerHeight : 900;
    const DRAWER_ESTIMATED_HEIGHT = 600; // Increased estimate due to bill summary
    let verticalTop = 20;

    if (position) {
        verticalTop = position.top;
        verticalTop = Math.max(20, verticalTop - 50);
        if (verticalTop + DRAWER_ESTIMATED_HEIGHT > WINDOW_HEIGHT) {
            verticalTop = Math.max(20, WINDOW_HEIGHT - DRAWER_ESTIMATED_HEIGHT - 20);
        }
    }

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
                    <div className="fixed inset-0 bg-gray-900/10 transition-opacity" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-hidden">
                    <div className="absolute inset-0 overflow-hidden">
                        <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
                            <Transition.Child
                                as={Fragment}
                                enter="transform transition ease-out duration-500 sm:duration-500"
                                enterFrom="translate-x-full"
                                enterTo="translate-x-0"
                                leave="transform transition ease-in duration-500 sm:duration-500"
                                leaveFrom="translate-x-0"
                                leaveTo="translate-x-full"
                            >
                                <Dialog.Panel
                                    className="pointer-events-auto w-[900px] max-w-full"
                                    style={{ marginTop: `${verticalTop}px` }}
                                >
                                    <div className="flex flex-col bg-white shadow-2xl rounded-l-2xl border border-gray-100 overflow-hidden max-h-[calc(100vh-40px)]">
                                        <div className="bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center shrink-0">
                                            <div>
                                                <h3 className="text-xl font-bold text-gray-900">Check-Out Guest</h3>
                                                <p className="text-gray-500 text-sm mt-0.5 font-mono">ID: {booking.bookingId}</p>
                                            </div>
                                            <button onClick={handleClose} className="p-2 bg-gray-50 hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors rounded-full">
                                                <XCircleIcon className="h-6 w-6" />
                                            </button>
                                        </div>

                                        <div className="p-6 bg-white overflow-y-auto custom-scrollbar flex-1 space-y-6">

                                            {/* BILL SUMMARY SECTION (New) */}
                                            <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 relative overflow-hidden">
                                                <div className="absolute top-0 right-0 p-4 opacity-5">
                                                    <CalculatorIcon className="w-32 h-32" />
                                                </div>

                                                {loadingBill ? (
                                                    <div className="flex items-center justify-center py-8 gap-3 text-gray-400">
                                                        <div className="animate-spin h-5 w-5 border-2 border-gray-400 border-t-[#FF6A00] rounded-full"></div>
                                                        <span className="text-sm font-medium">Calculating Final Bill...</span>
                                                    </div>
                                                ) : bill ? (
                                                    <div className="relative z-10">
                                                        <div className="flex items-center justify-between mb-4">
                                                            <div className="flex items-center gap-2">
                                                                <BanknotesIcon className="h-5 w-5 text-[#FF6A00]" />
                                                                <h4 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Billing Summary</h4>
                                                            </div>

                                                            {/* PRINT BUTTON */}
                                                            <button
                                                                type="button"
                                                                onClick={() => handlePrint && handlePrint()}
                                                                className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-bold text-gray-700 hover:bg-gray-50 hover:text-indigo-600 transition-colors shadow-sm"
                                                            >
                                                                <PrinterIcon className="w-4 h-4" />
                                                                Print Invoice
                                                            </button>
                                                        </div>
                                                        <div className="grid grid-cols-4 gap-6">
                                                            <div>
                                                                <span className="block text-xs font-semibold text-gray-500 uppercase">Total Charges</span>
                                                                <span className="block text-xl font-bold text-gray-900 mt-1">₹{bill.totalAmount.toLocaleString()}</span>
                                                            </div>
                                                            <div>
                                                                <span className="block text-xs font-semibold text-gray-500 uppercase">Paid Amount</span>
                                                                <span className="block text-xl font-bold text-green-600 mt-1">₹{bill.paidAmount.toLocaleString()}</span>
                                                            </div>
                                                            <div>
                                                                <span className="block text-xs font-semibold text-gray-500 uppercase">Balance Due</span>
                                                                <span className={`block text-xl font-bold mt-1 ${bill.balance > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                                                                    ₹{bill.balance.toLocaleString()}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center justify-end">
                                                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${bill.balance <= 0
                                                                    ? 'bg-green-100 text-green-700 border-green-200'
                                                                    : 'bg-red-100 text-red-700 border-red-200'
                                                                    }`}>
                                                                    {bill.balance <= 0 ? 'Settled' : 'Payment Pending'}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Detailed Breakdown Mini-View */}
                                                        {bill.balance > 0 && (
                                                            <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-600 flex gap-4">
                                                                {bill.roomCharges > 0 && <span>Room: ₹{bill.roomCharges}</span>}
                                                                {bill.foodCharges > 0 && <span>Food: ₹{bill.foodCharges}</span>}
                                                                {bill.serviceCharges > 0 && <span>Services: ₹{bill.serviceCharges}</span>}
                                                                {bill.addOnsCharges > 0 && <span>Add-ons: ₹{bill.addOnsCharges}</span>}
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="text-center py-6 text-gray-400">
                                                        Could not load bill details.
                                                    </div>
                                                )}
                                            </div>

                                            {/* SETTLEMENT SECTION */}
                                            {bill && bill.balance > 0 && (
                                                <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 mt-4 animate-fadeIn">
                                                    <h5 className="text-sm font-bold text-gray-800 mb-3 uppercase tracking-wide flex items-center gap-2">
                                                        <CreditCardIcon className="w-4 h-4 text-orange-600" />
                                                        Settle Outstanding Balance
                                                    </h5>
                                                    <div className="flex gap-3 items-end">
                                                        <div className="flex-1">
                                                            <label className="block text-xs font-semibold text-gray-500 mb-1">Amount</label>
                                                            <div className="relative">
                                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₹</span>
                                                                <input
                                                                    type="number"
                                                                    className="w-full pl-7 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-900 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none"
                                                                    value={paymentAmount}
                                                                    onChange={(e) => setPaymentAmount(parseFloat(e.target.value))}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="w-1/3">
                                                            <label className="block text-xs font-semibold text-gray-500 mb-1">Method</label>
                                                            <select
                                                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none"
                                                                value={paymentMethod}
                                                                onChange={(e) => setPaymentMethod(e.target.value)}
                                                            >
                                                                <option value="Cash">Cash</option>
                                                                <option value="Card">Card</option>
                                                                <option value="UPI">UPI</option>
                                                                <option value="Bank Transfer">Bank Transfer</option>
                                                            </select>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={handleQuickPayment}
                                                            disabled={isPaying || paymentAmount <= 0}
                                                            className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all text-xs shadow-md shadow-orange-200 disabled:opacity-50 disabled:shadow-none h-[38px]"
                                                        >
                                                            {isPaying ? 'Processing...' : 'Record Pay'}
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Automation Info */}
                                            <div className="bg-blue-50/50 p-4 border border-blue-100 flex items-start gap-3 rounded-lg">
                                                <div className="p-2 bg-blue-100 text-blue-600 mt-0.5 rounded-full">
                                                    <span className="sr-only">Info</span>
                                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-900">Automation Enabled</p>
                                                    <p className="text-sm text-gray-500 mt-0.5">
                                                        A housekeeping task will be automatically created for <strong>Room {roomName}</strong> upon check-out.
                                                        {booking.guestDetails.email && <span> An email summary will be sent to the guest.</span>}
                                                    </p>
                                                </div>
                                            </div>

                                            <form id="checkOutForm" onSubmit={handleSubmit} className="space-y-6">
                                                <div>
                                                    <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide mb-2">Processed By (Staff Name) *</label>
                                                    <input
                                                        required
                                                        type="text"
                                                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all placeholder:text-gray-400"
                                                        value={formData.staffName}
                                                        onChange={(e) => setFormData({ ...formData, staffName: e.target.value })}
                                                        placeholder="Enter your name"
                                                    />
                                                </div>

                                                <div className="flex items-center p-4 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors cursor-pointer" onClick={() => setFormData({ ...formData, depositReturned: !formData.depositReturned })}>
                                                    <div className={`relative flex items-center justify-center w-5 h-5 mr-3 border rounded transition-colors ${formData.depositReturned ? 'bg-green-500 border-green-500' : 'border-gray-300 bg-white'}`}>
                                                        {formData.depositReturned && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                                    </div>
                                                    <label className="text-sm font-medium text-gray-900 cursor-pointer select-none flex-1">
                                                        Confirm Security Deposit Returned
                                                    </label>
                                                    <input
                                                        type="checkbox"
                                                        className="hidden"
                                                        checked={formData.depositReturned}
                                                        readOnly
                                                    />
                                                </div>

                                                <div className="pt-2">
                                                    <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide mb-2">Housekeeping Settings</label>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="block text-xs font-semibold text-gray-500 mb-1">Priority</label>
                                                            <select
                                                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all"
                                                                value={formData.housekeepingPriority}
                                                                onChange={(e) => setFormData({ ...formData, housekeepingPriority: e.target.value as any })}
                                                            >
                                                                <option value="low">Low</option>
                                                                <option value="medium">Medium</option>
                                                                <option value="high">High</option>
                                                                <option value="urgent">Urgent</option>
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-semibold text-gray-500 mb-1">Assign To (Optional)</label>
                                                            <input
                                                                type="text"
                                                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all placeholder:text-gray-400"
                                                                value={formData.housekeepingAssignee}
                                                                onChange={(e) => setFormData({ ...formData, housekeepingAssignee: e.target.value })}
                                                                placeholder="Staff Name"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide mb-2">Notes / Comments</label>
                                                    <textarea
                                                        rows={3}
                                                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all placeholder:text-gray-400 resize-none"
                                                        value={formData.notes}
                                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                                        placeholder="Any feedback or issues..."
                                                    />
                                                </div>
                                            </form>
                                        </div>

                                        <div className="bg-gray-50/50 border-t border-gray-100 p-6 flex gap-3 sticky bottom-0 z-10">
                                            <button
                                                onClick={handleClose}
                                                type="button"
                                                className="flex-1 py-3 bg-white border border-gray-200 text-gray-700 font-bold hover:bg-gray-50 transition-colors shadow-sm rounded-xl uppercase tracking-wide text-xs"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                form="checkOutForm"
                                                disabled={processing || !formData.staffName}
                                                className="flex-1 py-3 bg-gray-900 text-white font-bold hover:bg-black transition-colors shadow-lg shadow-gray-200 disabled:opacity-50 disabled:shadow-none rounded-xl uppercase tracking-wide text-xs"
                                            >
                                                {processing ? 'Processing...' : 'Confirm Check-out'}
                                            </button>
                                        </div>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </div>
            </Dialog>

            {/* Hidden Invoice for Printing */}
            <div className="hidden">
                {bill && (
                    <InvoiceTemplate
                        ref={componentRef}
                        bill={bill}
                    />
                )}
            </div>
        </Transition.Root>
    );
}
