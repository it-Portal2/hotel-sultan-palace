import React, { useState, useEffect, useRef } from 'react';
import { MenuItem, Booking } from '@/lib/firestoreService';
import { PlusIcon, TrashIcon, ShoppingCartIcon, UserIcon, MapPinIcon, ClockIcon } from '@heroicons/react/24/outline';

// ================= TYPES =================
interface CartItem extends MenuItem {
    quantity: number;
    specialInstructions?: string;
}

// ================= CART SIDEBAR =================
interface POSCartProps {
    cart: CartItem[];
    onRemove: (itemId: string) => void;
    onUpdateQty: (itemId: string, delta: number) => void;
    onSubmit: () => void;
    subtotal: number;
    tax: number;
    total: number;
    isSubmitting: boolean;
    canSubmit: boolean;
    guestName: string;
    setGuestName: (val: string) => void;
    roomNumber: string;
    setRoomNumber: (val: string) => void;
    activeGuests: Booking[];
    deliveryLocation: string;
    setDeliveryLocation: (val: string) => void;
    scheduledTime: Date | null;
    setScheduledTime: (date: Date | null) => void;
    deliveryMode: 'asap' | 'scheduled';
    setDeliveryMode: (mode: 'asap' | 'scheduled') => void;
    notes: string;
    setNotes: (val: string) => void;
}

