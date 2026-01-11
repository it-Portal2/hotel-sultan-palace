import React, { useState, useEffect, useMemo } from 'react';
import { XMarkIcon, CalendarDaysIcon, PlusIcon, TrashIcon, UserIcon, ChevronDownIcon, MagnifyingGlassIcon, ArrowsPointingOutIcon, ArrowsPointingInIcon } from '@heroicons/react/24/outline';
import { SuiteType, RoomType, Booking, Room } from '@/lib/firestoreService';

interface QuickReservationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (bookingData: any) => Promise<void>;
    initialDate?: Date;
    initialSuiteType?: SuiteType;
    initialRoomName?: string;
    roomTypes: RoomType[];
    availableRooms: Room[]; // Available rooms for the selected dates (or all rooms to lookup prices)
    bookings?: Booking[];
    loading?: boolean;
}

// Helper: Normalize date to YYYY-MM-DD string for strict comparison
const toDateStr = (d: any) => {
    if (!d) return new Date().toISOString().split('T')[0];
    let date;
    if (typeof d.toDate === 'function') {
        date = d.toDate();
    } else {
        date = new Date(d);
    }

    if (isNaN(date.getTime())) return new Date().toISOString().split('T')[0];

    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    return date.toISOString().split('T')[0];
};

// Helper: Check if a date range overlaps with another (Inclusive Start, Exclusive End)
const isDateOverlap = (start1: string, end1: string, start2: string, end2: string) => {
    return start1 < end2 && start2 < end1;
};

