import React, { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useToast } from '@/context/ToastContext';
import { getAllBookings, createGuestService, GuestService, Booking } from '@/lib/firestoreService';

interface NewServiceDrawerProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function NewServiceDrawer({ open, onClose, onSuccess }: NewServiceDrawerProps) {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [activeBookings, setActiveBookings] = useState<Booking[]>([]);

    // Form State
    const [selectedBookingId, setSelectedBookingId] = useState('');
    const [guestName, setGuestName] = useState('');
    const [guestPhone, setGuestPhone] = useState('');
    const [roomNumber, setRoomNumber] = useState('');
    const [roomCategory, setRoomCategory] = useState('');

    const [serviceCategory, setServiceCategory] = useState<GuestService['serviceCategory']>('laundry');
    const [serviceType, setServiceType] = useState<GuestService['serviceType']>('laundry');
    const [description, setDescription] = useState('');

    // Specific Fields
    const [laundryItems, setLaundryItems] = useState<Array<{ name: string, qty: number, price: number }>>([]);
    const [fastService, setFastService] = useState(false);

    const [spaType, setSpaType] = useState('Massage');
    const [duration, setDuration] = useState(60);
    const [guestCount, setGuestCount] = useState(1);
    const [appointmentDate, setAppointmentDate] = useState('');
    const [appointmentTime, setAppointmentTime] = useState('');

    // Manual pricing override if needed, otherwise calculated
    const [manualAmount, setManualAmount] = useState<number | ''>('');

