"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import CartSummary from "@/components/CartSummary";
import BookingConfirmationPopup from "@/components/BookingConfirmationPopup";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/context/ToastContext";
import { createDPOPaymentToken, getDPOPaymentURL } from "@/lib/dpoPaymentService";
import { 
  PencilIcon,
  TrashIcon,
  ChevronDownIcon,
  PlusIcon,
  ArrowUpTrayIcon,
  ArrowLeftIcon,
  CreditCardIcon
} from "@heroicons/react/24/outline";

interface Guest {
  id: string;
  prefix: string;
  firstName: string;
  lastName: string;
  mobile: string;
  email: string;
}

interface ReservationGuest {
  id: string;
  firstName: string;
  lastName: string;
  specialNeeds: string;
}

interface Address {
  country: string;
  city: string;
  zipCode: string;
  address1: string;
  address2: string;
  idDocument?: File;
}

interface PaymentData {
  couponCode: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { bookingData, rooms, addOns, calculateTotal, getNumberOfNights } = useCart();
  const { showToast } = useToast();

  const [guests, setGuests] = useState<Guest[]>([
    {
      id: "1",
      prefix: "Mr.",
      firstName: "",
      lastName: "",
      mobile: "",
      email: "",
    },
  ]);

  const [reservationGuests, setReservationGuests] = useState<ReservationGuest[]>([
    {
      id: "1",
      firstName: "",
      lastName: "",
      specialNeeds: "",
    },
  ]);
  
  const [address, setAddress] = useState<Address>({
    country: "",
    city: "",
    zipCode: "",
    address1: "",
    address2: "",
  });

  const [payment, setPayment] = useState<PaymentData>({
    couponCode: "",
  });

