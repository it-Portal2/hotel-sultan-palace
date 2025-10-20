'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { createBooking } from '@/lib/bookingService';

interface BookingData {
  checkIn: string;
  checkOut: string;
  guests: {
    adults: number;
    children: number;
    rooms: number;
  };
}

interface Guest {
  id: string;
  prefix: string;
  firstName: string;
  lastName: string;
  mobile: string;
  email: string;
}

interface Address {
  country: string;
  city: string;
  zipCode: string;
  address1: string;
  address2: string;
}

interface PaymentData {
  nameOnCard: string;
  cardNumber: string;
  expiryDate: string;
  cvv: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const [bookingData, setBookingData] = useState<BookingData | null>(null);
  const [cart, setCart] = useState<{ id: string; name: string; price: number; quantity: number }[]>([]);
  const [roomData, setRoomData] = useState<{ name: string; price: number } | null>(null);
  const [guests, setGuests] = useState<Guest[]>([
    {
      id: '1',
      prefix: 'Mr.',
      firstName: '',
      lastName: '',
      mobile: '',
      email: ''
    }
  ]);
  const [address, setAddress] = useState<Address>({
    country: '',
    city: '',
    zipCode: '',
    address1: '',
    address2: ''
  });
  const [payment, setPayment] = useState<PaymentData>({
    nameOnCard: '',
    cardNumber: '',
    expiryDate: '',
    cvv: ''
  });
  const [agreements, setAgreements] = useState({
    privacy: false,
    booking: false
  });

  useEffect(() => {
    const storedData = localStorage.getItem('bookingData');
    const storedRoomData = localStorage.getItem('roomData');
    const storedCartData = localStorage.getItem('cartData');
    
    if (storedData) {
      setBookingData(JSON.parse(storedData));
    } else {
      router.push('/');
    }

    if (storedRoomData) {
      setRoomData(JSON.parse(storedRoomData));
    }

    if (storedCartData) {
      setCart(JSON.parse(storedCartData));
    }
  }, [router]);

  const addGuest = () => {
    const newGuest: Guest = {
      id: Date.now().toString(),
      prefix: 'Mr.',
      firstName: '',
      lastName: '',
      mobile: '',
      email: ''
    };
    setGuests([...guests, newGuest]);
  };

  const removeGuest = (id: string) => {
    if (guests.length > 1) {
      setGuests(guests.filter(guest => guest.id !== id));
    }
  };

  const updateGuest = (id: string, field: keyof Guest, value: string) => {
    setGuests(guests.map(guest => 
      guest.id === id ? { ...guest, [field]: value } : guest
    ));
  };

  const calculateTotal = () => {
    const roomPrice = roomData?.price || 0;
    const addOnsTotal = cart.reduce((total, item) => total + (item.price * (item.quantity || 1)), 0);
    return roomPrice + addOnsTotal;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!agreements.privacy || !agreements.booking) {
      alert('Please accept the terms and conditions');
      return;
    }

    try {
      // Create booking data for Firebase
      const bookingDetails = {
        checkIn: bookingData!.checkIn,
        checkOut: bookingData!.checkOut,
        guests: bookingData!.guests,
        guestDetails: guests,
        address: address,
        room: roomData ? {
          id: '1',
          name: roomData.name,
          price: roomData.price,
          type: 'Standard Room'
        } : {
          id: '1',
          name: 'Standard Room',
          price: 0,
          type: 'Standard Room'
        },
        addOns: cart,
        total: calculateTotal(),
        status: 'confirmed' as const,
        bookingId: `#BKG${Date.now()}`
      };

      // Save to Firebase
      const bookingId = await createBooking(bookingDetails);
      
      // Store in localStorage as backup
      localStorage.setItem('bookingDetails', JSON.stringify({ ...bookingDetails, id: bookingId }));
      
      // Show confirmation popup
      const popup = document.getElementById('confirmation-popup');
      if (popup) {
        popup.classList.remove('hidden');
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      alert('There was an error processing your booking. Please try again.');
    }
  };

