'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { Room } from '@/lib/firestoreService';
import { 
  MdClose as CloseIcon,
  MdOutlineBed as BedIcon,
  MdOutlineShower as BathIcon,
  MdOutlineWifi as WifiIcon,
  MdOutlineAcUnit as AcIcon,
  MdOutlineBalcony as BalconyIcon,
  MdOutlinePrivacyTip as PrivateSuiteIcon,
  MdOutlineRoomService as RoomIcon
} from 'react-icons/md';
import { TbRulerMeasure as SizeIcon } from 'react-icons/tb';
import { IoMdFlower as GardenIcon } from 'react-icons/io';
import { MdPool as PoolIcon } from 'react-icons/md';
import { IconType } from 'react-icons';

interface RoomDetailsModalProps {
  room: Room;
  isOpen: boolean;
  onClose: () => void;
}

const bathroomItems = [
  'Bath',
  'Free toiletries',
  'Shower',
  'Bathrobe',
  'Toilet',
  'Slippers',
  'Hairdryer',
  'Toilet paper'
];

const facilities = [
  'Balcony',
  'Air conditioning',
  'Safety deposit box',
  'Hardwood or parquet floors',
  'Socket near the bed',
  'Cleaning products',
  'Seating Area',
  'Private entrance',
  'Mosquito net',
  'Tea/Coffee maker',
  'Dressing room',
  'Electric kettle',
  'Wardrobe or closet',
  'Clothes rack'
];

export default function RoomDetailsModal({ room, isOpen, onClose }: RoomDetailsModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      
      return () => {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  if (!isOpen || !mounted) return null; 

  const getAmenityIcon = (amenity: string): IconType => {
    const amenityLower = amenity.toLowerCase();
    if (amenityLower.includes('wifi') || amenityLower.includes('wi-fi')) return WifiIcon;
    if (amenityLower.includes('air') && amenityLower.includes('condition')) return AcIcon;
    if (amenityLower.includes('balcony')) return BalconyIcon;
    if (amenityLower.includes('garden') && amenityLower.includes('view')) return GardenIcon;
    if (amenityLower.includes('sea') && amenityLower.includes('view')) return GardenIcon;
    if (amenityLower.includes('private') && amenityLower.includes('suite')) return PrivateSuiteIcon;
    if (amenityLower.includes('room')) return RoomIcon;
    if (amenityLower.includes('bathroom') || amenityLower.includes('bath')) return BathIcon;
    if (amenityLower.includes('pool') && amenityLower.includes('view')) return PoolIcon;
    return WifiIcon;
  };

  const modalContent = (
    <div 
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={onClose}
      style={{ zIndex: 99999 }}
    >
      <div 
        className="relative bg-white rounded-lg max-w-6xl w-full my-auto shadow-2xl flex flex-col md:flex-row md:items-stretch"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors"
          aria-label="Close modal"
        >
          <CloseIcon className="text-2xl text-gray-700" />
        </button>

        <div className="relative w-full md:w-1/2 h-[300px] md:h-full bg-gray-200 flex-shrink-0 overflow-hidden">
          {room.image ? (
            <img
              src={room.image}
              alt={room.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                console.error('Image failed to load:', room.image);
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              No image available
            </div>
          )}
        </div>

        <div className="w-full md:w-1/2 p-4 md:p-5 overflow-y-auto max-h-[90vh]">
          <div className="mb-3">
            <h2 className="text-xl font-semibold text-[#1A1A1A] mb-2">{room.name}</h2>
            
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#666666]">
              <div className="flex items-center gap-1">
                <SizeIcon className="text-base" />
                <span>{room.size || '150 m²'}</span>
              </div>
              {room.amenities?.slice(0, 6).map((amenity, index) => {
                const IconComponent = getAmenityIcon(amenity);
                return (
                  <div key={index} className="flex items-center gap-1">
                    <IconComponent className="text-base" />
                    <span>{amenity}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5 mb-3">
            <p className="text-[#333333] text-sm">
              <strong className="font-medium">Room size:</strong> {room.size}
            </p>
            <p className="text-[#333333] text-sm">
              <strong className="font-medium">{room.beds}</strong>
            </p>
            <p className="text-[#333333] text-sm">
              <strong className="font-medium">Comfy beds, 9.2 - Based on 26 reviews</strong>
            </p>
            <p className="text-[#333333] leading-relaxed text-sm">{room.description}</p>
          </div>

          <div className="mb-3">
            <h3 className="text-base font-semibold text-[#1A1A1A] mb-2">In your private bathroom:</h3>
            <div className="grid grid-cols-2 gap-1.5">
              {bathroomItems.map((item, index) => (
                <div key={index} className="flex items-center gap-1.5 text-[#333333]">
                  <span className="text-[#0F5132] text-xs">✓</span>
                  <span className="text-xs">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-3">
            <h3 className="text-base font-semibold text-[#1A1A1A] mb-2">View:</h3>
            <div className="flex items-center gap-1.5 text-[#333333]">
              <span className="text-[#0F5132] text-xs">✓</span>
              <span className="text-sm">{room.view || 'Garden view'}</span>
            </div>
          </div>

          <div className="mb-3">
            <h3 className="text-base font-semibold text-[#1A1A1A] mb-2">Facilities:</h3>
            <div className="grid grid-cols-2 gap-1.5">
              {facilities.map((facility, index) => (
                <div key={index} className="flex items-center gap-1.5 text-[#333333]">
                  <span className="text-[#0F5132] text-xs">✓</span>
                  <span className="text-xs">{facility}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[#333333] text-sm">
              <strong className="font-medium">Smoking:</strong> No smoking
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

