'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { verifyDPOPayment, type DPOVerifyResponse } from '@/lib/dpoPaymentService';
import { useCart } from '@/context/CartContext';
import { createBookingService } from '@/lib/bookingService';
import BookingConfirmationPopup from '@/components/BookingConfirmationPopup';

function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { bookingData, calculateTotal } = useCart();
  
  const [isVerifying, setIsVerifying] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState<'success' | 'failed' | 'pending'>('pending');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [showConfirmationPopup, setShowConfirmationPopup] = useState(false);
  const [popupBookingData, setPopupBookingData] = useState({
    bookingId: '',
    checkIn: '',
    checkOut: '',
    email: '',
    allocatedRoomType: ''
  });

  useEffect(() => {
    const verifyPayment = async () => {
      const token = searchParams?.get('TransactionToken') || searchParams?.get('ID');
      
      if (!token) {
        setVerificationStatus('failed');
        setErrorMessage('Payment token not found');
        setIsVerifying(false);
        return;
      }

      try {
        // Verify payment with DPO
        const verificationResult = await verifyDPOPayment(token);

        if (verificationResult.Result === '000') {
          // Payment successful
          setVerificationStatus('success');
          
          // Create booking in database
          await createBookingFromPayment(verificationResult);
        } else {
          setVerificationStatus('failed');
          setErrorMessage(verificationResult.ResultExplanation || 'Payment verification failed');
        }
      } catch (error) {
        console.error('Payment verification error:', error);
        setVerificationStatus('failed');
        setErrorMessage(error instanceof Error ? error.message : 'Payment verification failed');
      } finally {
        setIsVerifying(false);
      }
    };

    verifyPayment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const createBookingFromPayment = async (paymentData: DPOVerifyResponse) => {
    try {
      if (!bookingData) {
        throw new Error('Booking data not found');
      }

      // Get booking details from localStorage or context
      const storedBooking = localStorage.getItem('pendingBooking');
      if (!storedBooking) {
        throw new Error('Pending booking not found');
      }

      const bookingDetails = JSON.parse(storedBooking);
      
      // Update booking with payment information
      const finalBookingDetails = {
        ...bookingDetails,
        paymentToken: paymentData.TransToken,
        paymentReference: paymentData.TransRef,
        paymentStatus: 'paid',
        status: 'confirmed',
        totalAmount: calculateTotal(),
      };

      // Create booking in Firestore
      const bookingId = await createBookingService(finalBookingDetails);

      if (!bookingId) {
        throw new Error('Failed to create booking');
      }

      // Fetch the created booking to get allocated room types
      const { getBookingById } = await import('@/lib/bookingService');
      const createdBooking = await getBookingById(bookingId);

      // Prepare confirmation data
      const confirmationData = {
        ...finalBookingDetails,
        id: bookingId,
        room: {
          ...finalBookingDetails.rooms[0],
          allocatedRoomType: createdBooking?.rooms[0]?.allocatedRoomType,
          suiteType: createdBooking?.rooms[0]?.suiteType
        },
        total: finalBookingDetails.totalAmount,
        guestDetails: [{
          prefix: bookingDetails.guestDetails.prefix,
          firstName: bookingDetails.guestDetails.firstName,
          lastName: bookingDetails.guestDetails.lastName,
          mobile: bookingDetails.guestDetails.phone,
          email: bookingDetails.guestDetails.email
        }]
      };

      // Store in localStorage for confirmation page
      localStorage.setItem('bookingDetails', JSON.stringify(confirmationData));
      localStorage.removeItem('pendingBooking');

      // Set popup data
      setPopupBookingData({
        bookingId: finalBookingDetails.bookingId,
        checkIn: finalBookingDetails.checkIn,
        checkOut: finalBookingDetails.checkOut,
        email: bookingDetails.guestDetails.email,
        allocatedRoomType: createdBooking?.rooms[0]?.allocatedRoomType || ''
      });

      // Show confirmation popup
      setShowConfirmationPopup(true);
    } catch (error) {
      console.error('Error creating booking from payment:', error);
      setVerificationStatus('failed');
      setErrorMessage(error instanceof Error ? error.message : 'Failed to complete booking');
    }
  };

  const handlePopupClose = () => {
    setShowConfirmationPopup(false);
    router.push('/confirmation');
  };

  return (
    <div className="min-h-screen bg-[#FFFCF6]">
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

      <div className="flex items-center justify-center min-h-[60vh] px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 text-center">
          {isVerifying ? (
            <>
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-500 mx-auto mb-4"></div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Verifying Payment</h2>
              <p className="text-gray-600">Please wait while we verify your payment...</p>
            </>
          ) : verificationStatus === 'success' ? (
            <>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Payment Successful!</h2>
              <p className="text-gray-600 mb-6">Your booking has been confirmed.</p>
              <button
                onClick={() => router.push('/confirmation')}
                className="bg-[#FF6A00] text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors"
              >
                View Booking Details
              </button>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Payment Verification Failed</h2>
              <p className="text-gray-600 mb-6">{errorMessage}</p>
              <button
                onClick={() => router.push('/checkout')}
                className="bg-[#FF6A00] text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors"
              >
                Return to Checkout
              </button>
            </>
          )}
        </div>
      </div>

      <Footer />

      {/* Booking Confirmation Popup */}
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

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#FFFCF6] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}

