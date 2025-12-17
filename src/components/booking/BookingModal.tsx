"use client";

import BookingForm from './BookingForm';

interface BookingModalProps {
  open: boolean;
  onClose: () => void;
}

export default function BookingModal({ open, onClose }: BookingModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="fixed inset-0 bg-transparent" onClick={onClose}></div>
      <div className="relative bg-white rounded-2xl shadow-2xl p-4 md:p-6 w-full max-w-3xl" onClick={(e) => e.stopPropagation()} style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 15px rgba(0, 0, 0, 0.1)' }}>
        <BookingForm onComplete={onClose} />
      </div>
    </div>
  );
}