    useEffect(() => {
        if (open) {
            loadBookings();
            resetForm();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    const loadBookings = async () => {
        try {
            const data = await getAllBookings();
            const active = data.filter(b => b.status === 'confirmed' || b.status === 'checked_in');
            setActiveBookings(active);
        } catch (error) {
            console.error(error);
            showToast('Failed to load active bookings', 'error');
        }
    };

    const resetForm = () => {
        setSelectedBookingId('');
        setGuestName('');
        setGuestPhone('');
        setRoomNumber('');
        setRoomCategory('');
        setServiceCategory('laundry');
        setServiceType('laundry');
        setDescription('');
        setLaundryItems([]);
        setFastService(false);
        setSpaType('Massage');
        setDuration(60);
        setGuestCount(1);
        setAppointmentDate('');
        setAppointmentTime('');
        setManualAmount('');
    };

    const handleBookingSelect = (id: string) => {
        setSelectedBookingId(id);
        const booking = activeBookings.find(b => b.id === id);
        if (booking) {
            setGuestName(`${booking.guestDetails.firstName} ${booking.guestDetails.lastName}`);
            setGuestPhone(booking.guestDetails.phone);
            setRoomNumber(booking.roomNumber || (booking.rooms[0]?.allocatedRoomType) || '');
            setRoomCategory(booking.rooms[0]?.suiteType || '');
        }
    };

    const addLaundryItem = () => {
        setLaundryItems([...laundryItems, { name: 'Shirt', qty: 1, price: 50 }]);
    };

    const updateLaundryItem = (index: number, field: string, value: any) => {
        const newItems = [...laundryItems];
        (newItems[index] as any)[field] = value;
        setLaundryItems(newItems);
    };

    const removeLaundryItem = (index: number) => {
        setLaundryItems(laundryItems.filter((_, i) => i !== index));
    };

    // Calculate Total
    const calculateTotal = () => {
        if (manualAmount !== '') return Number(manualAmount);

        let total = 0;
        if (serviceCategory === 'laundry') {
            const itemsTotal = laundryItems.reduce((sum, item) => sum + (item.qty * item.price), 0);
            const surcharge = fastService ? itemsTotal * 0.5 : 0;
            total = itemsTotal + surcharge;
        } else if (serviceCategory === 'spa') {
            // Simple estimator
            total = guestCount * (duration * 2); // Dummy rate $2/min per person
        }
        return total;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!guestName || !roomNumber) {
            showToast('Please provide guest details', 'error');
            return;
        }

        setLoading(true);
        try {
            const totalAmount = calculateTotal();

            const serviceData: any = {
                guestName,
                guestPhone,
                roomNumber,
                roomCategory,
                bookingId: selectedBookingId || undefined,
                serviceCategory,
                serviceType: serviceCategory === 'laundry' ? 'laundry' : serviceCategory === 'spa' ? 'spa' : 'other',
                description: description || `${serviceCategory} Request`,
                amount: totalAmount, // Legacy
                totalAmount: totalAmount,
                status: 'requested',
                requestedAt: new Date(),
                requestSource: 'admin',
                createdAt: new Date(),
                updatedAt: new Date()
            };

            // Add Category Specific Data
            if (serviceCategory === 'laundry') {
                serviceData.items = laundryItems;
                serviceData.fastService = fastService;
                serviceData.fastServiceSurcharge = fastService ? (laundryItems.reduce((s, i) => s + i.qty * i.price, 0) * 0.5) : 0;
            } else if (serviceCategory === 'spa') {
                serviceData.spaType = spaType;
                serviceData.durationMinutes = duration;
                serviceData.guestCount = guestCount;
                if (appointmentDate) {
                    // Combine date and time
                    const d = new Date(appointmentDate);
                    if (appointmentTime) {
                        const [h, m] = appointmentTime.split(':');
                        d.setHours(Number(h), Number(m));
                    }
                    serviceData.appointmentDate = d;
                    serviceData.appointmentTime = appointmentTime;
                }
            }

            await createGuestService(serviceData);
            showToast('Request created successfully', 'success');
            onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            showToast('Failed to create request', 'error');
        } finally {
            setLoading(false);
        }
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
                                <Dialog.Panel className="pointer-events-auto w-screen max-w-lg">
                                    <div className="flex h-full flex-col overflow-y-scroll bg-white shadow-xl">
                                        <div className="bg-[#FF6A00] px-4 py-6 sm:px-6">
                                            <div className="flex items-center justify-between">
                                                <Dialog.Title className="text-lg font-bold text-white">
                                                    New Service Request
                                                </Dialog.Title>
                                                <div className="ml-3 flex h-7 items-center">
                                                    <button
                                                        type="button"
                                                        className="rounded-md bg-[#FF6A00] text-white hover:text-white/80 focus:outline-none"
                                                        onClick={onClose}
                                                    >
                                                        <span className="sr-only">Close panel</span>
                                                        <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="mt-1">
                                                <p className="text-sm text-white/80">
                                                    Create a detailed request for a guest.
                                                </p>
                                            </div>
                                        </div>

                                        <form onSubmit={handleSubmit} className="flex-1 flex flex-col justify-between">
                                            <div className="px-4 py-6 sm:px-6 space-y-6">

                                                {/* 1. Guest Selection */}
                                                <div className="space-y-4 pb-6 border-b border-gray-100">
                                                    <h3 className="font-semibold text-gray-900">Guest Information</h3>

                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700">Link Booking</label>
                                                        <select
                                                            value={selectedBookingId}
                                                            onChange={(e) => handleBookingSelect(e.target.value)}
                                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm px-3 py-2"
                                                        >
                                                            <option value="">Select In-House Guest...</option>
                                                            {activeBookings.map(b => (
                                                                <option key={b.id} value={b.id}>
                                                                    Rm {b.roomNumber || b.rooms[0]?.allocatedRoomType} - {b.guestDetails.firstName} {b.guestDetails.lastName}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700">Guest Name</label>
                                                            <input type="text" required value={guestName} onChange={e => setGuestName(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm px-3 py-2" />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700">Room No.</label>
                                                            <input type="text" readOnly className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm px-3 py-2" value={`${roomCategory ? roomCategory + ' - ' : ''}${roomNumber}`} />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* 2. Service Type */}
                                                <div className="space-y-4 pb-6 border-b border-gray-100">
                                                    <h3 className="font-semibold text-gray-900">Service Category</h3>
                                                    <div className="grid grid-cols-3 gap-3">
                                                        {['laundry', 'spa', 'other'].map(cat => (
                                                            <button
                                                                key={cat}
                                                                type="button"
                                                                onClick={() => setServiceCategory(cat as any)}
                                                                className={`px-3 py-2 text-sm font-medium rounded-md capitalize border ${serviceCategory === cat ? 'bg-orange-50 border-orange-500 text-orange-700' : 'bg-white border-gray-300 text-gray-700'}`}
                                                            >
                                                                {cat}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* 3. Dynamic Details */}
                                                <div className="space-y-4">
                                                    <h3 className="font-semibold text-gray-900 capitalize">{serviceCategory} Details</h3>

                                                    {/* LAUNDRY FORM */}
                                                    {serviceCategory === 'laundry' && (
                                                        <div className="space-y-4">
                                                            <div className="flex justify-between items-center">
                                                                <span className="text-sm text-gray-500">Items List</span>
                                                                <button type="button" onClick={addLaundryItem} className="text-sm text-orange-600 hover:text-orange-700 font-medium flex items-center">
                                                                    <PlusIcon className="h-4 w-4 mr-1" /> Add Item
                                                                </button>
                                                            </div>
                                                            {laundryItems.length === 0 && <p className="text-sm text-gray-400 italic">No items added yet.</p>}
                                                            <div className="space-y-2">
                                                                {laundryItems.map((item, idx) => (
                                                                    <div key={idx} className="flex items-center gap-2">
                                                                        <input
                                                                            type="text"
                                                                            placeholder="Item Name"
                                                                            value={item.name}
                                                                            onChange={(e) => updateLaundryItem(idx, 'name', e.target.value)}
                                                                            className="flex-1 rounded-md border-gray-300 shadow-sm sm:text-sm px-3 py-2"
                                                                        />
                                                                        <input
                                                                            type="number"
                                                                            placeholder="Qty"
                                                                            value={item.qty}
                                                                            onChange={(e) => updateLaundryItem(idx, 'qty', Number(e.target.value))}
                                                                            className="w-16 rounded-md border-gray-300 shadow-sm sm:text-sm px-2 py-2"
                                                                        />
                                                                        <input
                                                                            type="number"
                                                                            placeholder="Price"
                                                                            value={item.price}
                                                                            onChange={(e) => updateLaundryItem(idx, 'price', Number(e.target.value))}
                                                                            className="w-20 rounded-md border-gray-300 shadow-sm sm:text-sm px-2 py-2"
                                                                        />
                                                                        <button type="button" onClick={() => removeLaundryItem(idx)} className="text-red-400 hover:text-red-600">
                                                                            <TrashIcon className="h-5 w-5" />
                                                                        </button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                            <div className="flex items-center gap-2 mt-2">
                                                                <input
                                                                    type="checkbox"
                                                                    id="fastService"
                                                                    checked={fastService}
                                                                    onChange={e => setFastService(e.target.checked)}
                                                                    className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                                                                />
                                                                <label htmlFor="fastService" className="text-sm text-gray-700 font-medium">Fast Service (50% Surcharge)</label>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* SPA FORM */}
                                                    {serviceCategory === 'spa' && (
                                                        <div className="space-y-4">
                                                            <div>
                                                                <label className="block text-sm font-medium text-gray-700">Treatment Type</label>
                                                                <select value={spaType} onChange={e => setSpaType(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm px-3 py-2">
                                                                    <option>Massage</option>
                                                                    <option>Facial</option>
                                                                    <option>Manicure/Pedicure</option>
                                                                    <option>Sauna</option>
                                                                </select>
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-4">
                                                                <div>
                                                                    <label className="block text-sm font-medium text-gray-700">Date</label>
                                                                    <input type="date" required value={appointmentDate} onChange={e => setAppointmentDate(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm px-3 py-2" />
                                                                </div>
                                                                <div>
                                                                    <label className="block text-sm font-medium text-gray-700">Time</label>
                                                                    <input type="time" required value={appointmentTime} onChange={e => setAppointmentTime(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm px-3 py-2" />
                                                                </div>
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-4">
                                                                <div>
                                                                    <label className="block text-sm font-medium text-gray-700">Duration (mins)</label>
                                                                    <input type="number" value={duration} onChange={e => setDuration(Number(e.target.value))} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm px-3 py-2" />
                                                                </div>
                                                                <div>
                                                                    <label className="block text-sm font-medium text-gray-700">Guests</label>
                                                                    <input type="number" min="1" value={guestCount} onChange={e => setGuestCount(Number(e.target.value))} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm px-3 py-2" />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* GENERAL OTHER FORM */}
                                                    <div className="pt-4">
                                                        <label className="block text-sm font-medium text-gray-700">Description / Notes</label>
                                                        <textarea
                                                            rows={3}
                                                            value={description}
                                                            onChange={e => setDescription(e.target.value)}
                                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm px-3 py-2"
                                                            placeholder="Additional details..."
                                                        />
                                                    </div>

                                                    {/* Amount Display or Override */}
                                                    <div className="pt-4 border-t border-gray-100">
                                                        <label className="block text-sm font-medium text-gray-700">Total Amount</label>
                                                        <div className="mt-1 relative rounded-md shadow-sm">
                                                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                                                <span className="text-gray-500 sm:text-sm">$</span>
                                                            </div>
                                                            <input
                                                                type="number"
                                                                value={manualAmount !== '' ? manualAmount : calculateTotal()}
                                                                onChange={e => setManualAmount(Number(e.target.value))}
                                                                className="block w-full rounded-md border-gray-300 pl-7 pr-12 focus:border-orange-500 focus:ring-orange-500 sm:text-sm font-bold text-gray-900 px-3 py-2"
                                                                placeholder="0.00"
                                                            />
                                                        </div>
                                                        <p className="mt-1 text-xs text-gray-500">Auto-calculated based on inputs. You can override this manually.</p>
                                                    </div>

                                                </div>
                                            </div>

                                            <div className="flex-shrink-0 border-t border-gray-200 px-4 py-6 sm:px-6">
                                                <div className="flex justify-end gap-3">
                                                    <button
                                                        type="button"
                                                        className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                                                        onClick={onClose}
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        type="submit"
                                                        disabled={loading}
                                                        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50"
                                                    >
                                                        {loading ? 'Creating...' : 'Create Request'}
                                                    </button>
                                                </div>
                                            </div>
                                        </form>
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