export function POSCart({
    cart, onRemove, onUpdateQty, onSubmit,
    subtotal, tax, total, isSubmitting, canSubmit,
    guestName, setGuestName, roomNumber, setRoomNumber,
    activeGuests, deliveryLocation, setDeliveryLocation,
    scheduledTime, setScheduledTime, deliveryMode, setDeliveryMode,
    notes, setNotes
}: POSCartProps) {
    const [showGuestResults, setShowGuestResults] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    // Filter guests based on input search
    const filteredGuests = activeGuests.filter(g =>
        (g.guestDetails?.firstName + ' ' + g.guestDetails?.lastName).toLowerCase().includes(guestName.toLowerCase()) ||
        (g.rooms?.[0]?.allocatedRoomType || '').toLowerCase().includes(guestName.toLowerCase())
    ).slice(0, 5); // Limit 5

    // Close search on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowGuestResults(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [searchRef]);

    const selectGuest = (guest: Booking) => {
        const fullName = `${guest.guestDetails?.firstName || 'Guest'} ${guest.guestDetails?.lastName || ''}`;
        setGuestName(fullName);
        const room = guest.rooms?.[0]?.allocatedRoomType || ''; // Use allocated room as room number/name
        setRoomNumber(room);
        setDeliveryLocation('in_room'); // Default to room if guest selected
        setShowGuestResults(false);
    };

    return (
        <div className="flex flex-col fixed top-[90px] right-6 w-full md:w-96 bg-white border border-gray-200 shadow-2xl rounded-2xl z-40 h-auto max-h-[calc(100vh-110px)] transition-all duration-300">
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">

                {/* GUEST DETAILS INPUTS */}
                <div className="mb-6 space-y-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wide flex items-center gap-2">
                        <UserIcon className="h-4 w-4" /> Guest & Location
                    </h3>

                    {/* ... (Existing Guest Inputs) ... */}

                    <div className="relative" ref={searchRef}>
                        <label className="text-xs text-gray-500 font-semibold mb-1 block">Guest Name / Walk-in</label>
                        <input
                            type="text"
                            placeholder="Type to search guest..."
                            value={guestName}
                            onChange={(e) => {
                                setGuestName(e.target.value);
                                setShowGuestResults(true);
                            }}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-[#FF6A00]"
                        />
                        {/* Autocomplete Results */}
                        {showGuestResults && guestName.length > 0 && filteredGuests.length > 0 && (
                            <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 shadow-lg rounded-lg mt-1 z-50 max-h-48 overflow-y-auto">
                                {filteredGuests.map(guest => (
                                    <div
                                        key={guest.id}
                                        onClick={() => selectGuest(guest)}
                                        className="px-4 py-2 hover:bg-orange-50 cursor-pointer border-b border-gray-50 last:border-0"
                                    >
                                        <div className="text-sm font-bold text-gray-900">
                                            {guest.guestDetails?.firstName} {guest.guestDetails?.lastName}
                                        </div>
                                        <div className="text-xs text-gray-500 flex justify-between">
                                            <span>Room: {guest.rooms?.[0]?.allocatedRoomType || 'Unassigned'}</span>
                                            <span className="text-orange-600 font-medium">{guest.rooms?.[0]?.suiteType}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Room Display (Read Only if Found) */}
                    {roomNumber && (
                        <div className="bg-orange-50/50 p-2 rounded border border-orange-100 flex justify-between items-center">
                            <span className="text-xs text-gray-600 font-medium">Linked Room:</span>
                            <span className="text-sm font-bold text-[#FF6A00]">{roomNumber}</span>
                        </div>
                    )}

                    {/* Delivery Location Dropdown */}
                    <div>
                        <label className="text-xs text-gray-500 font-semibold mb-1 block">Delivery Location</label>
                        <div className="relative">
                            <MapPinIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <select
                                value={deliveryLocation}
                                onChange={(e) => setDeliveryLocation(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-[#FF6A00] appearance-none bg-white"
                            >
                                <option value="restaurant">Restaurant (Dine-in)</option>
                                <option value="in_room" disabled={!roomNumber}>Room Service {(!roomNumber) ? '(Select Guest First)' : ''}</option>
                                <option value="pool_side">Pool Side</option>
                                <option value="beach_side">Beach Side</option>
                                <option value="bar">Bar</option>
                            </select>
                        </div>
                    </div>

                    {/* Schedule Delivery Section */}
                    <div className="pt-2 border-t border-dashed border-gray-200 mt-4">
                        <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2 mb-3">
                            <ClockIcon className="h-4 w-4" /> Schedule Delivery
                        </h3>
                        <div className="space-y-3 bg-white p-3 rounded-lg border border-gray-200">
                            <p className="text-xs text-gray-500 font-medium mb-2">When would you like your order?</p>

                            {/* Standard Option (ASAP / 30 mins) */}
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <input
                                    type="radio"
                                    name="deliverySchedule"
                                    checked={deliveryMode === 'asap'}
                                    onChange={() => setDeliveryMode('asap')}
                                    className="w-4 h-4 text-[#FF6A00] border-gray-300 focus:ring-[#FF6A00]"
                                />
                                <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors">30 min (Default)</span>
                            </label>

                            {/* Scheduled Option */}
                            <div className="flex flex-col gap-2">
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <input
                                        type="radio"
                                        name="deliverySchedule"
                                        checked={deliveryMode === 'scheduled'}
                                        onChange={() => setDeliveryMode('scheduled')}
                                        className="w-4 h-4 text-[#FF6A00] border-gray-300 focus:ring-[#FF6A00]"
                                    />
                                    <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors">Select your preferred time</span>
                                </label>

                                {/* Time Picker (Conditional) */}
                                {deliveryMode === 'scheduled' && (
                                    <div className="ml-7 animate-fade-in flex items-center gap-2 bg-gray-50 p-2 rounded border border-gray-200">
                                        <input
                                            type="time"
                                            value={scheduledTime ? scheduledTime.toTimeString().slice(0, 5) : ''}
                                            onChange={(e) => {
                                                const [hours, minutes] = e.target.value.split(':').map(Number);
                                                const date = new Date();
                                                date.setHours(hours, minutes, 0, 0);
                                                setScheduledTime(date);
                                            }}
                                            className="bg-transparent text-sm font-bold text-gray-900 focus:outline-none w-full"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* NEW: Order Notes */}
                    <div className="mt-4">
                        <label className="text-xs text-gray-500 font-semibold mb-1 block">Special Requests / Notes</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Allergies, extra napkins, etc."
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-[#FF6A00] min-h-[60px]"
                        />
                    </div>
                </div>

                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                        <ShoppingCartIcon className="h-6 w-6 text-[#FF6A00]" />
                        Current Order
                    </h3>
                    <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2 py-1 rounded-full">{cart.reduce((a, b) => a + b.quantity, 0)} Items</span>
                </div>

                {cart.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-32 text-center p-6 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                        <div className="bg-white p-3 rounded-full shadow-sm mb-2">
                            <ShoppingCartIcon className="h-6 w-6 text-gray-300" />
                        </div>
                        <h4 className="font-semibold text-gray-900 mb-1 text-sm">Cart Empty</h4>
                        <p className="text-xs text-gray-500">Add items to start.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {cart.map((item) => (
                            <div key={item.id} className="flex gap-3 bg-gray-50 p-3 rounded-md border border-gray-100 group">
                                {/* Qty Controls */}
                                <div className="flex flex-col items-center justify-center gap-1">
                                    <button
                                        onClick={() => onUpdateQty(item.id, 1)}
                                        className="w-6 h-6 flex items-center justify-center bg-white border border-gray-200 rounded hover:border-[#FF6A00] hover:text-[#FF6A00]"
                                    >
                                        <PlusIcon className="h-3 w-3" />
                                    </button>
                                    <span className="text-sm font-bold w-6 text-center">{item.quantity}</span>
                                    <button
                                        onClick={() => onUpdateQty(item.id, -1)}
                                        className="w-6 h-6 flex items-center justify-center bg-white border border-gray-200 rounded hover:border-red-500 hover:text-red-500"
                                    >
                                        <span className="text-lg leading-3">-</span>
                                    </button>
                                </div>

                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <span className="font-medium text-gray-900 text-sm">{item.name}</span>
                                        <span className="font-semibold text-gray-900 text-sm ml-2">${(item.price * item.quantity).toFixed(2)}</span>
                                    </div>
                                    <p className="text-xs text-gray-500 line-clamp-1">{item.description}</p>
                                </div>

                                <button
                                    onClick={() => onRemove(item.id)}
                                    className="text-gray-400 hover:text-red-600 self-start mt-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <TrashIcon className="h-4 w-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Cart Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-200 space-y-3 rounded-b-2xl">
                <div className="flex justify-between text-sm text-gray-600">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                </div>
                {/* Simplified footer content for cleaner look */}
                <div className="flex justify-between text-lg font-bold text-gray-900 border-t border-gray-200 pt-2">
                    <span>Total</span>
                    <span className="text-[#FF6A00]">${total.toFixed(2)}</span>
                </div>

                <button
                    onClick={onSubmit}
                    disabled={!canSubmit || isSubmitting}
                    className="w-full py-3 bg-[#FF6A00] hover:bg-[#FF6A00]/90 text-white font-bold rounded-lg shadow-lg shadow-orange-200 disabled:opacity-50 disabled:shadow-none transition-all transform active:scale-95"
                >
                    {isSubmitting ? 'Processing...' : 'Place Order'}
                </button>
            </div>
        </div>
    );
}

// ================= MENU BROWSER =================
interface MenuBrowserProps {
    categories: any[];
    items: MenuItem[];
    onAddToCart: (item: MenuItem) => void;
}

export function MenuBrowser({ categories, items, onAddToCart }: MenuBrowserProps) {
    const [selectedCategory, setSelectedCategory] = React.useState<string>('all');
    const [search, setSearch] = React.useState('');

    const filteredItems = items.filter(item => {
        const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
        const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    return (
        <div className="flex-1 p-6 overflow-y-auto h-full bg-slate-50 md:pr-[26rem]">
            {/* Filters */}
            <div className="mb-8 space-y-4 sticky top-0 bg-slate-50 z-20 pb-4 pt-2">
                <div className="relative max-w-lg">
                    <input
                        type="text"
                        placeholder="Search items..."
                        className="w-full pl-5 pr-10 py-4 rounded-xl border-0 shadow-sm ring-1 ring-gray-200 focus:ring-2 focus:ring-[#FF6A00] outline-none text-lg"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar no-scrollbar">
                    <button
                        onClick={() => setSelectedCategory('all')}
                        className={`whitespace-nowrap px-6 py-3 rounded-xl text-sm font-bold transition-all transform hover:scale-105 ${selectedCategory === 'all'
                            ? 'bg-[#FF6A00] text-white shadow-lg shadow-orange-500/20'
                            : 'bg-white text-slate-600 shadow-sm border border-slate-200 hover:border-slate-300'
                            }`}
                    >
                        All Items
                    </button>
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.name)}
                            className={`whitespace-nowrap px-6 py-3 rounded-xl text-sm font-bold transition-all transform hover:scale-105 ${selectedCategory === cat.name
                                ? 'bg-[#FF6A00] text-white shadow-lg shadow-orange-500/20'
                                : 'bg-white text-slate-600 shadow-sm border border-slate-200 hover:border-slate-300'
                                }`}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 pb-24">
                {filteredItems.map(item => (
                    <button
                        key={item.id}
                        onClick={() => onAddToCart(item)}
                        className="flex flex-col bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group h-[280px]"
                    >
                        <div className="h-40 w-full bg-slate-100 relative overflow-hidden">
                            {item.image ? (
                                <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-300 bg-slate-100">
                                    <span className="text-xs font-black opacity-30 tracking-widest">NO IMAGE</span>
                                </div>
                            )}
                            <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg shadow-sm font-bold text-slate-900 text-sm">
                                ${item.price}
                            </div>
                        </div>

                        <div className="p-4 flex flex-col flex-1 w-full text-left relative">
                            <h4 className="font-bold text-slate-900 text-lg leading-tight line-clamp-2 mb-1 group-hover:text-[#FF6A00] transition-colors">{item.name}</h4>
                            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{item.description}</p>

                            <div className="mt-auto w-full pt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-2 group-hover:translate-y-0 text-[#FF6A00] font-bold text-xs flex items-center gap-1 uppercase tracking-wide">
                                <PlusIcon className="w-4 h-4" /> Add to Order
                            </div>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}