const QuickReservationModal: React.FC<QuickReservationModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    initialDate,
    initialSuiteType,
    initialRoomName,
    availableRooms,
    bookings = [],
    loading = false
}) => {
    const [isAdvancedMode, setIsAdvancedMode] = useState(false);

    // Default prices map based on room type
    const suitePrices = useMemo(() => {
        const prices: Record<string, number> = {};
        availableRooms.forEach(r => {
            if (r.suiteType && r.price) {
                prices[r.suiteType] = r.price;
            }
        });
        return prices;
    }, [availableRooms]);

    // Helper to format date as YYYY-MM-DD in local time
    const formatDateLocal = (date: Date) => {
        const d = new Date(date);
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        return d.toISOString().split('T')[0];
    };

    // Helper: Generate fresh initial state
    const getInitialFormData = (
        dateArg?: Date,
        roomNameArg?: string,
        suiteTypeArg?: SuiteType,
        availRoomsArg: Room[] = availableRooms
    ) => {
        const startDate = dateArg || new Date();
        const startDateStr = formatDateLocal(startDate);

        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 1);
        const endDateStr = formatDateLocal(endDate);

        // 1. Try to find the exact initial room object
        let selectedRoomObj = null;
        if (roomNameArg) {
            selectedRoomObj = availRoomsArg.find(r => r.name.toLowerCase() === roomNameArg.toLowerCase());
        }

        // 2. Determine Initial Type and Price
        let initialSuite = suiteTypeArg || (selectedRoomObj ? selectedRoomObj.suiteType : 'Garden Suite');
        if (!initialSuite) initialSuite = 'Garden Suite';

        let initialPrice = 0;
        if (selectedRoomObj && selectedRoomObj.price) {
            initialPrice = selectedRoomObj.price;
        } else if (suitePrices[initialSuite]) {
            initialPrice = suitePrices[initialSuite];
        }

        const initialRoomEntry = {
            id: Date.now().toString(),
            roomType: initialSuite,
            rateType: '',
            roomName: roomNameArg || '',
            adults: 2,
            children: 0,
            price: initialPrice
        };

        return {
            checkInDate: startDateStr,
            checkInTime: '03:00 PM',
            checkOutDate: endDateStr,
            checkOutTime: '11:00 AM',
            nights: 1,

            // Advanced Fields
            reservationType: 'Walk In',
            businessSource: 'Direct',
            bookingSource: 'Direct',
            marketCode: 'Direct',

            // Checkboxes
            rateOffered: false,
            contract: false,
            bookAllAvailable: false,
            quickGroupBooking: false,
            complimentaryRoom: false,

            // Room selection list
            selectedRooms: [initialRoomEntry],

            // Guest Info
            guestTitle: 'Mr.',
            guestFirstName: '',
            guestLastName: '',
            guestMobile: '',
            guestEmail: '',
            guestAddress: '',
            guestCity: '',
            guestZip: '',
            guestState: '',
            guestCountry: '',

            // Options
            emailBookingVouchers: false,
            sendEmailAtCheckout: true,
            accessToGuestPortal: false,
            // Billing
            billTo: 'Guest',
            taxExempt: false,
            paymentMode: false,
            paidAmount: 0,
            totalAmount: initialPrice
        };
    };

    // Lazy Initialization of Form Data
    const [formData, setFormData] = useState(() => getInitialFormData(initialDate, initialRoomName, initialSuiteType));


    // --- DYNAMIC AVAILABILITY LOGIC ---

    // 1. Identify valid Check-In / Check-Out Strings
    const reservationDates = useMemo(() => {
        if (!formData.checkInDate || !formData.checkOutDate) return null;
        return {
            start: formData.checkInDate, // Already YYYY-MM-DD
            end: formData.checkOutDate // Already YYYY-MM-DD
        };
    }, [formData.checkInDate, formData.checkOutDate]);

    // 2. Filter Room List (Show All + Mark Unavailable)
    const dynamicAvailableRooms = useMemo(() => {
        // Iterate over ALL available rooms to show them in the list
        return availableRooms.map(room => {
            // Check if this room is booked in the requested range
            let isBooked = false;

            if (bookings && reservationDates) {
                isBooked = bookings.some(booking => {
                    // Ignore cancelled bookings
                    if (booking.status === 'cancelled') return false;

                    // Ensure booking has room data
                    const hasRoom = booking.rooms.some(r =>
                        (r.allocatedRoomType === room.name)
                    );

                    if (!hasRoom) return false;

                    // Robust Date Normalization
                    const bStart = toDateStr(booking.checkIn);
                    const bEnd = toDateStr(booking.checkOut);

                    // Overlap check
                    return isDateOverlap(reservationDates.start, reservationDates.end, bStart, bEnd);
                });
            }

            return {
                ...room,
                isBooked // Add a flag to the room object (we'll use this for UI state)
            };
        })
            .filter(room => {
                // Extra Filter: Remove rooms that are just named after the suite or explicit garbage
                const nameLower = room.name.toLowerCase();
                // FILTER OUT 'IMPERIAL VIEW' and other generics
                if (nameLower.includes('imperial view')) return false;

                return !['garden suite', 'imperial suite', 'ocean suite'].includes(nameLower);
            })
            .sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically
    }, [availableRooms, bookings, reservationDates]); // STRICT DEPENDENCIES

    // 3. Filter Room Types - Show Standard Types
    const availableRoomTypes = useMemo(() => {
        // STRICT: Hardcoded 3 types as requested by user to allow selecting them even if no data exists
        const standardTypes: SuiteType[] = ['Garden Suite', 'Imperial Suite', 'Ocean Suite'];
        return standardTypes.map(t => ({
            id: t,
            suiteType: t,
            price: suitePrices[t] || 0,
            roomName: '',
            rateType: 'Standard Rate',
            adults: 2,
            children: 0,
            roomNumber: '',
            amenities: [],
            images: [],
            description: ''
        } as unknown as RoomType)); // Cast to avoid full type warnings
    }, [suitePrices]);

    // Calculate nights when dates change
    useEffect(() => {
        if (formData.checkInDate && formData.checkOutDate) {
            const start = new Date(formData.checkInDate);
            const end = new Date(formData.checkOutDate);
            const diffTime = Math.abs(end.getTime() - start.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            setFormData(prev => ({ ...prev, nights: Math.max(1, diffDays) }));
        }
    }, [formData.checkInDate, formData.checkOutDate]);

    // Cleanup invalid room selections when availability changes
    useEffect(() => {
        setFormData(prev => {
            let hasChanges = false;
            const newRooms = prev.selectedRooms.map(room => {
                if (room.roomName) {
                    // Check if strictly available
                    const foundRoom = dynamicAvailableRooms.find(
                        r => r.name === room.roomName && r.suiteType === room.roomType
                    );

                    // @ts-ignore
                    const isBooked = foundRoom?.isBooked;
                    const isStillAvailable = foundRoom && !isBooked;

                    // Edge Case: If I just initialized the form with "Jasmine", and strictly "Jasmine" is free, it should be in dynamicAvailableRooms.
                    // If it is NOT in dynamicAvailableRooms, it means it's booked.
                    if (!isStillAvailable) {
                        hasChanges = true;
                        return { ...room, roomName: '' };
                    }
                }
                return room;
            });

            if (hasChanges) {
                return { ...prev, selectedRooms: newRooms };
            }
            return prev;
        });
    }, [dynamicAvailableRooms]);

    // Reset/Re-initialize when modal opens with DIFFERENT props
    useEffect(() => {
        if (isOpen && initialDate) {
            setFormData(getInitialFormData(initialDate, initialRoomName, initialSuiteType, availableRooms));
        }
    }, [isOpen, initialDate, initialRoomName, initialSuiteType, availableRooms, suitePrices]);

    // Recalculate Total
    useEffect(() => {
        const total = formData.selectedRooms.reduce((acc, room) => acc + (room.price * formData.nights), 0);
        setFormData(prev => ({ ...prev, totalAmount: total }));
    }, [formData.selectedRooms, formData.nights]);





    const handleAddRoom = () => {
        const defaultType = 'Garden Suite';

        setFormData(prev => ({
            ...prev,
            selectedRooms: [
                ...prev.selectedRooms,
                {
                    id: Date.now().toString(),
                    roomType: defaultType,
                    rateType: 'Standard Rate',
                    roomName: '',
                    adults: 2,
                    children: 0,
                    price: suitePrices[defaultType] || 0
                }
            ]
        }));
    };

    const handleRoomChange = (id: string, field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            selectedRooms: prev.selectedRooms.map(r => {
                if (r.id === id) {
                    const updated = { ...r, [field]: value };

                    if (field === 'roomType') {
                        updated.price = suitePrices[value] || 0;
                        updated.roomName = ''; // Reset room selection
                    }

                    // Update price if specific room is selected (in case it differs from base suite price)
                    if (field === 'roomName' && value) {
                        const selectedRoom = availableRooms.find(room => room.name === value);
                        if (selectedRoom && selectedRoom.price) {
                            updated.price = selectedRoom.price;
                        }
                    }

                    return updated;
                }
                return r;
            })
        }));
    };

    const handleRemoveRoom = (id: string) => {
        if (formData.selectedRooms.length > 1) {
            setFormData(prev => ({
                ...prev,
                selectedRooms: prev.selectedRooms.filter(r => r.id !== id)
            }));
        }
    };

    const [isSubmitting, setIsSubmitting] = useState(false);

    // ... existing code ...

    const handleSubmit = async () => {
        if (!formData.guestFirstName && !formData.guestLastName) {
            alert("Please enter a Guest Name");
            return;
        }

        try {
            setIsSubmitting(true);
            await onSubmit(formData);
            // Modal closing is handled by parent, but we reset state just in case
        } catch (error) {
            console.error("Submission failed", error);
        } finally {
            // If parent closes modal, component unmounts. If not, we stop loading.
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className={`bg-[#f8f9fa] shadow-2xl transition-all duration-300 ease-in-out flex flex-col rounded-sm overflow-hidden font-sans text-sm
                    ${isAdvancedMode ? 'w-full max-w-[95vw] h-[95vh]' : 'w-full max-w-5xl h-auto max-h-[90vh]'}
                `}
            >

                {/* Header */}
                <div className="bg-white px-6 py-3 border-b border-gray-200 flex justify-between items-center flex-shrink-0 shadow-sm z-10">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        {isAdvancedMode ? <span onClick={() => setIsAdvancedMode(false)} className="cursor-pointer flex items-center gap-1"><span className="text-gray-400">{'<'}</span> Add Reservation</span> : 'Quick Reservation'}
                    </h3>
                    <div className="flex items-center gap-3">

                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                            <XMarkIcon className="h-6 w-6" />
                        </button>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
                    {/* Left Main Content */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">

                        {/* Top Row: Dates & Config */}
                        <div className="bg-white p-4 rounded border border-gray-200 shadow-sm space-y-4">

                            {/* Row 1: Check-in / Checkout */}
                            <div className="flex flex-wrap md:flex-nowrap gap-4 items-end">
                                {/* Check In */}
                                <div className="flex-1 min-w-[250px] flex items-center gap-0 border border-gray-300 rounded p-0 relative">
                                    <div className="flex-1 px-3 py-1">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide block mb-0.5">Check-in</label>
                                        <div className="flex items-center justify-between">
                                            <input
                                                type="date"
                                                value={formData.checkInDate}
                                                onChange={e => setFormData({ ...formData, checkInDate: e.target.value })}
                                                className="bg-transparent text-gray-900 font-bold focus:outline-none text-sm w-full"
                                            />
                                        </div>
                                    </div>
                                    <div className="w-px h-8 bg-gray-200"></div>
                                    <div className="w-24 px-2">
                                        <input
                                            type="text"
                                            value={formData.checkInTime}
                                            onChange={e => setFormData({ ...formData, checkInTime: e.target.value })}
                                            className="w-full bg-transparent text-gray-500 text-xs focus:outline-none text-right"
                                        />
                                    </div>
                                    <div className="absolute right-full mr-2 hidden md:block">
                                        {/* Optional calendar icon outside */}
                                    </div>
                                </div>

                                {/* Nights Badge */}
                                <div className="flex flex-col items-center justify-center px-2">
                                    <div className="bg-[#2c3e50] text-white w-10 h-10 flex flex-col items-center justify-center rounded shadow-sm leading-none">
                                        <span className="text-sm font-bold">{formData.nights}</span>
                                        <span className="text-[8px] uppercase">Nights</span>
                                    </div>
                                </div>

                                {/* Check Out */}
                                <div className="flex-1 min-w-[250px] flex items-center gap-0 border border-gray-300 rounded p-0">
                                    <div className="flex-1 px-3 py-1">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide block mb-0.5">Check-out</label>
                                        <input
                                            type="date"
                                            value={formData.checkOutDate}
                                            onChange={e => setFormData({ ...formData, checkOutDate: e.target.value })}
                                            min={formData.checkInDate}
                                            className="bg-transparent text-gray-900 font-bold focus:outline-none text-sm w-full"
                                        />
                                    </div>
                                    <div className="w-px h-8 bg-gray-200"></div>
                                    <div className="w-24 px-2">
                                        <input
                                            type="text"
                                            value={formData.checkOutTime}
                                            onChange={e => setFormData({ ...formData, checkOutTime: e.target.value })}
                                            className="w-full bg-transparent text-gray-500 text-xs focus:outline-none text-right"
                                        />
                                    </div>
                                </div>

                                {/* Counts & Type */}
                                {isAdvancedMode && (
                                    <>
                                        <div className="w-16">
                                            <label className="text-[10px] text-gray-500 block mb-1">Room(s)</label>
                                            <div className="border border-gray-300 rounded px-2 py-1.5 bg-white text-center text-xs font-bold">
                                                {formData.selectedRooms.length}
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-[150px]">
                                            <label className="text-[10px] text-gray-500 block mb-1">Reservation Type</label>
                                            <div className="relative">
                                                <select
                                                    value={formData.reservationType}
                                                    onChange={e => setFormData({ ...formData, reservationType: e.target.value })}
                                                    className="w-full border border-gray-300 rounded px-2 py-1.5 bg-white text-xs appearance-none pr-6 key-field"
                                                >
                                                    <option>Confirm Booking</option>
                                                    <option>Tentative</option>
                                                    <option>Waitlist</option>
                                                    <option>Walk In</option>
                                                </select>
                                                <ChevronDownIcon className="w-3 h-3 absolute right-2 top-2 text-gray-400 pointer-events-none" />
                                            </div>
                                        </div>
                                    </>
                                )}

                                {!isAdvancedMode && (
                                    <div className="flex-1 min-w-[150px]">
                                        <label className="text-[10px] font-bold text-gray-500 block mb-1">Reservation Type</label>
                                        <div className="relative">
                                            <select
                                                value={formData.reservationType}
                                                onChange={e => setFormData({ ...formData, reservationType: e.target.value })}
                                                className="w-full border border-gray-300 rounded px-2 py-1.5 bg-white text-xs appearance-none pr-6"
                                            >
                                                <option>Walk In</option>
                                                <option>Confirm Booking</option>
                                                <option>Tentative</option>

                                            </select>
                                            <ChevronDownIcon className="w-3 h-3 absolute right-2 top-2 text-gray-400 pointer-events-none" />
                                        </div>
                                    </div>
                                )}

                                {!isAdvancedMode && (
                                    <div className="flex-1 min-w-[150px]">
                                        <label className="text-[10px] font-bold text-gray-500 block mb-1">Business Source</label>
                                        <div className="relative">
                                            <select
                                                value={formData.businessSource}
                                                onChange={e => setFormData({ ...formData, businessSource: e.target.value })}
                                                className="w-full border border-gray-300 rounded px-2 py-1.5 bg-white text-xs appearance-none pr-6"
                                            >
                                                <option value="">-Select-</option>
                                                <option value="Direct">Direct</option>
                                                <option value="Agoda">Agoda</option>
                                                <option value="AUTOTECH CAR CARE LTD">AUTOTECH CAR CARE LTD</option>
                                                <option value="Best Friends Holiday Ltd">Best Friends Holiday Ltd</option>
                                                <option value="Booking.com">Booking.com</option>
                                                <option value="Expedia">Expedia</option>
                                                <option value="Internet Booking Engine">Internet Booking Engine</option>
                                                <option value="Lappet Faced Safaris Limited">Lappet Faced Safaris Limited</option>
                                                <option value="MSG Touristic">MSG Touristic</option>
                                                <option value="Remote Safari Company">Remote Safari Company</option>
                                                <option value="Safina Tours & Safaris">Safina Tours & Safaris</option>
                                                <option value="Tour Operators">Tour Operators</option>
                                            </select>
                                            <ChevronDownIcon className="w-3 h-3 absolute right-2 top-2 text-gray-400 pointer-events-none" />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Row 2: Sources (Advanced Only) */}
                            {isAdvancedMode && (
                                <div className="grid grid-cols-3 gap-4 pt-2">
                                    <div>
                                        <label className="text-[10px] text-gray-500 block mb-1">Booking Source</label>
                                        <div className="relative">
                                            <select
                                                value={formData.bookingSource}
                                                onChange={e => setFormData({ ...formData, bookingSource: e.target.value })}
                                                className="w-full border border-gray-300 rounded px-2 py-1.5 bg-white text-xs appearance-none pr-6"
                                            >
                                                <option value="">-Select-</option>
                                                <option value="Direct">Direct</option>
                                                <option value="OTA">OTA</option>
                                                <option value="Booking Engine">Booking Engine</option>
                                                <option value="Travel Agent">Travel Agent</option>
                                                <option value="Company">Company</option>
                                            </select>
                                            <ChevronDownIcon className="w-3 h-3 absolute right-2 top-2 text-gray-400 pointer-events-none" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-gray-500 block mb-1">Business Source</label>
                                        <div className="relative">
                                            <select
                                                value={formData.businessSource}
                                                onChange={e => setFormData({ ...formData, businessSource: e.target.value })}
                                                className="w-full border border-gray-300 rounded px-2 py-1.5 bg-white text-xs appearance-none pr-6"
                                            >
                                                <option value="">-Select-</option>
                                                <option value="Direct">Direct</option>
                                                <option value="Agoda">Agoda</option>
                                                <option value="AUTOTECH CAR CARE LTD">AUTOTECH CAR CARE LTD</option>
                                                <option value="Best Friends Holiday Ltd">Best Friends Holiday Ltd</option>
                                                <option value="Booking.com">Booking.com</option>
                                                <option value="Expedia">Expedia</option>
                                                <option value="Internet Booking Engine">Internet Booking Engine</option>
                                                <option value="Lappet Faced Safaris Limited">Lappet Faced Safaris Limited</option>
                                                <option value="MSG Touristic">MSG Touristic</option>
                                                <option value="Remote Safari Company">Remote Safari Company</option>
                                                <option value="Safina Tours & Safaris">Safina Tours & Safaris</option>
                                                <option value="Tour Operators">Tour Operators</option>
                                            </select>
                                            <ChevronDownIcon className="w-3 h-3 absolute right-2 top-2 text-gray-400 pointer-events-none" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-gray-500 block mb-1">Market Code</label>
                                        <div className="relative">
                                            <select
                                                value={formData.marketCode}
                                                onChange={e => setFormData({ ...formData, marketCode: e.target.value })}
                                                className="w-full border border-gray-300 rounded px-2 py-1.5 bg-white text-xs appearance-none pr-6"
                                            >
                                                <option value="">-Select-</option>
                                                <option value="OTA(Online Travel Agent)">OTA(Online Travel Agent)</option>

                                            </select>
                                            <ChevronDownIcon className="w-3 h-3 absolute right-2 top-2 text-gray-400 pointer-events-none" />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Row 3: Checkboxes (Advanced Only) */}
                            {isAdvancedMode && (
                                <div className="flex flex-wrap gap-6 pt-2 items-center">
                                    <div className="flex items-center gap-2">
                                        <label className="text-[11px] text-gray-600">Rate Offered:</label>
                                        <input type="checkbox" checked={formData.rateOffered} onChange={e => setFormData({ ...formData, rateOffered: e.target.checked })} className="rounded-sm border-gray-300 w-3.5 h-3.5 text-blue-600" />
                                        <span className="text-[11px] text-gray-400">Contract</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <input type="checkbox" checked={formData.bookAllAvailable} onChange={e => setFormData({ ...formData, bookAllAvailable: e.target.checked })} className="rounded-sm border-gray-300 w-3.5 h-3.5 text-blue-600" />
                                        <span className="text-[11px] text-gray-600">Book All Available Rooms</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <input type="checkbox" checked={formData.quickGroupBooking} onChange={e => setFormData({ ...formData, quickGroupBooking: e.target.checked })} className="rounded-sm border-gray-300 w-3.5 h-3.5 text-blue-600" />
                                        <span className="text-[11px] text-gray-600">Quick Group Booking</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <input type="checkbox" checked={formData.complimentaryRoom} onChange={e => setFormData({ ...formData, complimentaryRoom: e.target.checked })} className="rounded-sm border-gray-300 w-3.5 h-3.5 text-blue-600" />
                                        <span className="text-[11px] text-gray-600">Complimentary Room</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Rooms Grid */}
                        <div className="bg-white p-4 rounded border border-gray-200 shadow-sm space-y-2">
                            <div className="hidden md:grid grid-cols-[2fr_1.5fr_1.5fr_0.5fr_0.5fr_1fr_0.3fr] gap-3 mb-1 px-1">
                                <label className="text-[10px] font-bold text-gray-700">Room Type</label>
                                <label className="text-[10px] font-bold text-gray-700">Rate Type</label>
                                <label className="text-[10px] font-bold text-gray-700">Room</label>
                                <label className="text-[10px] font-bold text-gray-700">Adult</label>
                                <label className="text-[10px] font-bold text-gray-700">Child</label>
                                <label className="text-[10px] font-bold text-gray-700 text-right">Rate ($) (Tax Inc.)</label>
                                <span className="w-5"></span>
                            </div>

                            {formData.selectedRooms.map((room) => (
                                <div key={room.id} className="grid grid-cols-1 md:grid-cols-[2fr_1.5fr_1.5fr_0.5fr_0.5fr_1fr_0.3fr] gap-3 items-center bg-white rounded border border-gray-200 p-3 md:p-0 md:border-none mb-3 md:mb-0 shadow-sm md:shadow-none">
                                    {/* Room Type */}
                                    <div className="relative">
                                        <label className="md:hidden text-[10px] font-bold text-gray-500 mb-1 block">Room Type</label>
                                        <select
                                            value={room.roomType}
                                            onChange={e => {
                                                const newType = e.target.value as SuiteType;
                                                setFormData(prev => ({
                                                    ...prev,
                                                    selectedRooms: prev.selectedRooms.map(r => {
                                                        if (r.id === room.id) {
                                                            const sampleRoom = availableRooms.find(ar => ar.suiteType === newType);
                                                            const newPrice = sampleRoom ? sampleRoom.price : 0;
                                                            return { ...r, roomType: newType, roomName: '', price: newPrice };
                                                        }
                                                        return r;
                                                    })
                                                }));
                                            }}
                                            className="w-full pl-2 pr-6 py-1.5 bg-white border border-gray-300 rounded-sm text-xs focus:ring-blue-500 focus:border-blue-500 appearance-none text-gray-700"
                                        >
                                            <option value="">-- Select Type --</option>
                                            {/* Force show current selection if missing */}
                                            {room.roomType && !availableRoomTypes.some(t => t.suiteType === room.roomType) && (
                                                <option value={room.roomType}>{room.roomType} (Unavailable)</option>
                                            )}
                                            {availableRoomTypes.map(type => (
                                                <option key={type.id || type.suiteType} value={type.suiteType}>{type.suiteType}</option>
                                            ))}
                                        </select>
                                        <ChevronDownIcon className="absolute right-1 top-2 h-3 w-3 text-gray-400 pointer-events-none" />
                                    </div>

                                    {/* Rate Plan */}
                                    <div className="relative">
                                        <label className="md:hidden text-[10px] font-bold text-gray-500 mb-1 block">Rate Plan</label>
                                        <select
                                            value={room.rateType}
                                            onChange={e => handleRoomChange(room.id, 'rateType', e.target.value)}
                                            className="w-full pl-2 pr-6 py-1.5 bg-white border border-gray-300 rounded-sm text-xs focus:ring-blue-500 focus:border-blue-500 appearance-none text-gray-700"
                                        >
                                            <option value="">-Select-</option>
                                            <option value="Bed and Breakfast">Bed and Breakfast</option>
                                            <option value="Full Board">Full Board</option>
                                            <option value="Half Board">Half Board</option>
                                        </select>
                                        <ChevronDownIcon className="absolute right-1 top-2 h-3 w-3 text-gray-400 pointer-events-none" />
                                    </div>

                                    {/* Room Number - Dynamic Filtering */}
                                    <div className="relative">
                                        <label className="md:hidden text-[10px] font-bold text-gray-500 mb-1 block">Room No.</label>
                                        <select
                                            value={room.roomName}
                                            onChange={e => handleRoomChange(room.id, 'roomName', e.target.value)}
                                            className="w-full pl-2 pr-6 py-1.5 bg-white border border-gray-300 rounded-sm text-xs focus:ring-blue-500 focus:border-blue-500 appearance-none text-gray-700"
                                        >
                                            <option value="">-- Assign --</option>
                                            {/* Force show current selection if missing */}
                                            {room.roomName && !dynamicAvailableRooms.some(r => r.name === room.roomName) && (
                                                <option value={room.roomName}>{room.roomName} (Unavailable)</option>
                                            )}
                                            {dynamicAvailableRooms
                                                .filter(r => r.suiteType === room.roomType)
                                                .map(r => {
                                                    // @ts-ignore - isBooked added dynamically in useMemo above
                                                    const isUnavailable = r.isBooked;
                                                    return (
                                                        <option
                                                            key={r.id}
                                                            value={r.name}
                                                            disabled={isUnavailable}
                                                            className={isUnavailable ? 'text-gray-400 bg-gray-50' : ''}
                                                        >
                                                            {r.name} {isUnavailable ? '(Unavailable)' : ''}
                                                        </option>
                                                    );
                                                })}
                                        </select>
                                        <ChevronDownIcon className="absolute right-1 top-2 h-3 w-3 text-gray-400 pointer-events-none" />
                                    </div>

                                    {/* Adult */}
                                    <div>
                                        <label className="md:hidden text-[10px] font-bold text-gray-500 mb-1 block">Adults</label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={room.adults}
                                            onChange={e => handleRoomChange(room.id, 'adults', parseInt(e.target.value))}
                                            className="w-full px-2 py-1.5 bg-white border border-gray-300 rounded-sm text-xs focus:outline-none focus:border-blue-500 text-gray-700"
                                        />
                                    </div>

                                    {/* Child */}
                                    <div>
                                        <label className="md:hidden text-[10px] font-bold text-gray-500 mb-1 block">Children</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={room.children}
                                            onChange={e => handleRoomChange(room.id, 'children', parseInt(e.target.value))}
                                            className="w-full px-2 py-1.5 bg-white border border-gray-300 rounded-sm text-xs focus:outline-none focus:border-blue-500 text-gray-700"
                                        />
                                    </div>

                                    {/* Price */}
                                    <div className="relative">
                                        <label className="md:hidden text-[10px] font-bold text-gray-500 mb-1 block">Price ($)</label>
                                        <input
                                            type="number"
                                            value={room.price || ''}
                                            onChange={e => {
                                                const val = parseFloat(e.target.value);
                                                handleRoomChange(room.id, 'price', isNaN(val) ? 0 : val);
                                            }}
                                            className="w-full pl-2 pr-2 py-1.5 bg-gray-50 border border-gray-300 rounded-sm text-xs text-right focus:outline-none focus:border-blue-500 text-gray-700"
                                        />
                                    </div>

                                    {/* Remove */}
                                    <button onClick={() => handleRemoveRoom(room.id)} className="text-red-300 hover:text-red-500 flex justify-center">
                                        <TrashIcon className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}

                            <div className="flex justify-between items-center pt-3 border-t border-gray-100 mt-2">
                                <div className="flex gap-2">
                                    <button onClick={handleAddRoom} className="px-3 py-1.5 border border-blue-400 text-blue-500 text-xs font-medium rounded-sm hover:bg-blue-50 transition-colors">
                                        Add Room
                                    </button>
                                    {isAdvancedMode && (
                                        <button className="px-3 py-1.5 border border-gray-300 text-gray-500 text-xs font-medium rounded-sm hover:bg-gray-50 transition-colors">
                                            Add Discount
                                        </button>
                                    )}
                                </div>
                                <div className="text-right flex gap-4 items-center">
                                    <span className="text-xs font-bold text-gray-600">Total</span>
                                    <span className="text-sm font-bold text-red-500">${formData.totalAmount.toFixed(2)}</span>
                                </div>
                            </div>

                            {/* Payment & Balance Row */}
                            <div className="flex justify-end items-center gap-6 pt-2 pb-1 px-1 border-t border-gray-100 mt-2">
                                <div className="flex items-center gap-2">
                                    <label className="text-xs font-bold text-gray-600">Total Bill:</label>
                                    <span className="text-sm font-bold text-gray-800">${formData.totalAmount.toFixed(2)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <label className="text-xs font-bold text-gray-600">Paid Amount ($):</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={formData.paidAmount}
                                        onChange={e => setFormData({ ...formData, paidAmount: parseFloat(e.target.value) || 0 })}
                                        className="w-24 px-2 py-1 bg-white border border-gray-300 rounded-sm text-xs text-right font-bold focus:outline-none focus:border-blue-500"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <label className="text-xs font-bold text-gray-600">Balance ($):</label>
                                    <span className={`text-sm font-bold ${(formData.totalAmount - formData.paidAmount) > 0.01 ? 'text-red-600' : 'text-green-600'}`}>
                                        ${(formData.totalAmount - formData.paidAmount).toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Guest Information - Basic */}
                        <div className="bg-white p-4 rounded border border-gray-200 shadow-sm">
                            <h4 className="text-[11px] font-bold text-gray-600 mb-3 uppercase tracking-wide">Guest Information</h4>
                            <div className="grid grid-cols-12 gap-4">
                                {/* Name Combined */}
                                <div className="col-span-12 md:col-span-5 flex gap-2">
                                    <div className="w-20">
                                        <label className="text-[10px] text-gray-500 block mb-1">Guest Name</label>
                                        <div className="relative">
                                            <select
                                                value={formData.guestTitle}
                                                onChange={e => setFormData({ ...formData, guestTitle: e.target.value })}
                                                className="w-full pl-2 pr-5 py-2 bg-white border border-gray-300 rounded-sm text-xs appearance-none text-gray-700"
                                            >
                                                <option>Mr.</option>
                                                <option>Ms.</option>
                                                <option>Mrs.</option>
                                                <option>Dr.</option>
                                            </select>
                                            <ChevronDownIcon className="absolute right-1 top-2.5 h-3 w-3 text-gray-400 pointer-events-none" />
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <label className="text-[10px] text-gray-500 block mb-1">&nbsp;</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={formData.guestFirstName}
                                                onChange={e => setFormData({ ...formData, guestFirstName: e.target.value })}
                                                placeholder="Guest Name (First Last)"
                                                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-sm text-xs focus:ring-blue-500 focus:border-blue-500 text-gray-700"
                                            />
                                            {/* <UserIcon className="absolute right-2 top-2 h-4 w-4 text-gray-300" /> */}
                                        </div>
                                    </div>
                                    <button className="self-end mb-1 p-1 text-gray-400 hover:text-blue-500 border border-gray-300 rounded-sm"><UserIcon className="w-4 h-4" /></button>
                                </div>

                                {/* Mobile */}
                                <div className="col-span-12 md:col-span-3">
                                    <label className="text-[10px] text-gray-500 block mb-1">Mobile</label>
                                    <input
                                        type="tel"
                                        value={formData.guestMobile}
                                        onChange={e => setFormData({ ...formData, guestMobile: e.target.value })}
                                        placeholder="Mobile"
                                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-sm text-xs focus:ring-blue-500 focus:border-blue-500 text-gray-700"
                                    />
                                </div>

                                {/* Email */}
                                <div className="col-span-12 md:col-span-4">
                                    <label className="text-[10px] text-gray-500 block mb-1">Email</label>
                                    <input
                                        type="email"
                                        value={formData.guestEmail}
                                        onChange={e => setFormData({ ...formData, guestEmail: e.target.value })}
                                        placeholder="Email"
                                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-sm text-xs focus:ring-blue-500 focus:border-blue-500 text-gray-700"
                                    />
                                </div>
                            </div>

                            {/* Address & Extended Info - CONDITIONAL RENDER */}
                            {isAdvancedMode && (
                                <div className="mt-4 pt-0 animate-in slide-in-from-top-2 duration-300">
                                    <div className="grid grid-cols-12 gap-4">
                                        <div className="col-span-12">
                                            <label className="text-[10px] text-gray-500 mb-1 block">Address</label>
                                            <input
                                                type="text"
                                                value={formData.guestAddress}
                                                onChange={e => setFormData({ ...formData, guestAddress: e.target.value })}
                                                placeholder="Street Address"
                                                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-sm text-xs mb-2 text-gray-700"
                                            />
                                            <div className="grid grid-cols-4 gap-4">
                                                <input
                                                    type="text"
                                                    placeholder="Country"
                                                    value={formData.guestCountry}
                                                    onChange={e => setFormData({ ...formData, guestCountry: e.target.value })}
                                                    className="px-3 py-2 bg-white border border-gray-300 rounded-sm text-xs text-gray-700"
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="State"
                                                    value={formData.guestState}
                                                    onChange={e => setFormData({ ...formData, guestState: e.target.value })}
                                                    className="px-3 py-2 bg-white border border-gray-300 rounded-sm text-xs text-gray-700"
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="City"
                                                    value={formData.guestCity}
                                                    onChange={e => setFormData({ ...formData, guestCity: e.target.value })}
                                                    className="px-3 py-2 bg-white border border-gray-300 rounded-sm text-xs text-gray-700"
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="Zip"
                                                    value={formData.guestZip}
                                                    onChange={e => setFormData({ ...formData, guestZip: e.target.value })}
                                                    className="px-3 py-2 bg-white border border-gray-300 rounded-sm text-xs text-gray-700"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-4 space-y-2">
                                        <h4 className="text-[11px] font-bold text-gray-600 mb-2 uppercase tracking-wide">Other Information</h4>
                                        <div className="flex items-center gap-6">
                                            <div className="flex items-center gap-1.5">
                                                <input type="checkbox" checked={formData.emailBookingVouchers} onChange={e => setFormData({ ...formData, emailBookingVouchers: e.target.checked })} className="rounded-sm border-gray-300 text-blue-600 focus:ring-blue-500" />
                                                <label className="text-[11px] text-gray-600">Email Booking Vouchers</label>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <input type="checkbox" checked={formData.sendEmailAtCheckout} onChange={e => setFormData({ ...formData, sendEmailAtCheckout: e.target.checked })} className="rounded-sm border-gray-300 text-blue-600 focus:ring-blue-500" />
                                                <label className="text-[11px] text-gray-600">Send email at Check-out</label>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <input type="checkbox" checked={formData.accessToGuestPortal} onChange={e => setFormData({ ...formData, accessToGuestPortal: e.target.checked })} className="rounded-sm border-gray-300 text-blue-600 focus:ring-blue-500" />
                                                <label className="text-[11px] text-gray-600">Access To Guest Portal</label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                    </div >

                    {/* Right Sidebar - Billing Summary - CONDITIONAL RENDER */}
                    {
                        isAdvancedMode && (
                            <div className="w-full md:w-[320px] bg-white border-t md:border-t-0 md:border-l border-gray-200 shadow-xl flex flex-col z-20 animate-in slide-in-from-right-10 duration-300 flex-shrink-0">
                                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white">
                                    <h4 className="font-bold text-gray-700 text-sm">Billing Summary</h4>

                                </div>

                                <div className="p-5 flex-1 overflow-y-auto space-y-5 bg-gray-50/50">
                                    {/* Dates Summary */}
                                    <div className="flex justify-between items-center text-center pb-4 border-b border-gray-200">
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-500 uppercase">Check-in</p>
                                            <p className="text-sm font-bold text-gray-800 mt-1">{formData.checkInDate || '--/--/--'}</p>
                                        </div>
                                        <div className="text-gray-300 text-lg">→</div>
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-500 uppercase">Check-out</p>
                                            <p className="text-sm font-bold text-gray-800 mt-1">{formData.checkOutDate || '--/--/--'}</p>
                                        </div>
                                    </div>

                                    {/* Cost Breakdown */}
                                    <div className="space-y-2 pb-4 border-b border-gray-200">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-gray-600 font-medium">Room Charges</span>
                                            <span className="font-bold text-gray-800">{formData.totalAmount.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-gray-600 font-medium">Taxes</span>
                                            <span className="font-bold text-gray-800">0.00</span>
                                        </div>
                                        <div className="flex justify-between text-sm font-bold pt-2 text-gray-900 border-t border-gray-200 mt-2">
                                            <span>Due Amount</span>
                                            <span>${formData.totalAmount.toFixed(2)}</span>
                                        </div>
                                    </div>

                                    {/* Bill To */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] font-bold text-gray-500 mb-1 block">Bill To</label>
                                            <div className="relative">
                                                <select
                                                    value={formData.billTo}
                                                    onChange={e => setFormData({ ...formData, billTo: e.target.value })}
                                                    className="w-full pl-2 pr-6 py-1.5 bg-white border border-gray-300 rounded text-xs appearance-none"
                                                >
                                                    <option>-Select-</option>
                                                    <option>Guest</option>
                                                    <option>Company</option>
                                                </select>
                                                <ChevronDownIcon className="absolute right-1 top-2 h-3 w-3 text-gray-400 pointer-events-none" />
                                            </div>
                                        </div>
                                        <div className="flex items-center pt-5">
                                            <input type="checkbox" checked={formData.taxExempt} onChange={e => setFormData({ ...formData, taxExempt: e.target.checked })} className="rounded-sm border-gray-300 w-3.5 h-3.5 text-blue-600 mr-2" />
                                            <label className="text-xs text-gray-600">Tax Exempt</label>
                                        </div>
                                    </div>

                                    {/* Payment Mode */}
                                    <div className="flex items-center gap-2 mt-4">
                                        <input type="checkbox" checked={formData.paymentMode} onChange={e => setFormData({ ...formData, paymentMode: e.target.checked })} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5" />
                                        <label className="text-xs text-gray-700 font-medium">Payment Mode</label>
                                    </div>

                                </div>
                            </div>
                        )
                    }
                </div >

                {/* Footer Buttons */}
                < div className="bg-white border-t border-gray-200 px-6 py-4 flex justify-between items-center z-10 shrink-0" >
                    <button
                        onClick={() => setIsAdvancedMode(!isAdvancedMode)}
                        className="px-4 py-2 bg-white border border-blue-400 text-blue-500 text-xs font-bold uppercase rounded hover:bg-blue-50 transition-colors shadow-sm"
                    >
                        {isAdvancedMode ? 'Less Options' : 'More Options'}
                    </button>

                    <div className="flex gap-3">
                        {isAdvancedMode && (
                            <button
                                onClick={onClose}
                                className="px-5 py-2 bg-white border border-gray-300 text-gray-600 text-xs font-bold uppercase rounded hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                        )}
                        <button
                            onClick={handleSubmit}
                            disabled={loading || isSubmitting}
                            className="px-6 py-2 bg-blue-600 text-white text-xs font-bold uppercase tracking-wider rounded shadow-md hover:bg-blue-700 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isAdvancedMode ? 'Reserve' : (loading || isSubmitting ? 'Processing...' : 'Confirm')}
                        </button>
                    </div>
                </div >

            </div >
        </div >
    );
};

export default QuickReservationModal;
