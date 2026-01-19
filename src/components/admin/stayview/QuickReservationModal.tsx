import React, { useState, useEffect, useMemo, useRef } from 'react';
import { XMarkIcon, PlusIcon, TrashIcon, UserIcon, ChevronDownIcon, ArrowsPointingOutIcon } from '@heroicons/react/24/outline';
import { SuiteType, RoomType, Booking, Room, MealPlanSettings, ActiveCoupon, getAllActiveCoupons, getGuests, GuestProfile } from '@/lib/firestoreService';
import { calculateDiscountAmount } from '@/lib/offers';
import { useToast } from '@/context/ToastContext';

interface QuickReservationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (bookingData: any) => Promise<void>;
    initialDate?: Date;
    initialSuiteType?: SuiteType;
    initialRoomName?: string;
    roomTypes: RoomType[];
    availableRooms: Room[];
    bookings?: Booking[];
    loading?: boolean;
    mealPlanSettings?: MealPlanSettings;
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
    loading = false,
    mealPlanSettings
}) => {
    const { showToast } = useToast();
    const [isAdvancedMode, setIsAdvancedMode] = useState(false);
    const lastToastRef = useRef(0); // Debounce ref for toast messages

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

            roomName: roomNameArg || '',
            adults: 2,
            children: 0,
            price: initialPrice,
            mealPlan: 'BB',
            mealPlanPrice: 0
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

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [coupons, setCoupons] = useState<ActiveCoupon[]>([]);
    const [selectedCoupon, setSelectedCoupon] = useState<ActiveCoupon | null>(null);
    const [showDiscountInput, setShowDiscountInput] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);
    const [isSearchingGuest, setIsSearchingGuest] = useState(false);
    const [guestQuery, setGuestQuery] = useState('');
    const [guestSearchResult, setGuestSearchResult] = useState<GuestProfile | null>(null);



    // Validation Logic
    const validateForm = () => {
        const newErrors: Record<string, string> = {};
        let isValid = true;

        if (!formData.guestFirstName.trim()) {
            newErrors.guestFirstName = "First Name is required";
            isValid = false;
        }

        if (!formData.guestLastName.trim()) {
            newErrors.guestLastName = "Last Name is required";
            isValid = false;
        }

        if (formData.guestEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.guestEmail)) {
            newErrors.guestEmail = "Invalid email format";
            isValid = false;
        }

        if (formData.guestMobile && !/^[\d\s+\-()]+$/.test(formData.guestMobile)) {
            newErrors.guestMobile = "Invalid phone number";
            isValid = false;
        }

        if (formData.paidAmount < 0) {
            newErrors.paidAmount = "Paid amount cannot be negative";
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    // Fetch coupons on mount
    useEffect(() => {
        const fetchCoupons = async () => {
            const activeCoupons = await getAllActiveCoupons();
            setCoupons(activeCoupons);
        };
        fetchCoupons();
    }, []);


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
            adults: 2,
            children: 0,
            roomNumber: '',
            amenities: [],
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, initialDate ? initialDate.toISOString() : null, initialRoomName, initialSuiteType]); // Fix: Use ISO string for stable comparison instead of object reference

    // Recalculate Total including discount
    // Recalculate Total including discount - REFACTORED FOR ROOM ONLY DISCOUNT
    useEffect(() => {
        const currentRooms = formData.selectedRooms;

        // 1. Calculate Room Total (Subject to Discount)
        const roomDailyTotal = currentRooms.reduce((acc, r) => acc + (r.price || 0), 0);
        const roomTotalForStay = roomDailyTotal * formData.nights;

        // 2. Calculate Meal Plan Total (Excluded from Discount)
        const mealPlanDailyTotal = calculateMealPlanDailyTotal(currentRooms, mealPlanSettings);
        const mealPlanTotalForStay = mealPlanDailyTotal * formData.nights;

        // 3. Calculate Discount on ROOM PRICE ONLY
        let discountAmount = 0;
        if (selectedCoupon) {
            discountAmount = calculateDiscountAmount(roomTotalForStay, selectedCoupon, formData.nights);
        }

        // 4. Final Total
        const total = Math.max(0, (roomTotalForStay - discountAmount) + mealPlanTotalForStay);

        setFormData(prev => ({ ...prev, totalAmount: total }));

    }, [formData.selectedRooms, formData.nights, mealPlanSettings, selectedCoupon]);


    const handleAddRoom = () => {
        const defaultType = 'Garden Suite';

        setFormData(prev => ({
            ...prev,
            selectedRooms: [
                ...prev.selectedRooms,
                {
                    id: Date.now().toString(),
                    roomType: defaultType,
                    roomName: '',
                    adults: 2,
                    children: 0,
                    price: suitePrices[defaultType] || 0,
                    mealPlan: 'BB',
                    mealPlanPrice: 0
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

                    // Recalculate Meal Plan Price
                    if (mealPlanSettings && (field === 'mealPlan' || field === 'adults' || field === 'children')) {
                        const mp = field === 'mealPlan' ? value : r.mealPlan || 'BB';
                        const ad = field === 'adults' ? value : r.adults;
                        const ch = field === 'children' ? value : r.children;

                        let supplement = 0;
                        if (mp === 'HB') {
                            supplement = (ad * mealPlanSettings.adultHalfBoardPrice) + (ch * mealPlanSettings.childHalfBoardPrice);
                        } else if (mp === 'FB') {
                            supplement = (ad * mealPlanSettings.adultFullBoardPrice) + (ch * mealPlanSettings.childFullBoardPrice);
                        }
                        updated.mealPlanPrice = supplement;
                        if (field !== 'mealPlan' && !updated.mealPlan) updated.mealPlan = 'BB';
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

    const handleSubmit = async () => {
        if (!validateForm()) {
            showToast('Please fix the errors in the form', 'error');
            return;
        }

        try {
            setIsSubmitting(true);
            const bookingData: any = { ...formData };

            if (selectedCoupon) {
                // REFACTORED: Discount on Room Only
                const roomDailyTotal = formData.selectedRooms.reduce((acc, r: any) => acc + (r.price || 0), 0);
                const roomTotalForStay = roomDailyTotal * formData.nights;

                // Meal Plan not needed for discount calc, but needed for final (already in totalAmount)
                // const mealPlanTotal = getMealPlanTotal() * formData.nights; 

                let discountAmount = calculateDiscountAmount(roomTotalForStay, selectedCoupon, formData.nights);

                bookingData.discount = {
                    code: selectedCoupon.code,
                    amount: discountAmount,
                    discountType: selectedCoupon.discountType,
                    discountValue: selectedCoupon.discountValue,
                };
            }

            await onSubmit(bookingData);
        } catch (error) {
            console.error("Submission failed", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const calculateMealPlanDailyTotal = (rooms: any[], settings?: MealPlanSettings) => {
        return rooms.reduce((acc, r) => {
            let supplement = 0;
            if (settings) {
                if (r.mealPlan === 'HB') supplement = (r.adults * settings.adultHalfBoardPrice) + (r.children * settings.childHalfBoardPrice);
                if (r.mealPlan === 'FB') supplement = (r.adults * settings.adultFullBoardPrice) + (r.children * settings.childFullBoardPrice);
            }
            return acc + supplement;
        }, 0);
    };

    const getMealPlanTotal = () => calculateMealPlanDailyTotal(formData.selectedRooms, mealPlanSettings);


    // Guest Auto-fill Logic
    // Guest Auto-fill Logic
    const handleGuestSearch = async () => {
        if (!guestQuery || guestQuery.length < 3) {
            showToast('Please enter at least 3 digits to search', 'error');
            return;
        }

        setIsSearchingGuest(true);
        setGuestSearchResult(null);
        try {
            const allGuests = await getGuests();
            const normalize = (s: string) => s?.replace(/\D/g, '') || '';
            const searchNum = normalize(guestQuery);

            const found = allGuests.find(g => {
                const gPhone = normalize(g.phone);
                // Match Phone or ID (if available, assuming idDocumentNumber property existence valid or loose check)
                // For safety, checking phone primarily as requested
                return gPhone.includes(searchNum);
            });

            if (found) {
                setGuestSearchResult(found);
                showToast('Guest found! Review and click Auto-fill.', 'success');
            } else {
                showToast('No guest found.', 'error');
            }
        } catch (error) {
            console.error("Guest lookup failed", error);
        } finally {
            setIsSearchingGuest(false);
        }
    };

    const applyGuestData = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        // Debounce Toast: Prevent double firing within 1 second
        if (Date.now() - lastToastRef.current < 1000) return;
        lastToastRef.current = Date.now();

        if (!guestSearchResult) return;
        const found = guestSearchResult;

        setFormData(prev => ({
            ...prev,
            guestFirstName: found.firstName || '',
            guestLastName: found.lastName || '',
            guestEmail: found.email || '',
            guestMobile: found.phone || '',
            guestAddress: found.address?.street || '',
            guestCity: found.address?.city || '',
        }));

        showToast('Guest details applied successfully.', 'success');
        setGuestSearchResult(null);
        setGuestQuery('');
    };



    const handleCancelClick = () => {
        const isDirty = (formData.guestFirstName && formData.guestFirstName.trim().length > 0) ||
            (formData.guestLastName && formData.guestLastName.trim().length > 0) ||
            formData.selectedRooms.length > 1;
        if (isDirty) {
            setShowCancelConfirm(true);
        } else {
            onClose();
        }
    };

    const confirmCancel = () => {
        setShowCancelConfirm(false);
        onClose();
    };


    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className={`bg-[#f8f9fa] shadow-2xl transition-all duration-300 ease-in-out flex flex-col rounded-lg overflow-hidden font-sans
                    ${isAdvancedMode ? 'w-full max-w-7xl h-[85vh]' : 'w-full max-w-6xl h-auto max-h-[90vh]'}
                `}
            >
                {/* Header */}
                <div className="bg-white px-6 py-4 border-b border-gray-200 flex justify-between items-center flex-shrink-0 shadow-sm z-10">
                    <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        {isAdvancedMode ? 'Complete Reservation' : 'Quick Reservation'}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-full">
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </div>

                {/* Main Content (Scrollable) */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">

                    {/* Guest Lookup Section */}
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex flex-col gap-3 mb-2">
                        <label className="text-xs font-bold text-blue-800 uppercase tracking-wider flex items-center gap-2">
                            <UserIcon className="h-4 w-4" /> Guest Lookup
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Enter Mobile Number or ID"
                                className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={guestQuery}
                                onChange={(e) => setGuestQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleGuestSearch()}
                            />
                            <button
                                onClick={handleGuestSearch}
                                disabled={isSearchingGuest}
                                className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
                            >
                                {isSearchingGuest ? 'Searching...' : 'Search'}
                            </button>
                        </div>

                        {/* Search Result Card */}
                        {guestSearchResult && (
                            <div className="bg-white p-3 rounded border border-blue-200 shadow-sm flex justify-between items-center animate-in fade-in slide-in-from-top-2">
                                <div>
                                    <p className="text-sm font-bold text-gray-800">{guestSearchResult.firstName} {guestSearchResult.lastName}</p>
                                    <p className="text-xs text-gray-500">{guestSearchResult.phone} • {guestSearchResult.email}</p>
                                </div>
                                <button
                                    onClick={applyGuestData}
                                    type="button"
                                    className="bg-green-600 text-white px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider hover:bg-green-700"
                                >
                                    Auto-fill Form
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Top Config Section */}
                    <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                            {/* Date Picker */}
                            <div className="col-span-12 md:col-span-6 flex items-stretch border border-gray-300 rounded-md overflow-hidden h-12">
                                <div className="flex-1 px-3 py-1 flex flex-col justify-center border-r border-gray-200 hover:bg-gray-50 transition-colors">
                                    <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Check-in</label>
                                    <input type="date" value={formData.checkInDate} onChange={e => setFormData({ ...formData, checkInDate: e.target.value })} className="bg-transparent text-gray-800 font-bold text-sm focus:outline-none w-full" />
                                </div>
                                <div className="w-14 bg-blue-50 flex flex-col items-center justify-center text-blue-700 border-r border-gray-200">
                                    <span className="text-sm font-extrabold leading-none">{formData.nights}</span>
                                    <span className="text-[9px] uppercase font-bold opacity-70">Nights</span>
                                </div>
                                <div className="flex-1 px-3 py-1 flex flex-col justify-center hover:bg-gray-50 transition-colors">
                                    <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Check-out</label>
                                    <input type="date" min={formData.checkInDate} value={formData.checkOutDate} onChange={e => setFormData({ ...formData, checkOutDate: e.target.value })} className="bg-transparent text-gray-800 font-bold text-sm focus:outline-none w-full" />
                                </div>
                            </div>

                            {/* Reservation Type */}
                            <div className="col-span-12 md:col-span-3">
                                <label className="text-[11px] font-semibold text-gray-500 mb-1.5 block">Type</label>
                                <select value={formData.reservationType} onChange={e => setFormData({ ...formData, reservationType: e.target.value })} className="w-full h-10 pl-3 pr-8 bg-white border border-gray-300 rounded-md text-sm text-gray-700 focus:ring-2 focus:ring-blue-100 focus:border-blue-400 appearance-none shadow-sm">
                                    <option>Walk In</option>
                                    <option>Confirm Booking</option>
                                    <option>Tentative</option>
                                    <option>Waitlist</option>
                                </select>
                            </div>

                            {/* Source (Simple Mode) */}
                            {!isAdvancedMode && (
                                <div className="col-span-12 md:col-span-3">
                                    <label className="text-[11px] font-semibold text-gray-500 mb-1.5 block">Source</label>
                                    <select value={formData.businessSource} onChange={e => setFormData({ ...formData, businessSource: e.target.value })} className="w-full h-10 pl-3 pr-8 bg-white border border-gray-300 rounded-md text-sm text-gray-700 focus:ring-2 focus:ring-blue-100 focus:border-blue-400 appearance-none shadow-sm">
                                        <option value="">- Select Source -</option>
                                        <option value="Direct">Direct</option>
                                        <option value="Agoda">Agoda</option>
                                        <option value="Booking.com">Booking.com</option>
                                        <option value="Expedia">Expedia</option>
                                        <option value="Walk In">Walk In</option>
                                    </select>
                                </div>
                            )}
                        </div>

                        {/* Advanced Fields */}
                        {isAdvancedMode && (
                            <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-4 animate-in slide-in-from-top-2">
                                <div>
                                    <label className="text-[11px] font-semibold text-gray-500 mb-1.5 block">Booking Source</label>
                                    <select value={formData.bookingSource} onChange={e => setFormData({ ...formData, bookingSource: e.target.value })} className="w-full h-9 px-3 bg-gray-50 border border-gray-300 rounded-md text-xs text-gray-700">
                                        <option value="Direct">Direct</option>
                                        <option value="OTA">OTA</option>
                                        <option value="Booking Engine">Booking Engine</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[11px] font-semibold text-gray-500 mb-1.5 block">Business Source</label>
                                    <select value={formData.businessSource} onChange={e => setFormData({ ...formData, businessSource: e.target.value })} className="w-full h-9 px-3 bg-gray-50 border border-gray-300 rounded-md text-xs text-gray-700">
                                        <option value="Direct">Direct</option>
                                        <option value="Agoda">Agoda</option>
                                        <option value="Booking.com">Booking.com</option>
                                        <option value="Expedia">Expedia</option>
                                    </select>
                                </div>
                                <div className="col-span-1 md:col-span-3 flex flex-wrap gap-x-6 gap-y-3 pt-2">
                                    <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={formData.rateOffered} onChange={e => setFormData({ ...formData, rateOffered: e.target.checked })} className="rounded border-gray-300 text-blue-600" /> <span className="text-xs text-gray-600">Contract Rate</span></label>
                                    <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={formData.bookAllAvailable} onChange={e => setFormData({ ...formData, bookAllAvailable: e.target.checked })} className="rounded border-gray-300 text-blue-600" /> <span className="text-xs text-gray-600">Book All Available</span></label>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Rooms Grid */}
                    <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm space-y-3">
                        <div className="hidden md:grid grid-cols-12 gap-4 pb-2 border-b border-gray-100 px-1">
                            <div className="col-span-3 text-[10px] uppercase font-bold text-gray-400 tracking-wider">Room Type</div>
                            <div className="col-span-3 text-[10px] uppercase font-bold text-gray-400 tracking-wider">Room</div>
                            <div className="col-span-1 text-[10px] uppercase font-bold text-gray-400 tracking-wider text-center">Adl</div>
                            <div className="col-span-1 text-[10px] uppercase font-bold text-gray-400 tracking-wider text-center">Chd</div>
                            <div className="col-span-2 text-[10px] uppercase font-bold text-gray-400 tracking-wider">Meal Plan</div>
                            <div className="col-span-2 text-[10px] uppercase font-bold text-gray-400 tracking-wider text-right">Rate ($)</div>
                        </div>

                        {formData.selectedRooms.map((room) => (
                            <div key={room.id} className="relative group grid grid-cols-1 md:grid-cols-12 gap-3 items-center bg-gray-50 md:bg-white rounded-md border border-gray-200 p-4 md:p-0 md:border-none">
                                <div className="md:col-span-3">
                                    <select value={room.roomType} onChange={e => {
                                        const newType = e.target.value as SuiteType;
                                        setFormData(prev => ({
                                            ...prev,
                                            selectedRooms: prev.selectedRooms.map(r => r.id === room.id ? { ...r, roomType: newType, roomName: '', price: suitePrices[newType] || 0 } : r)
                                        }));
                                    }} className="w-full pl-2 pr-6 py-2 bg-white border border-gray-300 rounded-md text-xs focus:ring-2 focus:ring-blue-100 focus:border-blue-500 appearance-none text-gray-700 shadow-sm">
                                        <option value="">-- Select Type --</option>
                                        {availableRoomTypes.map(type => <option key={type.id || type.suiteType} value={type.suiteType}>{type.suiteType}</option>)}
                                    </select>
                                </div>

                                <div className="md:col-span-3">
                                    <select value={room.roomName} onChange={e => handleRoomChange(room.id, 'roomName', e.target.value)} className="w-full pl-2 pr-6 py-2 bg-white border border-gray-300 rounded-md text-xs focus:ring-2 focus:ring-blue-100 focus:border-blue-500 appearance-none text-gray-700 shadow-sm">
                                        <option value="">-- Assign --</option>
                                        {dynamicAvailableRooms.filter(r => r.suiteType === room.roomType).map(r => {
                                            // @ts-ignore
                                            const isUnavailable = r.isBooked;
                                            return <option key={r.id} value={r.name} disabled={isUnavailable} className={isUnavailable ? 'text-gray-400 bg-gray-50' : ''}>{r.name} {isUnavailable ? '(Unavailable)' : ''}</option>;
                                        })}
                                    </select>
                                </div>

                                <div className="md:col-span-1"><input type="number" min="1" value={room.adults} onChange={e => handleRoomChange(room.id, 'adults', parseInt(e.target.value))} className="w-full px-2 py-2 bg-white border border-gray-300 rounded-md text-xs text-center shadow-sm" /></div>
                                <div className="md:col-span-1"><input type="number" min="0" value={room.children} onChange={e => handleRoomChange(room.id, 'children', parseInt(e.target.value))} className="w-full px-2 py-2 bg-white border border-gray-300 rounded-md text-xs text-center shadow-sm" /></div>
                                <div className="md:col-span-2">
                                    <select value={room.mealPlan || 'BB'} onChange={e => handleRoomChange(room.id, 'mealPlan', e.target.value)} className="w-full pl-2 pr-6 py-2 bg-white border border-gray-300 rounded-md text-xs shadow-sm">
                                        <option value="BB">BB</option>
                                        <option value="HB">HB</option>
                                        <option value="FB">FB</option>
                                    </select>
                                </div>
                                <div className="md:col-span-2 flex items-center gap-2">
                                    <input type="number" value={room.price || ''} onChange={e => handleRoomChange(room.id, 'price', parseFloat(e.target.value))} className="w-full pl-2 pr-2 py-2 bg-indigo-50/50 border border-indigo-100 rounded-md text-xs text-right font-bold text-indigo-700 shadow-sm" />
                                    <button onClick={() => handleRemoveRoom(room.id)} className="text-gray-400 hover:text-red-500 transition-colors p-1 flex-shrink-0" title="Remove Room"><TrashIcon className="h-4 w-4" /></button>
                                </div>
                            </div>
                        ))}

                        <div className="flex flex-col md:flex-row justify-between items-center pt-4 border-t border-gray-100 mt-2 gap-4">
                            <div className="flex flex-col gap-3 w-full md:w-auto">
                                <div className="flex gap-3">
                                    <button onClick={handleAddRoom} className="flex items-center gap-1.5 px-3 py-2 border border-dashed border-blue-400 text-blue-600 text-xs font-bold uppercase rounded-md hover:bg-blue-50 transition-all hover:border-solid">
                                        <PlusIcon className="w-3.5 h-3.5" /> Add Room
                                    </button>
                                    <button onClick={() => setShowDiscountInput(!showDiscountInput)} className={`flex items-center gap-1.5 px-3 py-2 border text-xs font-bold uppercase rounded-md transition-all ${selectedCoupon ? 'border-green-200 text-green-700 bg-green-50' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
                                        {selectedCoupon ? 'Discount Applied' : 'Add Discount'}
                                    </button>
                                </div>
                                {showDiscountInput && (
                                    <div className="mt-1 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-3 shadow-sm">
                                        <label className="text-xs font-bold text-yellow-800 uppercase tracking-wide">Apply:</label>
                                        <select value={selectedCoupon?.code || ''} onChange={(e) => {
                                            const code = e.target.value;
                                            const coupon = coupons.find(c => c.code === code) || null;
                                            setSelectedCoupon(coupon);
                                        }} className="text-xs border border-yellow-300 rounded px-2 py-1.5 bg-white focus:ring-2 focus:ring-yellow-200 outline-none flex-1 min-w-[200px]">
                                            <option value="">- Select Offer -</option>
                                            {coupons.map(c => <option key={c.id} value={c.code}>{c.title} ({c.code}) - {c.discountType === 'percentage' ? `${c.discountValue}%` : `$${c.discountValue}`} Off</option>)}
                                        </select>
                                        {selectedCoupon && <button onClick={() => { setSelectedCoupon(null); setShowDiscountInput(false); }} className="text-yellow-600 hover:text-red-500 p-1"><XMarkIcon className="w-4 h-4" /></button>}
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col items-end gap-1">
                                {selectedCoupon && (
                                    <div className="flex gap-4 items-center justify-end text-green-600">
                                        <span className="text-xs font-medium">Discount ({selectedCoupon.code}):</span>
                                        <span className="text-sm font-bold">

                                            - $ {(() => {
                                                const roomDailyTotal = formData.selectedRooms.reduce((acc, r) => acc + (r.price || 0), 0);
                                                const roomTotalForStay = roomDailyTotal * formData.nights;
                                                // Discount solely on Room Price
                                                return calculateDiscountAmount(roomTotalForStay, selectedCoupon, formData.nights).toFixed(2);
                                            })()}
                                        </span>
                                    </div>
                                )}
                                <div className="flex gap-4 items-center">
                                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Total Estimated</span>
                                    <span className="text-2xl font-black text-gray-800 tracking-tight">${formData.totalAmount.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Guest Information */}
                    <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                        <h4 className="text-xs font-bold text-gray-400 mb-4 uppercase tracking-widest border-b border-gray-100 pb-2 flex items-center gap-2">
                            <UserIcon className="w-4 h-4" /> Guest Details
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                            <div className="col-span-12 md:col-span-4 flex gap-1">
                                <div className="w-20">
                                    <select value={formData.guestTitle} onChange={e => setFormData({ ...formData, guestTitle: e.target.value })} className="w-full pl-2 pr-6 py-2.5 bg-gray-50 border border-gray-300 rounded-l-md text-sm">
                                        <option>Mr.</option>
                                        <option>Ms.</option>
                                        <option>Mrs.</option>
                                    </select>
                                </div>
                                <div className="flex-1">
                                    <input type="text" value={formData.guestFirstName} onChange={e => {
                                        setFormData({ ...formData, guestFirstName: e.target.value });
                                        if (errors.guestFirstName) setErrors(prev => ({ ...prev, guestFirstName: '' }));
                                    }} placeholder="First Name" className={`w-full px-3 py-2.5 bg-white border-y border-r border-l-0 ${errors.guestFirstName ? 'border-red-500' : 'border-gray-300'} rounded-r-md text-sm`} />
                                    {errors.guestFirstName && <p className="text-xs text-red-500 mt-1">{errors.guestFirstName}</p>}
                                </div>
                            </div>

                            <div className="col-span-12 md:col-span-4">
                                <input type="text" value={formData.guestLastName} onChange={e => {
                                    setFormData({ ...formData, guestLastName: e.target.value });
                                    if (errors.guestLastName) setErrors(prev => ({ ...prev, guestLastName: '' }));
                                }} placeholder="Last Name" className={`w-full px-4 py-2.5 bg-white border ${errors.guestLastName ? 'border-red-500' : 'border-gray-300'} rounded-md text-sm`} />
                                {errors.guestLastName && <p className="text-xs text-red-500 mt-1">{errors.guestLastName}</p>}
                            </div>

                            <div className="col-span-12 md:col-span-4">
                                <input type="tel" value={formData.guestMobile} onChange={e => {
                                    const val = e.target.value;
                                    setFormData({ ...formData, guestMobile: val });
                                    if (val && !/^[\d\s+\-()]*$/.test(val)) {
                                        setErrors(prev => ({ ...prev, guestMobile: "Invalid phone" }));
                                    } else {
                                        setErrors(prev => ({ ...prev, guestMobile: '' }));
                                    }
                                }} placeholder="Mobile Number" className={`w-full px-4 py-2.5 bg-white border ${errors.guestMobile ? 'border-red-500' : 'border-gray-300'} rounded-md text-sm`} />
                                {errors.guestMobile && <p className="text-xs text-red-500 mt-1">{errors.guestMobile}</p>}
                            </div>

                            <div className="col-span-12">
                                <input type="email" value={formData.guestEmail} onChange={e => {
                                    const val = e.target.value;
                                    setFormData({ ...formData, guestEmail: val });
                                    if (val && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
                                        setErrors(prev => ({ ...prev, guestEmail: "Invalid email" }));
                                    } else {
                                        setErrors(prev => ({ ...prev, guestEmail: '' }));
                                    }
                                }} placeholder="Email Address" className={`w-full px-4 py-2.5 bg-white border ${errors.guestEmail ? 'border-red-500' : 'border-gray-300'} rounded-md text-sm`} />
                                {errors.guestEmail && <p className="text-xs text-red-500 mt-1">{errors.guestEmail}</p>}
                            </div>
                        </div>

                        {isAdvancedMode && (
                            <div className="mt-5 pt-4 border-t border-gray-100 animate-in slide-in-from-top-2">
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                                    <div className="col-span-12">
                                        <input type="text" value={formData.guestAddress} onChange={e => setFormData({ ...formData, guestAddress: e.target.value })} placeholder="Street Address" className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-md text-sm mb-3" />
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                            <input type="text" placeholder="Country" value={formData.guestCountry} onChange={e => setFormData({ ...formData, guestCountry: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-md text-sm" />
                                            <input type="text" placeholder="State" value={formData.guestState} onChange={e => setFormData({ ...formData, guestState: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-md text-sm" />
                                            <input type="text" placeholder="City" value={formData.guestCity} onChange={e => setFormData({ ...formData, guestCity: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-md text-sm" />
                                            <input type="text" placeholder="Zip" value={formData.guestZip} onChange={e => setFormData({ ...formData, guestZip: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-md text-sm" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Payment / Billing Section (Visible in main flow now, ensuring 'fields' are seen) */}
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 flex flex-col justify-between gap-4">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                            <div className="flex items-center gap-3">
                                <label className="text-xs font-bold text-gray-500 uppercase">Paid Amount ($)</label>
                                <div>
                                    <input type="number" min="0" value={formData.paidAmount} onChange={e => {
                                        const val = parseFloat(e.target.value) || 0;
                                        setFormData({ ...formData, paidAmount: val });

                                        if (val < 0) {
                                            setErrors(prev => ({ ...prev, paidAmount: 'Amount cannot be negative' }));
                                        } else {
                                            setErrors(prev => ({ ...prev, paidAmount: '' }));
                                        }
                                    }} className={`w-32 pl-3 pr-3 py-2 bg-white border ${errors.paidAmount ? 'border-red-500' : 'border-gray-300'} rounded-md text-sm font-bold shadow-sm`} />
                                    {errors.paidAmount && <p className="text-xs text-red-500 mt-1 absolute">{errors.paidAmount}</p>}
                                </div>
                            </div>
                            <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-md border border-gray-200 shadow-sm">
                                <label className="text-xs font-bold text-gray-500 uppercase">Balance Due</label>
                                <span className={`text-lg font-black ${(formData.totalAmount - formData.paidAmount) > 0.01 ? 'text-red-600' : 'text-green-600'}`}>
                                    ${(formData.totalAmount - formData.paidAmount).toFixed(2)}
                                </span>
                            </div>
                        </div>

                        {/* Extra Billing Options for Advanced View */}
                        {isAdvancedMode && (
                            <div className="pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="text-[10px] font-bold text-gray-500 mb-1 block">Bill To</label>
                                    <select value={formData.billTo} onChange={e => setFormData({ ...formData, billTo: e.target.value })} className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-xs">
                                        <option>Guest</option>
                                        <option>Company</option>
                                    </select>
                                </div>
                                <div className="flex items-center gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={formData.taxExempt} onChange={e => setFormData({ ...formData, taxExempt: e.target.checked })} className="rounded border-gray-300" /> <span className="text-xs">Tax Exempt</span></label>
                                    <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={formData.paymentMode} onChange={e => setFormData({ ...formData, paymentMode: e.target.checked })} className="rounded border-gray-300" /> <span className="text-xs">Pay Mode</span></label>
                                </div>
                            </div>
                        )}
                    </div>

                </div>

                {/* Footer */}
                <div className="bg-white border-t border-gray-200 px-6 py-4 flex justify-between items-center z-10 shrink-0">
                    <button onClick={() => setIsAdvancedMode(!isAdvancedMode)} className="px-5 py-2.5 bg-gray-50 border border-gray-300 text-gray-700 text-xs font-bold uppercase tracking-wider rounded-md hover:bg-gray-100 transition-colors shadow-sm">
                        {isAdvancedMode ? 'Standard View' : 'More Options'}
                    </button>
                    <div className="flex gap-3">
                        <button onClick={handleCancelClick} className="px-5 py-2.5 bg-white border border-gray-300 text-gray-600 text-xs font-bold uppercase tracking-wider rounded-md hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors">Cancel</button>
                        <button onClick={handleSubmit} disabled={loading || isSubmitting} className="px-8 py-2.5 bg-blue-600 text-white text-xs font-bold uppercase tracking-widest rounded-md shadow-lg hover:bg-blue-700 transition-all disabled:opacity-50">
                            {isAdvancedMode ? 'Confirm Reservation' : (loading || isSubmitting ? 'Processing...' : 'Quick Confirm')}
                        </button>
                    </div>
                </div>
            </div>

            {/* Custom Cancel Confirmation Modal */}
            {showCancelConfirm && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full animate-in zoom-in-95 duration-200 border-l-4 border-red-500">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Discard Booking?</h3>
                        <p className="text-sm text-gray-600 mb-6">
                            You have unsaved changes. Are you sure you want to cancel this reservation? All entered data will be lost.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowCancelConfirm(false)}
                                className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                            >
                                Keep Editing
                            </button>
                            <button
                                onClick={confirmCancel}
                                className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-md hover:bg-red-700 shadow-sm"
                            >
                                Discard & Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default QuickReservationModal;


