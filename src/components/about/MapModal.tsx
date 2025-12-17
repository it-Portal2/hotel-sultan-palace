"use client";

import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';

interface MapModalProps {
  isOpen: boolean;
  onClose: () => void;
  location: {
    name: string;
    address: string;
    coordinates: string; // Format: "lat,lng"
  };
}

export default function MapModal({ isOpen, onClose, location }: MapModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!mounted || typeof window === 'undefined' || !isOpen) return null;

  // Google Maps embed URL (using search query - no API key needed for basic embed)
  const mapEmbedUrl = `https://www.google.com/maps?q=${encodeURIComponent(location.address)}&output=embed&zoom=15`;

  // Google Maps directions URL
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(location.address)}`;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="fixed inset-0 bg-transparent" onClick={onClose}></div>
      <div
        className="relative w-full h-full md:w-[90%] md:h-[90%] md:max-w-6xl md:max-h-[90vh] bg-white rounded-lg md:rounded-xl shadow-2xl overflow-hidden border border-gray-100"
        onClick={(e) => e.stopPropagation()}
        style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 15px rgba(0, 0, 0, 0.1)' }}
      >
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 bg-white/95 backdrop-blur-sm border-b border-gray-200 px-4 md:px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg md:text-xl font-semibold text-gray-900">{location.name}</h2>
            <p className="text-sm text-gray-600 mt-1">{location.address}</p>
          </div>
          <button
            onClick={onClose}
            className="ml-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close map"
          >
            <X size={24} className="text-gray-600" />
          </button>
        </div>

        {/* Map Container */}
        <div className="w-full h-full pt-16 md:pt-20">
          <iframe
            width="100%"
            height="100%"
            style={{ border: 0 }}
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
            src={mapEmbedUrl}
            className="w-full h-full"
          />
        </div>

        {/* Footer with Directions Button */}
        <div className="absolute bottom-0 left-0 right-0 z-10 bg-white/95 backdrop-blur-sm border-t border-gray-200 px-4 md:px-6 py-4">
          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#FF6A00] hover:bg-[#E55A00] text-white font-semibold px-6 py-3 rounded-lg shadow-lg transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                clipRule="evenodd"
              />
            </svg>
            Get Directions
          </a>
        </div>
      </div>
    </div>,
    document.body
  );
}