  const [agreements, setAgreements] = useState({
    privacy: false,
    booking: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmationPopup, setShowConfirmationPopup] = useState(false);
  const [popupBookingData, setPopupBookingData] = useState({
    bookingId: "",
    checkIn: "",
    checkOut: "",
    email: "",
    allocatedRoomType: ""
  });

  if (!bookingData) {
    return (
      <div className="min-h-screen bg-[#F8F5EF] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">No Booking Data</h2>
          <p className="text-gray-600 mb-6">Please start by selecting your dates and room.</p>
          <button 
            onClick={() => router.push('/')}
            className="bg-[#FF6A00] text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors"
          >
            Start Booking
          </button>
        </div>
      </div>
    );
  }

  const updateGuest = (id: string, field: keyof Guest, value: string) => {
    setGuests((prev) =>
      prev.map((g) => (g.id === id ? { ...g, [field]: value } : g))
    );
  };

  const updateReservationGuest = (id: string, field: keyof ReservationGuest, value: string) => {
    setReservationGuests((prev) =>
      prev.map((g) => (g.id === id ? { ...g, [field]: value } : g))
    );
  };

  const addReservationGuest = () => {
    const newGuest: ReservationGuest = {
      id: Date.now().toString(),
      firstName: "",
      lastName: "",
      specialNeeds: "",
    };
    setReservationGuests((prev) => [...prev, newGuest]);
  };

  const removeReservationGuest = (id: string) => {
    if (reservationGuests.length > 1) {
      setReservationGuests((prev) => prev.filter((g) => g.id !== id));
    }
  };

  const updateAddress = (field: keyof Address, value: string) => {
    setAddress((prev) => ({ ...prev, [field]: value }));
  };

  const updatePayment = (field: keyof PaymentData, value: string) => {
    setPayment((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreements.privacy || !agreements.booking) {
      alert("Please accept the terms and conditions");
      return;
    }

    // Validate required guest information
    if (!guests[0].firstName || !guests[0].lastName || !guests[0].email) {
      alert("Please fill in all required guest information");
      return;
    }

    setIsSubmitting(true);
    try {
      const bookingId = `#BKG${Date.now()}`;
      const totalAmount = calculateTotal();
      
      const bookingDetails = {
        // Essential booking dates and guest count
        checkIn: bookingData.checkIn,
        checkOut: bookingData.checkOut,
        guests: bookingData.guests,
        
        // User contact and personal details
        guestDetails: {
          firstName: guests[0].firstName,
          lastName: guests[0].lastName,
          email: guests[0].email,
          phone: guests[0].mobile,
          prefix: guests[0].prefix
        },
        
        // User address details
        address: {
          country: address.country,
          city: address.city,
          zipCode: address.zipCode,
          address1: address.address1,
          address2: address.address2
        },
        
        // Reservation guest details
        reservationGuests: reservationGuests.map(guest => ({
          firstName: guest.firstName,
          lastName: guest.lastName,
          specialNeeds: guest.specialNeeds
        })),
        
        // Essential room information only
        rooms: rooms.length
          ? [{
              type: rooms[0].type || "Standard Room",
              price: rooms[0].price
            }]
          : [{ type: "Standard Room", price: 0 }],
        
        // Essential add-ons information
        addOns: addOns.map(addon => ({
          name: addon.name,
          price: addon.price,
          quantity: addon.quantity
        })),
        
        // Financial details
        totalAmount: totalAmount,
        bookingId: bookingId,
        status: "pending" as const, // Will be confirmed after payment
        
        // Booking metadata
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Check availability before proceeding to payment
      const { checkRoomAvailability } = await import('@/lib/bookingService');
      const availability = await checkRoomAvailability(bookingDetails);
      
      if (!availability.available) {
        showToast(availability.message, 'error');
        setIsSubmitting(false);
        return;
      }
      
      // Store booking details temporarily (will be saved after payment verification)
      localStorage.setItem('pendingBooking', JSON.stringify(bookingDetails));
      
      // Get base URL for redirect URLs
      const baseURL = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
      const successURL = `${baseURL}/payment/success`;
      const failureURL = `${baseURL}/payment/failure`;
      
      // Create DPO payment token
      const paymentRequest = {
        amount: totalAmount,
        currency: 'USD',
        companyRef: bookingId,
        redirectURL: successURL,
        backURL: failureURL,
        customerFirstName: guests[0].firstName,
        customerLastName: guests[0].lastName,
        customerEmail: guests[0].email,
        customerPhone: guests[0].mobile || '',
        customerAddress: address.address1,
        customerCity: address.city,
        customerCountry: address.country,
        customerZip: address.zipCode,
        serviceDescription: `Hotel Booking - ${rooms.length > 0 ? rooms[0].name : 'Room'} - ${getNumberOfNights()} night(s)`
      };
      
      const paymentTokenResponse = await createDPOPaymentToken(paymentRequest);
      
      if (!paymentTokenResponse.TransToken) {
        throw new Error(paymentTokenResponse.ResultExplanation || 'Failed to create payment token');
      }
      
      // Redirect to DPO payment page
      const paymentURL = getDPOPaymentURL(paymentTokenResponse.TransToken);
      window.location.href = paymentURL;
    } catch (err) {
      console.error("Error creating booking:", err);
      alert(`Booking processing error: ${err instanceof Error ? err.message : 'Unknown error'}. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePopupClose = () => {
    setShowConfirmationPopup(false);
    router.push("/confirmation");
  };

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <style jsx global>{`
        header {
          background-color: rgba(0, 0, 0, 0.8) !important;
          backdrop-filter: blur(8px);
        }
        header * {
          color: white !important;
        }
      `}</style>
      <Header />

       {/* Navigation Section */}
       <div className="w-full px-4 md:px-[230px] pt-[180px] md:pt-[200px]">
        <div className="max-w-6xl ">
          <button 
            onClick={() => router.push('/add-ons')}
            className="flex items-center gap-5 text-black"
          >
            <ArrowLeftIcon className="w-6 h-6" />
            <span className="text-xl font-semibold">Check out</span>
          </button>
        </div>
      </div>
      
      {/* Main Content - Two Column Layout */}
      <div className="mt-5 pb-16">
        <div className="w-full max-w-[1512px] mx-auto px-4 md:px-[63px] flex flex-col lg:flex-row gap-6 lg:gap-8">
        {/* Left Column - Form */}
        <div className="w-full lg:w-[850px] px-0">
          <div className="bg-[#F8F8F8] p-4 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Reservation Overview */}
            <div className="space-y-4">
              <h2 className="text-[20px] font-normal text-black">Reservation Overview</h2>
              
              <div className="border border-[rgba(0,0,0,0.24)] p-[15px]">
                <div className="flex justify-between items-start mb-[21px]">
                  <div className="space-y-[10px]">
                    <h3 className="text-[20px] font-semibold text-[#423B2D]">
                      {rooms.length > 0 ? rooms[0].name : 'No room selected'}
                    </h3>
                    <p className="text-[15px] font-bold text-[#1D69F9]">
                      Total Stay: {getNumberOfNights()} Night{getNumberOfNights() > 1 ? 's' : ''}
                    </p>
                    <p className="text-[15px] font-bold text-black">
                      Date: {bookingData ? 
                        `${new Date(bookingData.checkIn).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })} - ${new Date(bookingData.checkOut).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}` 
                        : 'Thu, Nov 20, 2025 - Fri, Nov 21, 2025'
                      }
                    </p>
                   
                  </div>
                  <button type="button" className="flex items-center gap-[10px] text-[15px] font-semibold text-[#1D69F9]">
                    <PencilIcon className="w-[19px] h-[19px]" />
                    Edit
                  </button>
                </div>
                
                <div className="flex items-center gap-7">
                  <div className="text-center">
                    <p className="text-[16px] font-semibold text-black">Check-in</p>
                    <p className="text-[16px] font-semibold text-black">after 3:00 pm</p>
                  </div>
                  <div className="w-px h-10 bg-[rgba(0,0,0,0.29)]"></div>
                  <div className="text-center">
                    <p className="text-[16px] font-semibold text-black">Check-out</p>
                    <p className="text-[16px] font-semibold text-black">before 12:00 pm</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Guest Details */}
            <div className="space-y-4">
              <h2 className="text-[20px] font-normal text-black">Guest Details</h2>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[14px] text-[#202C3B] mb-1">
                      Prefix<span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={guests[0].prefix}
                        onChange={(e) => updateGuest(guests[0].id, "prefix", e.target.value)}
                        className="w-full px-3 py-2 border border-[rgba(0,0,0,0.25)]  text-[14px] text-[#313131]  appearance-none"
                      >
                        <option value="Mr.">Mr.</option>
                        <option value="Mrs.">Mrs.</option>
                        <option value="Ms.">Ms.</option>
                        <option value="Dr.">Dr.</option>
                      </select>
                      <ChevronDownIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#313131] pointer-events-none" />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-[14px] text-[#202C3B] mb-1">
                      First Name<span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={guests[0].firstName}
                      onChange={(e) => updateGuest(guests[0].id, "firstName", e.target.value)}
                      className="w-full px-3 py-2 border border-[rgba(0,0,0,0.25)]  text-[14px] text-[#313131] "
                      placeholder=""
                      required
                    />
                </div>
                
                <div>
                  <label className="block text-[14px] text-[#202C3B] mb-1">
                    Last Name<span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={guests[0].lastName}
                    onChange={(e) => updateGuest(guests[0].id, "lastName", e.target.value)}
                      className="w-full px-3 py-2 border border-[rgba(0,0,0,0.25)] text-[14px] text-[#313131]"
                    placeholder=""
                    required
                  />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[14px] text-[#202C3B] mb-1">Mobile Phone</label>
                    <input
                      type="tel"
                      value={guests[0].mobile}
                      onChange={(e) => updateGuest(guests[0].id, "mobile", e.target.value)}
                      className="w-full px-3 py-2 border border-[rgba(0,0,0,0.25)] text-[14px] text-[#313131]"
                      placeholder=""
                    />
                  </div>
                  
                  <div>
                    <label className="block text-[14px] text-[#202C3B] mb-1">
                      Email Address<span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={guests[0].email}
                      onChange={(e) => updateGuest(guests[0].id, "email", e.target.value)}
                      className="w-full px-3 py-2 border border-[rgba(0,0,0,0.25)] text-[14px] text-[#313131]"
                      placeholder=""
                      required
                    />
                  </div>
                </div>
                
                <p className="text-[14px] text-[#202C3B] text-right">This is the email we will send your confirmation to.</p>
              </div>
            </div>

            <div className="w-full h-px bg-[rgba(0,0,0,0.03)]"></div>

            <div className="space-y-4">
              <h2 className="text-[20px] font-normal text-black">Address</h2>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[14px] text-[#202C3B] mb-1">Country</label>
                    <div className="relative">
                      <select
                        value={address.country}
                        onChange={(e) => updateAddress("country", e.target.value)}
                        className="w-full px-3 py-2 border border-[rgba(0,0,0,0.25)] text-[14px] text-[rgba(0,0,0,0.31)]  appearance-none"
                      >
                        <option value="">Country</option>
                        <option value="US">United States</option>
                        <option value="CA">Canada</option>
                        <option value="UK">United Kingdom</option>
                        <option value="DE">Germany</option>
                        <option value="FR">France</option>
                        <option value="IT">Italy</option>
                        <option value="ES">Spain</option>
                        <option value="AU">Australia</option>
                        <option value="JP">Japan</option>
                        <option value="CN">China</option>
                        <option value="IN">India</option>
                        <option value="BR">Brazil</option>
                        <option value="MX">Mexico</option>
                        <option value="RU">Russia</option>
                        <option value="ZA">South Africa</option>
                        <option value="EG">Egypt</option>
                        <option value="NG">Nigeria</option>
                        <option value="KE">Kenya</option>
                        <option value="TZ">Tanzania</option>
                        <option value="UG">Uganda</option>
                        <option value="RW">Rwanda</option>
                        <option value="ET">Ethiopia</option>
                        <option value="GH">Ghana</option>
                        <option value="MA">Morocco</option>
                        <option value="TN">Tunisia</option>
                        <option value="DZ">Algeria</option>
                        <option value="LY">Libya</option>
                        <option value="SD">Sudan</option>
                        <option value="SS">South Sudan</option>
                        <option value="CF">Central African Republic</option>
                        <option value="TD">Chad</option>
                        <option value="NE">Niger</option>
                        <option value="ML">Mali</option>
                        <option value="BF">Burkina Faso</option>
                        <option value="SN">Senegal</option>
                        <option value="GM">Gambia</option>
                        <option value="GN">Guinea</option>
                        <option value="SL">Sierra Leone</option>
                        <option value="LR">Liberia</option>
                        <option value="CI">Ivory Coast</option>
                        <option value="GH">Ghana</option>
                        <option value="TG">Togo</option>
                        <option value="BJ">Benin</option>
                        <option value="CM">Cameroon</option>
                        <option value="GQ">Equatorial Guinea</option>
                        <option value="GA">Gabon</option>
                        <option value="CG">Congo</option>
                        <option value="CD">Democratic Republic of Congo</option>
                        <option value="AO">Angola</option>
                        <option value="ZM">Zambia</option>
                        <option value="ZW">Zimbabwe</option>
                        <option value="BW">Botswana</option>
                        <option value="NA">Namibia</option>
                        <option value="SZ">Eswatini</option>
                        <option value="LS">Lesotho</option>
                        <option value="MW">Malawi</option>
                        <option value="MZ">Mozambique</option>
                        <option value="MG">Madagascar</option>
                        <option value="MU">Mauritius</option>
                        <option value="SC">Seychelles</option>
                        <option value="KM">Comoros</option>
                        <option value="DJ">Djibouti</option>
                        <option value="SO">Somalia</option>
                        <option value="ER">Eritrea</option>
                        <option value="ZW">Zimbabwe</option>
                      </select>
                      <ChevronDownIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#313131] pointer-events-none" />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-[14px] text-[#202C3B] mb-1">City</label>
                    <input
                      type="text"
                      value={address.city}
                      onChange={(e) => updateAddress("city", e.target.value)}
                      className="w-full px-3 py-2 border border-[rgba(0,0,0,0.25)] text-[14px] text-[#313131]"
                      placeholder=""
                    />
                  </div>
                  
                  <div>
                    <label className="block text-[14px] text-[#202C3B] mb-1">Zip / Postal Code</label>
                    <input
                      type="text"
                      value={address.zipCode}
                      onChange={(e) => updateAddress("zipCode", e.target.value)}
                      className="w-full px-3 py-2 border border-[rgba(0,0,0,0.25)] text-[14px] text-[#313131]"
                      placeholder=""
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[14px] text-[#202C3B] mb-1">Address 1</label>
                    <input
                      type="text"
                      value={address.address1}
                      onChange={(e) => updateAddress("address1", e.target.value)}
                      className="w-full px-3 py-2 border border-[rgba(0,0,0,0.25)] text-[14px] text-[#313131]"
                      placeholder=""
                    />
                  </div>
                  
                  <div>
                    <label className="block text-[14px] text-[#202C3B] mb-1">Address 2</label>
                    <input
                      type="text"
                      value={address.address2}
                      onChange={(e) => updateAddress("address2", e.target.value)}
                      className="w-full px-3 py-2 border border-[rgba(0,0,0,0.25)] text-[14px] text-[#313131]"
                      placeholder=""
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="w-full h-px bg-[rgba(0,0,0,0.03)]"></div>

            <div className="space-y-4">
              <h2 className="text-[20px] font-normal text-black">Reservation Details</h2>
              
              <div className="space-y-4">
                {reservationGuests.map((guest, index) => (
                  <div key={guest.id} className="space-y-3">
                    <div className="flex justify-between items-center">
                      <h3 className="text-[16px] text-[#FF6A00]">Guest {index + 1}</h3>
                      {reservationGuests.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeReservationGuest(guest.id)}
                          className="flex items-center gap-1 text-[16px] text-[#FF1D1D]"
                        >
                          <TrashIcon className="w-6 h-6" />
                          Remove
                        </button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[14px] text-[#202C3B] mb-1">First Name</label>
                        <input
                          type="text"
                          value={guest.firstName}
                          onChange={(e) => updateReservationGuest(guest.id, "firstName", e.target.value)}
                          className="w-full px-3 py-2 border border-[rgba(0,0,0,0.22)] text-[14px] text-[#313131]"
                          placeholder=""
                        />
                      </div>
                      
                      <div>
                        <label className="block text-[14px] text-[#202C3B] mb-1">Last Name</label>
                        <input
                          type="text"
                          value={guest.lastName}
                          onChange={(e) => updateReservationGuest(guest.id, "lastName", e.target.value)}
                          className="w-full px-3 py-2 border border-[rgba(0,0,0,0.22)] text-[14px] text-[#313131] "
                          placeholder=""
                        />
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                      <label className="flex items-center gap-2 px-6 py-2 bg-[#008CFF] text-white border border-[#008CFF] text-[14px] cursor-pointer">
                        <ArrowUpTrayIcon className="w-4 h-4" />
                        Upload ID
                        <input
                          type="file"
                          accept=".pdf"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              console.log('File selected:', file.name);
                              // Handle file upload logic here
                              setAddress(prev => ({
                                ...prev,
                                idDocument: file
                              }));
                            }
                          }}
                        />
                      </label>
                      
                      <p className="text-[12px] text-[#202C3B] flex items-center">
                        Please upload your ID in PDF format<br />
                        (max 2MB) for verification.
                      </p>
                      
                      {address.idDocument && (
                        <div className="flex items-center gap-2 text-sm text-green-600">
                          <span>✓ {address.idDocument.name}</span>
                        </div>
                      )}
                      
                      <div className="flex-1">
                        <input
                          type="text"
                          value={guest.specialNeeds}
                          onChange={(e) => updateReservationGuest(guest.id, "specialNeeds", e.target.value)}
                          className="w-full px-3 py-2 border border-[rgba(0,0,0,0.22)] text-[14px] text-[rgba(0,0,0,0.38)]"
                          placeholder="Please note your request or special needs"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                
                <button
                  type="button"
                  onClick={addReservationGuest}
                  className="w-full flex items-center justify-center gap-1 py-2 bg-[rgba(255,106,0,0.1)] border border-[#676767] text-[12px] font-semibold text-[#434343]"
                >
                  <PlusIcon className="w-6 h-6" />
                  Add Guest
                </button>
              </div>
            </div>

            <div className="w-full h-px bg-[rgba(0,0,0,0.03)]"></div>

            <div className="space-y-4">
              <h2 className="text-[20px] font-normal text-black">Payment</h2>
              
              <div className="space-y-4">
                <p className="text-[12px] text-[#FF1414]">Your booking will not be confirmed until payment is processed</p>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <p className="text-[14px] text-black">Use of card & Coupon Code</p>
                    <ChevronDownIcon className="w-4 h-4 text-[#313131]" />
                  </div>
                  <div className="w-full h-px bg-[rgba(0,0,0,0.34)]"></div>
                </div>
                
                <div className="space-y-2">
                  <label className="block text-[14px] text-[#202C3B]">Coupon Code</label>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={payment.couponCode}
                      onChange={(e) => updatePayment("couponCode", e.target.value)}
                        className="flex-1 px-3 py-2 border border-[rgba(0,0,0,0.25)] text-[14px] text-[#313131]"
                      placeholder=""
                    />
                    <button
                      type="button"
                      className="px-6 py-[7px] bg-[#1D69F9] text-white text-[18px] font-semibold"
                    >
                      Apply
                    </button>
                  </div>
                </div>
                
                <div className="space-y-[15px]">
                  <p className="text-[16px] font-semibold text-black">${calculateTotal().toFixed(2)} deposit due now.</p>
                </div>
              </div>
            </div>

            <div className="w-full h-px bg-[rgba(0,0,0,0.03)]"></div>

            <div className="space-y-4">
              <h2 className="text-[20px] font-normal text-black">Policies & Acknowledgements</h2>
              
              <div className="space-y-4">
                <label className="flex items-center gap-5">
                  <input
                    type="checkbox"
                    checked={agreements.privacy}
                    onChange={(e) => setAgreements(prev => ({ ...prev, privacy: e.target.checked }))}
                    className="w-[30px] h-[30px] border border-[rgba(0,0,0,0.49)]  bg-[#D9D9D9]"
                  />
                  <span className="text-[16px] text-black">I agree with the privacy terms</span>
                </label>

                <label className="flex items-center gap-5">
                  <input
                    type="checkbox"
                    checked={agreements.booking}
                    onChange={(e) => setAgreements(prev => ({ ...prev, booking: e.target.checked }))}
                      className="w-[30px] h-[30px] border border-[rgba(0,0,0,0.49)]  bg-[#D9D9D9]"
                  />
                  <span className="text-[16px] text-black">I agree with the booking conditions</span>
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={!agreements.privacy || !agreements.booking || isSubmitting}
              className={`w-full py-[7px] text-white text-[18px] font-semibold transition-colors flex items-center justify-center ${
                agreements.privacy && agreements.booking && !isSubmitting
                  ? 'bg-[#1D69F9] hover:bg-[#1A5CE6] cursor-pointer'
                  : 'bg-gray-300 cursor-not-allowed'
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Redirecting to Payment...
                </>
              ) : (
                "Confirm Booking"
              )}
            </button>
          </form>
          </div>
        </div>
        
        <div className="w-full lg:w-[534px] px-0 lg:sticky lg:top-28">
          <div className="border border-[rgba(255,255,255,0.15)] bg-[#F8F8F8] p-[26px]">
            <CartSummary />
          </div>
        </div>
        </div>
      </div>
      
      <Footer />
      
      <BookingConfirmationPopup
        isOpen={showConfirmationPopup}
        onClose={handlePopupClose}
        bookingId={popupBookingData.bookingId}
        checkIn={popupBookingData.checkIn}
        checkOut={popupBookingData.checkOut}
        email={popupBookingData.email}
        allocatedRoomType={popupBookingData.allocatedRoomType}
      />
    </div>
  );
}