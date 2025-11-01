"use client";

import BookingForm from './BookingForm';

interface BookingModalProps {
  open: boolean;
  onClose: () => void;
}

export default function BookingModal({ open, onClose }: BookingModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl p-4 md:p-6 w-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
        <BookingForm onComplete={onClose} />
      </div>
    </div>
  );
}


