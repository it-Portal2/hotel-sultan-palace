"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';
import BookingEnquiryModal from '@/components/booking/BookingEnquiryModal';

interface BookingEnquiryContextType {
  openModal: () => void;
  closeModal: () => void;
}

export const BookingEnquiryContext = createContext<BookingEnquiryContextType | undefined>(undefined);

export function BookingEnquiryProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);

  return (
    <BookingEnquiryContext.Provider value={{ openModal, closeModal }}>
      {children}
      <BookingEnquiryModal isOpen={isOpen} onClose={closeModal} />
    </BookingEnquiryContext.Provider>
  );
}

export function useBookingEnquiry() {
  const context = useContext(BookingEnquiryContext);
  if (context === undefined) {
    throw new Error('useBookingEnquiry must be used within a BookingEnquiryProvider');
  }
  return context;
}