  if (!bookingData) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-[#FFFCF6]">
      <Header />
      
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-gray-900 to-gray-800 h-96">
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="relative z-10 container mx-auto px-4 h-full flex items-center">
          <div className="text-white">
            <h1 className="text-4xl font-bold mb-4">Check Out</h1>
            <p className="text-lg mb-6">
              Complete your booking and secure your stay
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Main Form */}
          <div className="flex-1">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Reservation Overview */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Reservation Overview</h2>
                  <button type="button" className="text-orange-500 hover:text-orange-700">
                    Edit
                  </button>
                </div>
                
                {roomData && (
                  <div className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-800">{roomData.name}</h3>
                        <p className="text-sm text-gray-600">Total Stay: 1 Night</p>
                        <p className="text-sm text-gray-600">
                          Date: {formatDate(bookingData.checkIn)} - {formatDate(bookingData.checkOut)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-8 mt-4">
                      <div className="text-sm">
                        <p className="font-medium">Check-in</p>
                        <p className="text-gray-600">after 3:00 pm</p>
                      </div>
                      <div className="w-px h-8 bg-gray-300"></div>
                      <div className="text-sm">
                        <p className="font-medium">Check-out</p>
                        <p className="text-gray-600">before 12:00 pm</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Guest Details */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Guest Details</h2>
                
                {guests.map((guest, index) => (
                  <div key={guest.id} className="border rounded-lg p-4 mb-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-medium">Guest {index + 1}</h3>
                      {guests.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeGuest(guest.id)}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Prefix*
                        </label>
                        <select
                          value={guest.prefix}
                          onChange={(e) => updateGuest(guest.id, 'prefix', e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md"
                        >
                          <option value="Mr.">Mr.</option>
                          <option value="Mrs.">Mrs.</option>
                          <option value="Ms.">Ms.</option>
                          <option value="Dr.">Dr.</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          First Name*
                        </label>
                        <input
                          type="text"
                          value={guest.firstName}
                          onChange={(e) => updateGuest(guest.id, 'firstName', e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Last Name*
                        </label>
                        <input
                          type="text"
                          value={guest.lastName}
                          onChange={(e) => updateGuest(guest.id, 'lastName', e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Mobile Phone
                        </label>
                        <input
                          type="tel"
                          value={guest.mobile}
                          onChange={(e) => updateGuest(guest.id, 'mobile', e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email Address*
                        </label>
                        <input
                          type="email"
                          value={guest.email}
                          onChange={(e) => updateGuest(guest.id, 'email', e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md"
                          required
                        />
                      </div>
                    </div>
                  </div>
                ))}
                
                <button
                  type="button"
                  onClick={addGuest}
                  className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-gray-600 hover:border-gray-400 transition-colors"
                >
                  + Add Guest
                </button>
              </div>

              {/* Address */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Address</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Country
                    </label>
                    <select
                      value={address.country}
                      onChange={(e) => setAddress({...address, country: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                      <option value="">Select Country</option>
                      <option value="US">United States</option>
                      <option value="UK">United Kingdom</option>
                      <option value="CA">Canada</option>
                      <option value="AU">Australia</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      value={address.city}
                      onChange={(e) => setAddress({...address, city: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Zip / Postal Code
                    </label>
                    <input
                      type="text"
                      value={address.zipCode}
                      onChange={(e) => setAddress({...address, zipCode: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address 1
                    </label>
                    <input
                      type="text"
                      value={address.address1}
                      onChange={(e) => setAddress({...address, address1: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address 2
                    </label>
                    <input
                      type="text"
                      value={address.address2}
                      onChange={(e) => setAddress({...address, address2: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
              </div>

              {/* Payment */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Payment</h2>
                <p className="text-sm text-gray-600 mb-4">
                  Your information is securely encrypted and protected.
                </p>
                
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Use gift card & Coupon Code</span>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="border-t border-gray-300"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Coupon Code
                    </label>
                    <input
                      type="text"
                      className="w-full p-2 border border-gray-300 rounded-md"
                      placeholder="Enter coupon code"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      className="w-full bg-orange-500 text-white py-2 px-4 rounded-md hover:bg-orange-600 transition-colors"
                    >
                      Apply
                    </button>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium">${calculateTotal()}.00 deposit due now.</span>
                    <div className="flex gap-1">
                      <div className="h-6 w-8 bg-blue-600 rounded text-white text-xs flex items-center justify-center font-bold">V</div>
                      <div className="h-6 w-8 bg-red-600 rounded text-white text-xs flex items-center justify-center font-bold">M</div>
                      <div className="h-6 w-8 bg-blue-500 rounded text-white text-xs flex items-center justify-center font-bold">A</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name on Card*
                    </label>
                    <input
                      type="text"
                      value={payment.nameOnCard}
                      onChange={(e) => setPayment({...payment, nameOnCard: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Card Number*
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={payment.cardNumber}
                        onChange={(e) => setPayment({...payment, cardNumber: e.target.value})}
                        className="w-full p-2 border border-gray-300 rounded-md pl-10"
                        placeholder="1234 5678 9012 3456"
                        required
                      />
                      <svg className="absolute left-3 top-3 w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zM18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" />
                      </svg>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Expiration Date (MM/YY)*
                      </label>
                      <input
                        type="text"
                        value={payment.expiryDate}
                        onChange={(e) => setPayment({...payment, expiryDate: e.target.value})}
                        className="w-full p-2 border border-gray-300 rounded-md"
                        placeholder="MM/YY"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        CVV*
                      </label>
                      <input
                        type="text"
                        value={payment.cvv}
                        onChange={(e) => setPayment({...payment, cvv: e.target.value})}
                        className="w-full p-2 border border-gray-300 rounded-md"
                        placeholder="123"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Policies & Acknowledgements */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Policies & Acknowledgements</h2>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="privacy"
                      checked={agreements.privacy}
                      onChange={(e) => setAgreements({...agreements, privacy: e.target.checked})}
                      className="w-5 h-5 text-orange-500 border-gray-300 rounded"
                    />
                    <label htmlFor="privacy" className="text-sm text-gray-700">
                      I agree with the Privacy Terms
                    </label>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="booking"
                      checked={agreements.booking}
                      onChange={(e) => setAgreements({...agreements, booking: e.target.checked})}
                      className="w-5 h-5 text-orange-500 border-gray-300 rounded"
                    />
                    <label htmlFor="booking" className="text-sm text-gray-700">
                      I agree with the Booking Conditions
                    </label>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-orange-500 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:bg-orange-600 transition-colors"
              >
                Confirm Booking
              </button>
            </form>
          </div>

          {/* Cart Sidebar */}
          <div className="w-96">
            <div className="bg-white rounded-lg shadow-lg p-6 sticky top-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Your Cart ({cart.length + 1} Items)</h2>
              
              {/* Room Item */}
              {roomData && (
                <div className="border-b pb-4 mb-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-800">{roomData.name}</h3>
                    <div className="text-orange-500 font-bold">${roomData.price}.00</div>
                  </div>
                  <div className="text-sm text-gray-500">1 Night Stay</div>
                  <p className="text-gray-600 text-sm mt-2">
                    {formatDate(bookingData.checkIn)} - {formatDate(bookingData.checkOut)}
                  </p>
                </div>
              )}

              {/* Add-on Items */}
              {cart.map((item) => (
                <div key={item.id} className="border-b pb-4 mb-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-800">{item.name}</h3>
                    <div className="text-orange-500 font-bold">${item.price}.00</div>
                  </div>
                  <div className="text-sm text-gray-500">Taxes and Fees</div>
                </div>
              ))}
              
              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-lg font-semibold">Total</span>
                  <span className="text-xl font-bold text-orange-500">${calculateTotal()}.00</span>
                </div>
                <p className="text-xs text-gray-500">including general taxes and fees</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />

      {/* Confirmation Popup */}
      <div id="confirmation-popup" className="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Booking Confirmed!</h2>
          <p className="text-gray-600 mb-4">
            A confirmation email has been sent to your registered address.
          </p>
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <p className="text-sm text-gray-700">
              Booking ID: #BKG{Date.now()}<br />
              Check-in: {formatDate(bookingData.checkIn)}<br />
              Check-out: {formatDate(bookingData.checkOut)}
            </p>
          </div>
          <button
            onClick={() => {
              const popup = document.getElementById('confirmation-popup');
              if (popup) {
                popup.classList.add('hidden');
              }
              router.push('/');
            }}
            className="w-full bg-orange-500 text-white py-3 px-6 rounded-lg font-semibold hover:bg-orange-600 transition-colors"
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  );
}
