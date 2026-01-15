"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CartSummary from "@/components/CartSummary";
import BookingConfirmationPopup from "@/components/BookingConfirmationPopup";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/context/ToastContext";
import { createPaymentToken } from "@/app/actions/payment";
import {
  PencilIcon,
  TrashIcon,
  ChevronDownIcon,
  PlusIcon,
  ArrowUpTrayIcon,
  ArrowLeftIcon,
  TagIcon,
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
  idDocument?: File;
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
  cardHolderName: string;
  cardNumber: string;
  expiryDate: string;
  cvv: string;
}

// Removed unused function: resolveFallbackRoomLabel

export default function CheckoutPage() {
  const router = useRouter();
  const {
    bookingData,
    rooms,
    addOns,
    calculateTotal,
    getNumberOfNights,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
  } = useCart();
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

  const [reservationGuests, setReservationGuests] = useState<
    ReservationGuest[]
  >([
    {
      id: "1",
      firstName: "",
      lastName: "",
      specialNeeds: "",
      idDocument: undefined,
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
    cardHolderName: "",
    cardNumber: "",
    expiryDate: "",
    cvv: "",
  });

  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [couponFeedback, setCouponFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [showPaymentCouponField, setShowPaymentCouponField] = useState(false);



  const validatePaymentInputs = () => {
    // Credit card validation disabled for DPO integration
    /*
    const errors: typeof cardErrors = {};
    const trimmedName = payment.cardHolderName.trim();
    const normalizedNumber = payment.cardNumber.replace(/\s/g, "");
    const expiry = payment.expiryDate.trim();
    const cvv = payment.cvv.trim();

    if (!trimmedName) {
      errors.cardHolderName = "Cardholder name is required.";
    } else if (!/^[A-Za-z][A-Za-z\s'.-]*$/.test(trimmedName)) {
      errors.cardHolderName = "Use letters, spaces, apostrophes, or hyphens only.";
    }

    if (normalizedNumber.length < 13 || !luhnCheck(payment.cardNumber)) {
      errors.cardNumber = "Enter a valid card number.";
    }

    if (!/^\d{2}\/\d{2}$/.test(expiry) || !isFutureExpiry(expiry)) {
      errors.expiryDate = "Enter a valid future date (MM/YY).";
    }

    if (!/^\d{3,4}$/.test(cvv)) {
      errors.cvv = "CVV must be 3 or 4 digits.";
    }

    return errors;
    */
    return {};
  };

  useEffect(() => {
    if (appliedCoupon) {
      setPayment((prev) => ({ ...prev, couponCode: appliedCoupon.code }));
      setCouponFeedback({
        type: "success",
        message: `Coupon "${appliedCoupon.code}" applied successfully.`,
      });
    } else if (!appliedCoupon && couponFeedback?.type === "success") {
      setCouponFeedback(null);
    }
  }, [appliedCoupon]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleApplyCoupon = async () => {
    if (!payment.couponCode.trim()) {
      setCouponFeedback({
        type: "error",
        message: "Please enter a coupon code.",
      });
      return;
    }

    try {
      setIsApplyingCoupon(true);
      const result = await applyCoupon(payment.couponCode.toUpperCase());
      if (result.success) {
        setCouponFeedback({
          type: "success",
          message: `Coupon "${payment.couponCode.toUpperCase()}" applied successfully.`,
        });
        setShowPaymentCouponField(false);
      } else {
        setCouponFeedback({
          type: "error",
          message: result.message || "Unable to apply coupon.",
        });
      }
    } catch (error) {
      console.error("Coupon apply error:", error);
      setCouponFeedback({
        type: "error",
        message: "Something went wrong. Please try again.",
      });
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    removeCoupon();
    setCouponFeedback(null);
    setPayment((prev) => ({ ...prev, couponCode: "" }));
    setShowPaymentCouponField(true);
  };

  const handleCouponInputChange = (value: string) => {
    setPayment((prev) => ({ ...prev, couponCode: value.toUpperCase() }));
    if (couponFeedback?.type === "error") {
      setCouponFeedback(null);
    }
  };

  const handleTogglePaymentCouponField = () => {
    setShowPaymentCouponField((prev) => {
      const next = !prev;
      if (next) {
        setTimeout(() => {
          const input = document.getElementById("checkout-coupon-input");
          if (input instanceof HTMLInputElement) {
            input.focus();
          }
        }, 50);
      }
      return next;
    });
  };


  const [agreements, setAgreements] = useState({
    privacy: false,
    booking: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmationPopup, setShowConfirmationPopup] = useState(false);
  const [popupBookingData] = useState({
    bookingId: "",
    checkIn: "",
    checkOut: "",
    email: "",
    allocatedRoomType: "",
  });

  if (!bookingData) {
    return (
      <div className="min-h-screen bg-[#F8F5EF] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            No Booking Data
          </h2>
          <p className="text-gray-600 mb-6">
            Please start by selecting your dates and room.
          </p>
          <button
            onClick={() => router.push("/")}
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

  const updateReservationGuest = (
    id: string,
    field: keyof ReservationGuest,
    value: string | File | undefined
  ) => {
    setReservationGuests((prev) =>
      prev.map((g) => (g.id === id ? { ...g, [field]: value } : g))
    );
  };

  const addReservationGuest = () => {
    // Basic limit check
    // The primary guest (Contact Person) counts as 1
    // Extra guests can satisfy the remaining count
    const totalBookedGuests = (bookingData?.guests.adults || 0) + (bookingData?.guests.children || 0);
    const existingCount = reservationGuests.length + 1; // +1 for the main Guest 1 (Contact Person)

    if (existingCount >= totalBookedGuests) {
      showToast(`You have booked for ${totalBookedGuests} guests. You cannot add more details.`, "error");
      return;
    }

    const newGuest: ReservationGuest = {
      id: Date.now().toString(),
      firstName: "",
      lastName: "",
      specialNeeds: "",
      idDocument: undefined,
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

  // Removed unused function: updatePayment

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();



    if (!agreements.privacy || !agreements.booking) {
      showToast("Please accept the terms and conditions", "error");
      return;
    }

    if (!guests[0].firstName || !guests[0].lastName || !guests[0].email) {
      showToast("Please fill in all required guest information", "error");
      return;
    }

    const paymentValidation = validatePaymentInputs();
    if (Object.keys(paymentValidation).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      const bookingId = `BKG${Date.now()}`;
      const totalAmount = calculateTotal();




      if (totalAmount <= 0) {
        showToast("Invalid booking amount", "error");
        setIsSubmitting(false);
        return;
      }

      const bookingDetails = {
        checkIn: bookingData.checkIn,
        checkOut: bookingData.checkOut,
        guests: bookingData.guests,
        guestDetails: {
          firstName: guests[0].firstName,
          lastName: guests[0].lastName,
          email: guests[0].email,
          phone: guests[0].mobile,
          prefix: guests[0].prefix,
        },
        address: {
          country: address.country,
          city: address.city,
          zipCode: address.zipCode,
          address1: address.address1,
          address2: address.address2,
        },
        reservationGuests: reservationGuests.map((guest) => ({
          firstName: guest.firstName,
          lastName: guest.lastName,
          specialNeeds: guest.specialNeeds,
          // Storing the file name as a string for now since we don't have a storage uploader ready in this context
          // In a full implementation, this should be the download URL after uploading to Firebase Storage
          idDocumentName: guest.idDocument?.name
        })),
        rooms: rooms.map((room) => ({
          name: room.name,
          type: room.type,
          price: room.price,
          suiteType: room.suiteType || (room.name.includes('Imperial') ? 'Imperial Suite' : room.name.includes('Garden') ? 'Garden Suite' : 'Ocean Suite'),
          mealPlan: room.mealPlan,
          mealPlanPrice: room.mealPlanPrice,
          mealPlanDetails: room.mealPlanDetails
        })),
        addOns: addOns.map((addon) => ({
          name: addon.name,
          price: addon.price,
          quantity: addon.quantity,
        })),
        totalAmount: totalAmount,
        bookingId: bookingId,
        status: "pending" as const,
        paymentStatus: "pending" as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };



      // Check availability
      const { checkRoomAvailability } = await import("@/lib/bookingService");
      const availability = await checkRoomAvailability(bookingDetails);



      if (!availability.available) {
        showToast(availability.message, "error");
        setIsSubmitting(false);
        return;
      }

      // Save booking to localStorage
      localStorage.setItem("pendingBooking", JSON.stringify(bookingDetails));

      const baseURL = window.location.origin;

      // Call DPO through server action

      const paymentResult = await createPaymentToken({
        amount: totalAmount,
        companyRef: bookingId,
        customerFirstName: guests[0].firstName.trim(),
        customerLastName: guests[0].lastName.trim(),
        customerEmail: guests[0].email.trim(),
        customerPhone: guests[0].mobile.trim() || "0000000000",
        redirectURL: `${baseURL}/payment/success`,
        backURL: `${baseURL}/payment/failure`,
        serviceDescription: `Hotel Booking - ${rooms.length > 0 ? rooms[0].name : "Room"
          } - ${getNumberOfNights()} night(s)`,
        customerAddress: address.address1 || undefined,
        customerCity: address.city || undefined,
        customerCountry: address.country || undefined,
        customerZip: address.zipCode || undefined,
      });



      if (!paymentResult.success) {
        console.error("❌ Payment failed:::::", paymentResult.error);
        if ("details" in paymentResult && paymentResult.details) {
          console.error("❌ Details::::::", paymentResult.details);
        }
        throw new Error(paymentResult.error || "Failed to create payment");
      }



      // Redirect to DPO payment page
      if (!paymentResult.paymentURL) {
        throw new Error("Failed to generate payment URL");
      }

      showToast("Redirecting to secure payment page...", "success");
      window.location.href = paymentResult.paymentURL;
    } catch (err) {
      console.error("Payment Error: ", err);
      // ... error handling
      showToast(
        `Payment processing error: ${err instanceof Error ? err.message : "Unknown error"}`,
        "error"
      );
    } finally {
      setIsSubmitting(false);
    }
  };



  const handlePopupClose = () => {
    setShowConfirmationPopup(false);
    if (popupBookingData.bookingId) {
      router.push(`/confirmation?id=${popupBookingData.bookingId}`);
    } else {
      router.push("/confirmation");
    }
  };

  const couponAlreadyApplied = Boolean(
    appliedCoupon && appliedCoupon.code === payment.couponCode
  );

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Dedicated Header Background */}
      <div className="w-full h-[270px] bg-[#0a1a2b] absolute top-0 left-0 z-0" />

      {/* Navigation Section */}
      <div className="w-full max-w-[1512px] mx-auto px-4 md:px-[63px] lg:px-[120px] pt-[150px] md:pt-[200px] lg:pt-[220px] relative z-10">
        <div className="w-full lg:w-[850px]">
          <button
            onClick={() => router.push("/add-ons")}
            className="flex items-center gap-5 text-white"
          >
            <ArrowLeftIcon className="w-6 h-6" />
            <span className="text-xl font-semibold">Check out</span>
          </button>
        </div>
      </div>

      {/* Main Content - Two Column Layout */}
      <div className="mt-12 pb-16">
        <div className="w-full max-w-[1512px] mx-auto px-4 md:px-[63px] lg:px-[120px] flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Left Column - Form */}
          <div className="w-full lg:w-[850px] px-0">
            <div className="bg-[#F8F8F8] p-4 md:p-8">
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Reservation Overview */}
                <div className="space-y-4">
                  <h2 className="text-[20px] font-normal text-black">
                    Reservation Overview
                  </h2>

                  <div className="border border-[rgba(0,0,0,0.24)] p-[15px]">
                    <div className="flex justify-between items-start mb-[21px]">
                      <div className="space-y-[10px]">
                        <h3 className="text-[20px] font-semibold text-[#423B2D]">
                          {rooms.length > 0
                            ? rooms[0].name
                            : "No room selected"}
                        </h3>
                        {bookingData && (
                          <div className="flex gap-4 text-[14px] text-[#423B2D] font-medium bg-[#F0F6FF] p-2 rounded w-fit">
                            <span className="flex items-center gap-1">
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                              </svg>
                              {bookingData.guests.rooms} Room{bookingData.guests.rooms > 1 ? 's' : ''}
                            </span>
                            <span className="flex items-center gap-1">
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                              </svg>
                              {bookingData.guests.adults} Adult{bookingData.guests.adults > 1 ? 's' : ''}
                            </span>
                            {bookingData.guests.children > 0 && (
                              <span className="flex items-center gap-1">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                                </svg>
                                {bookingData.guests.children} Child{bookingData.guests.children > 1 ? 'ren' : ''}
                              </span>
                            )}
                          </div>
                        )}
                        <p className="text-[15px] font-bold text-[#1D69F9]">
                          Total Stay: {getNumberOfNights()} Night
                          {getNumberOfNights() > 1 ? "s" : ""}
                        </p>
                        <p className="text-[15px] font-bold text-black">
                          Date:{" "}
                          {bookingData
                            ? `${new Date(
                              bookingData.checkIn
                            ).toLocaleDateString("en-US", {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })} - ${new Date(
                              bookingData.checkOut
                            ).toLocaleDateString("en-US", {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}`
                            : "Thu, Nov 20, 2025 - Fri, Nov 21, 2025"}
                        </p>
                        <p className="text-[14px] text-[#489219] font-medium flex items-center gap-1 mt-1">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          Free cancellation till {(() => {
                            if (!bookingData?.checkIn) return "Dec 29th";
                            const checkInDate = new Date(bookingData.checkIn);
                            const cancellationDays = rooms[0]?.cancellationFreeDays ?? 2;
                            checkInDate.setDate(checkInDate.getDate() - cancellationDays);
                            return checkInDate.toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric"
                            });
                          })()}
                        </p>
                      </div>
                      <button
                        type="button"
                        className="flex items-center gap-[10px] text-[15px] font-semibold text-[#1D69F9]"
                      >
                        <PencilIcon className="w-[19px] h-[19px]" />
                        Edit
                      </button>
                    </div>

                    <div className="flex items-center gap-7">
                      <div className="text-center">
                        <p className="text-[16px] font-semibold text-black">
                          Check-in
                        </p>
                        <p className="text-[16px] font-semibold text-black">
                          after 3:00 pm
                        </p>
                      </div>
                      <div className="w-px h-10 bg-[rgba(0,0,0,0.29)]"></div>
                      <div className="text-center">
                        <p className="text-[16px] font-semibold text-black">
                          Check-out
                        </p>
                        <p className="text-[16px] font-semibold text-black">
                          before 12:00 pm
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Guest Details */}
                <div className="space-y-4">
                  <h2 className="text-[20px] font-normal text-black">
                    Guest Details
                  </h2>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[14px] text-[#202C3B] mb-1">
                          Prefix<span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <select
                            value={guests[0].prefix}
                            onChange={(e) =>
                              updateGuest(
                                guests[0].id,
                                "prefix",
                                e.target.value
                              )
                            }
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
                          onChange={(e) =>
                            updateGuest(
                              guests[0].id,
                              "firstName",
                              e.target.value
                            )
                          }
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
                          onChange={(e) =>
                            updateGuest(
                              guests[0].id,
                              "lastName",
                              e.target.value
                            )
                          }
                          className="w-full px-3 py-2 border border-[rgba(0,0,0,0.25)] text-[14px] text-[#313131]"
                          placeholder=""
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[14px] text-[#202C3B] mb-1">
                          Mobile Phone
                        </label>
                        <input
                          type="tel"
                          value={guests[0].mobile}
                          onChange={(e) =>
                            updateGuest(guests[0].id, "mobile", e.target.value)
                          }
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
                          onChange={(e) =>
                            updateGuest(guests[0].id, "email", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-[rgba(0,0,0,0.25)] text-[14px] text-[#313131]"
                          placeholder=""
                          required
                        />
                      </div>
                    </div>

                    <p className="text-[14px] text-[#202C3B] text-right">
                      This is the email we will send your confirmation to.
                    </p>
                  </div>
                </div>

                <div className="w-full h-px bg-[rgba(0,0,0,0.03)]"></div>

                <div className="space-y-4">
                  <h2 className="text-[20px] font-normal text-black">
                    Address
                  </h2>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[14px] text-[#202C3B] mb-1">
                          Country
                        </label>
                        <div className="relative">
                          <select
                            value={address.country}
                            onChange={(e) =>
                              updateAddress("country", e.target.value)
                            }
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
                            <option value="CD">
                              Democratic Republic of Congo
                            </option>
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
                        <label className="block text-[14px] text-[#202C3B] mb-1">
                          City
                        </label>
                        <input
                          type="text"
                          value={address.city}
                          onChange={(e) =>
                            updateAddress("city", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-[rgba(0,0,0,0.25)] text-[14px] text-[#313131]"
                          placeholder=""
                        />
                      </div>

                      <div>
                        <label className="block text-[14px] text-[#202C3B] mb-1">
                          Zip / Postal Code
                        </label>
                        <input
                          type="text"
                          value={address.zipCode}
                          onChange={(e) =>
                            updateAddress("zipCode", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-[rgba(0,0,0,0.25)] text-[14px] text-[#313131]"
                          placeholder=""
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[14px] text-[#202C3B] mb-1">
                          Address 1
                        </label>
                        <input
                          type="text"
                          value={address.address1}
                          onChange={(e) =>
                            updateAddress("address1", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-[rgba(0,0,0,0.25)] text-[14px] text-[#313131]"
                          placeholder=""
                        />
                      </div>

                      <div>
                        <label className="block text-[14px] text-[#202C3B] mb-1">
                          Address 2
                        </label>
                        <input
                          type="text"
                          value={address.address2}
                          onChange={(e) =>
                            updateAddress("address2", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-[rgba(0,0,0,0.25)] text-[14px] text-[#313131]"
                          placeholder=""
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="w-full h-px bg-[rgba(0,0,0,0.03)]"></div>

                <div className="space-y-4">
                  <h2 className="text-[20px] font-normal text-black">
                    Reservation Details
                  </h2>

                  <div className="space-y-4">
                    {reservationGuests.map((guest, index) => (
                      <div key={guest.id} className="space-y-3">
                        <div className="flex justify-between items-center">
                          <h3 className="text-[16px] text-[#FF6A00]">
                            Guest {index + 1}
                          </h3>
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
                            <label className="block text-[14px] text-[#202C3B] mb-1">
                              First Name
                            </label>
                            <input
                              type="text"
                              value={guest.firstName}
                              onChange={(e) =>
                                updateReservationGuest(
                                  guest.id,
                                  "firstName",
                                  e.target.value
                                )
                              }
                              className="w-full px-3 py-2 border border-[rgba(0,0,0,0.22)] text-[14px] text-[#313131]"
                              placeholder=""
                            />
                          </div>

                          <div>
                            <label className="block text-[14px] text-[#202C3B] mb-1">
                              Last Name
                            </label>
                            <input
                              type="text"
                              value={guest.lastName}
                              onChange={(e) =>
                                updateReservationGuest(
                                  guest.id,
                                  "lastName",
                                  e.target.value
                                )
                              }
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
                              accept=".pdf,image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  console.log("File selected for guest", guest.id, ":", file.name);
                                  updateReservationGuest(guest.id, "idDocument", file);
                                }
                              }}
                            />
                          </label>

                          <p className="text-[12px] text-[#202C3B] flex items-center">
                            Please upload your ID in PDF or Image format
                            <br />
                            (max 2MB) for verification.
                          </p>

                          {guest.idDocument && (
                            <div className="flex items-center gap-2 text-sm text-green-600">
                              <span>✓ {guest.idDocument.name}</span>
                            </div>
                          )}

                          <div className="flex-1">
                            <input
                              type="text"
                              value={guest.specialNeeds}
                              onChange={(e) =>
                                updateReservationGuest(
                                  guest.id,
                                  "specialNeeds",
                                  e.target.value
                                )
                              }
                              className="w-full px-3 py-2 border border-[rgba(0,0,0,0.22)] text-[14px] text-[rgba(0,0,0,0.38)]"
                              placeholder="Please note your request or special needs"
                            />
                          </div>
                        </div>
                      </div>
                    ))}

                    <div className="flex flex-col gap-2">
                      <p className="text-[12px] text-gray-500 italic text-center">
                        Note: You have booked for {(bookingData?.guests.adults || 0) + (bookingData?.guests.children || 0)} guests.
                        Added keys must match your booking selection.
                      </p>
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
                </div>

                <div className="w-full h-px bg-[rgba(0,0,0,0.03)]"></div>

                <div className="space-y-4">
                  <h2 className="text-[20px] font-normal text-black">
                    Payment
                  </h2>

                  <div className="space-y-4">
                    <p className="text-[12px] text-[#FF1414]">
                      Your booking will not be confirmed until payment is
                      processed
                    </p>

                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-[14px] text-black">
                          Use of card & Coupon Code
                        </p>
                        <button
                          type="button"
                          onClick={handleTogglePaymentCouponField}
                          className="flex items-center gap-2 text-[#1D69F9] text-[14px] font-semibold"
                        >
                          <TagIcon className="w-4 h-4" />
                          {showPaymentCouponField
                            ? "Hide Offer"
                            : "Apply Offer"}
                        </button>
                      </div>
                      <div className="w-full h-px bg-[rgba(0,0,0,0.34)]"></div>
                    </div>

                    {showPaymentCouponField && !appliedCoupon && (
                      <div className="space-y-2">
                        <label className="block text-[14px] text-[#202C3B]">
                          Coupon Code
                        </label>
                        <div className="flex gap-3">
                          <input
                            id="checkout-coupon-input"
                            type="text"
                            value={payment.couponCode}
                            onChange={(e) =>
                              handleCouponInputChange(e.target.value)
                            }
                            className="flex-1 px-3 py-2 border border-[rgba(0,0,0,0.25)] text-[14px] text-[#313131] uppercase tracking-[0.15em]"
                            placeholder="ENTER CODE"
                            autoComplete="off"
                            maxLength={16}
                            disabled={couponAlreadyApplied}
                          />
                          <button
                            type="button"
                            onClick={handleApplyCoupon}
                            className={`px-6 py-[7px] text-white text-[18px] font-semibold ${couponAlreadyApplied
                              ? "bg-gray-400 cursor-not-allowed"
                              : "bg-[#1D69F9] hover:bg-[#1750c2] transition-colors"
                              }`}
                            disabled={couponAlreadyApplied || isApplyingCoupon}
                          >
                            {couponAlreadyApplied
                              ? "Applied"
                              : isApplyingCoupon
                                ? "Applying..."
                                : "Apply"}
                          </button>
                        </div>
                      </div>
                    )}

                    {showPaymentCouponField && couponFeedback && (
                      <p
                        className={`text-sm ${couponFeedback.type === "success"
                          ? "text-green-600"
                          : "text-red-600"
                          }`}
                      >
                        {couponFeedback.message}
                      </p>
                    )}

                    {appliedCoupon && (
                      <div className="flex items-center justify-between border border-green-500 bg-green-50 px-3 py-2 text-sm text-green-700 rounded">
                        <span>
                          Coupon <strong>{appliedCoupon.code}</strong> active
                          {appliedCoupon.discountType === "percentage" &&
                            ` (${appliedCoupon.discountValue}% off)`}
                        </span>
                        <button
                          type="button"
                          onClick={handleRemoveCoupon}
                          className="text-xs text-red-500 hover:text-red-700 font-semibold"
                        >
                          Remove
                        </button>
                      </div>
                    )}

                    {/* Credit Card UI disabled for DPO integration
                <div className="space-y-3">
                  <div>
                    <label className="block text-[14px] text-[#202C3B] mb-1">
                      Cardholder Name
                    </label>
                    <input
                      type="text"
                      value={payment.cardHolderName}
                      onChange={(e) => handleCardHolderChange(e.target.value)}
                      className={`w-full px-3 py-2 border ${cardErrors.cardHolderName ? 'border-red-500' : 'border-[rgba(0,0,0,0.25)]'} text-[14px] text-[#313131]`}
                      placeholder="Name on card"
                      autoComplete="cc-name"
                    />
                    {cardErrors.cardHolderName && (
                      <p className="text-xs text-red-600 mt-1">{cardErrors.cardHolderName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[14px] text-[#202C3B] mb-1">
                      Card Number
                    </label>
                    <input
                      type="text"
                      value={payment.cardNumber}
                      onChange={(e) => handleCardNumberChange(e.target.value)}
                      className={`w-full px-3 py-2 border ${cardErrors.cardNumber ? 'border-red-500' : 'border-[rgba(0,0,0,0.25)]'} text-[14px] text-[#313131] tracking-[0.25em]`}
                      placeholder="0000 0000 0000 0000"
                      inputMode="numeric"
                      autoComplete="cc-number"
                      maxLength={19}
                    />
                    {cardErrors.cardNumber && (
                      <p className="text-xs text-red-600 mt-1">{cardErrors.cardNumber}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[14px] text-[#202C3B] mb-1">
                        Expiration Date
                      </label>
                      <input
                        type="text"
                        value={payment.expiryDate}
                        onChange={(e) => handleExpiryChange(e.target.value)}
                        className={`w-full px-3 py-2 border ${cardErrors.expiryDate ? 'border-red-500' : 'border-[rgba(0,0,0,0.25)]'} text-[14px] text-[#313131]`}
                        placeholder="MM/YY"
                        inputMode="numeric"
                        autoComplete="cc-exp"
                        maxLength={5}
                      />
                      {cardErrors.expiryDate && (
                        <p className="text-xs text-red-600 mt-1">{cardErrors.expiryDate}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-[14px] text-[#202C3B] mb-1">
                        CVV
                      </label>
                      <input
                        type="password"
                        value={payment.cvv}
                        onChange={(e) => handleCvvChange(e.target.value)}
                        className={`w-full px-3 py-2 border ${cardErrors.cvv ? 'border-red-500' : 'border-[rgba(0,0,0,0.25)]'} text-[14px] text-[#313131]`}
                        placeholder="123"
                        maxLength={4}
                        inputMode="numeric"
                        autoComplete="cc-csc"
                      />
                      {cardErrors.cvv && (
                        <p className="text-xs text-red-600 mt-1">{cardErrors.cvv}</p>
                      )}
                    </div>
                  </div>
                </div>
                */}

                    <div className="space-y-[15px]">
                      <p className="text-[16px] font-semibold text-black">
                        ${calculateTotal().toFixed(2)} deposit due now.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="w-full h-px bg-[rgba(0,0,0,0.03)]"></div>

                <div className="space-y-4">
                  <h2 className="text-[20px] font-normal text-black">
                    Policies & Acknowledgements
                  </h2>

                  <div className="space-y-4">
                    <label className="flex items-center gap-5">
                      <input
                        type="checkbox"
                        checked={agreements.privacy}
                        onChange={(e) =>
                          setAgreements((prev) => ({
                            ...prev,
                            privacy: e.target.checked,
                          }))
                        }
                        className="w-[30px] h-[30px] border border-[rgba(0,0,0,0.49)]  bg-[#D9D9D9]"
                      />
                      <span className="text-[16px] text-black">
                        I agree with the privacy terms
                      </span>
                    </label>

                    <label className="flex items-center gap-5">
                      <input
                        type="checkbox"
                        checked={agreements.booking}
                        onChange={(e) =>
                          setAgreements((prev) => ({
                            ...prev,
                            booking: e.target.checked,
                          }))
                        }
                        className="w-[30px] h-[30px] border border-[rgba(0,0,0,0.49)]  bg-[#D9D9D9]"
                      />
                      <span className="text-[16px] text-black">
                        I agree with the booking conditions
                      </span>
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={
                    !agreements.privacy || !agreements.booking || isSubmitting
                  }
                  className={`w-full py-[7px] text-white text-[18px] font-semibold transition-colors flex items-center justify-center ${agreements.privacy && agreements.booking && !isSubmitting
                    ? "bg-[#1D69F9] hover:bg-[#1A5CE6] cursor-pointer"
                    : "bg-gray-300 cursor-not-allowed"
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

          <div className="w-full lg:w-[534px] px-0" id="checkout-cart-summary">
            <div className="lg:sticky lg:top-28">
              <CartSummary
                variant="checkout"
                showCheckoutButton={false}
                className="shadow-[0px_20px_60px_rgba(0,0,0,0.06)]"
              />
            </div>
          </div>
        </div>
      </div>


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

