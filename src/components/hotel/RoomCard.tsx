'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Room } from '@/lib/firestoreService';
import RoomDetailsModal from './RoomDetailsModal';
import { AppliedOfferInfo, calculateDiscountAmount } from '@/lib/offers';
import {
  MdDone as DoneIcon,
  MdCreditCardOff as NoCreditCardIcon,
  MdChildCare as ChildIcon,
  MdOutlineAdd as AddIcon,
  MdOutlineRemove as RemoveIcon,
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
import { MdPool as PoolIcon, MdChildCare as CotIcon } from 'react-icons/md';
import { ClipboardDocumentIcon } from '@heroicons/react/24/outline';
import { IconType } from 'react-icons';

interface RoomCardProps {
  room: Room;
  checkIn: Date | null;
  checkOut: Date | null;
  guests: { adults: number; children: number; rooms: number };
  onGuestChange: (key: 'adults' | 'children' | 'rooms', delta: number) => void;
  onReserve: (room: Room, roomCount: number, guests: { adults: number; children: number; rooms: number }) => void;
  formatDate: (date: Date | null) => string;
  availableRoomCount?: number;
  activeOffer?: AppliedOfferInfo | null;
  nights: number;
}

const GuestControl = ({ label, value, onIncrease, onDecrease, min, max }: {
  label: string;
  value: number;
  onIncrease: () => void;
  onDecrease: () => void;
  min: number;
  max?: number;
}) => (
  <div className="flex items-center justify-between">
    <span className="text-[12px] md:text-[14px] text-[#383838]">{label}</span>
    <div className="flex items-center gap-1.5 md:gap-2 border border-[#383838] rounded-[4px] px-1 md:px-[5px] py-1 md:py-[3px]">
      <button
        onClick={onDecrease}
        disabled={value <= min}
        className="text-[#383838] disabled:opacity-50 w-5 h-5 md:w-6 md:h-6 flex items-center justify-center transition-colors hover:bg-gray-100 rounded"
        aria-label={`Decrease ${label}`}
      >
        <RemoveIcon className="text-[16px] md:text-[18px]" />
      </button>
      <span className="text-[12px] md:text-[14px] text-[#383838] w-4 md:w-5 text-center">{value}</span>
      <button
        onClick={onIncrease}
        disabled={max !== undefined && value >= max}
        className="text-[#383838] disabled:opacity-50 w-5 h-5 md:w-6 md:h-6 flex items-center justify-center transition-colors hover:bg-gray-100 rounded"
        aria-label={`Increase ${label}`}
      >
        <AddIcon className="text-[16px] md:text-[18px]" />
      </button>
    </div>
  </div>
);


export default function RoomCard({
  room,
  checkIn,
  checkOut,
  guests: globalGuests,
  onGuestChange,
  onReserve,
  formatDate,
  availableRoomCount,
  activeOffer,
  nights,
}: RoomCardProps) {
  const router = useRouter();
  const [localRoomCount, setLocalRoomCount] = useState(1);
  const [localGuests, setLocalGuests] = useState(globalGuests); // Local state for independent control
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copiedCouponId, setCopiedCouponId] = useState<string | null>(null);

  // Calculate max capacity based on room details and local room count
  const maxGuestsPerRoom = room.maxGuests;
  const totalCapacity = maxGuestsPerRoom * localRoomCount;

  // Sync effect to clamp guests if room count decreases
  useEffect(() => {
    const currentTotal = localGuests.adults + localGuests.children;
    if (currentTotal > totalCapacity) {
      // Need to reduce guests. We prioritize reducing children first, then adults.
      const excess = currentTotal - totalCapacity;
      const newChildren = Math.max(0, localGuests.children - excess);
      const remainingExcess = excess - (localGuests.children - newChildren);
      const newAdults = Math.max(1, localGuests.adults - remainingExcess);

      setLocalGuests(prev => ({
        ...prev,
        adults: newAdults,
        children: newChildren
      }));
    }
  }, [localRoomCount, totalCapacity, localGuests.adults, localGuests.children]);

  // Sync local state with global search params when they change (Top-down sync)
  useEffect(() => {
    const totalGuests = globalGuests.adults + globalGuests.children;
    // Calculate how many rooms are needed for these guests
    const requiredRooms = Math.ceil(totalGuests / room.maxGuests);

    // New room count should be the max of:
    // 1. What the user asked for globally (globalGuests.rooms)
    // 2. What is needed to fit the people (requiredRooms)
    // 3. At least 1 room
    let newRoomCount = Math.max(globalGuests.rooms, requiredRooms, 1);

    // If we know available rooms, cap it.
    if (availableRoomCount !== undefined && availableRoomCount > 0) {
      newRoomCount = Math.min(newRoomCount, availableRoomCount);
    }

    setLocalRoomCount(newRoomCount);
    setLocalGuests(globalGuests);

  }, [globalGuests, room.maxGuests, availableRoomCount]);

  const handleGuestChange = (key: 'adults' | 'children' | 'rooms', delta: number) => {
    setLocalGuests(prev => {
      // Optimistic check to prevent going over capacity in the first place
      // This is a double-check in addition to the button disabled state
      if (delta > 0) {
        const currentTotal = prev.adults + prev.children;
        if (currentTotal >= totalCapacity) return prev;
      }

      return {
        ...prev,
        [key]: Math.max(key === 'children' ? 0 : 1, prev[key] + delta)
      };
    });
  };

  const nightsText = nights > 1 ? `${nights} nights` : '1 night';

  const basePrice = room.price * nights * localRoomCount;
  const originalPrice = Math.round(basePrice);
  const discountAmount = activeOffer
    ? Math.round(
      calculateDiscountAmount(basePrice, {
        discountType: activeOffer.discountType,
        discountValue: activeOffer.discountValue,
        stayNights: activeOffer.stayNights,
        payNights: activeOffer.payNights,
      }, nights)
    )
    : 0;
  const discountedPrice = Math.max(0, originalPrice - discountAmount);

  const currentTotalGuests = localGuests.adults + localGuests.children;

  const getCancellationText = (): string => {
    const daysBefore = room.cancellationFreeDays ?? 2;

    if (!checkIn) {

      return `Free cancellation ${daysBefore} day${daysBefore > 1 ? 's' : ''} before check-in`;
    }

    const cancellationDate = new Date(checkIn);
    cancellationDate.setDate(checkIn.getDate() - daysBefore);

    return `Free cancellation before ${cancellationDate.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })}`;
  };

  const getAmenityIcon = (amenity: string): IconType => {
    const amenityLower = amenity.toLowerCase();
    if (amenityLower.includes('wifi') || amenityLower.includes('wi-fi')) return WifiIcon;
    if (amenityLower.includes('air') && amenityLower.includes('condition')) return AcIcon;
    if (amenityLower.includes('balcony')) return BalconyIcon;
    if (amenityLower.includes('garden') && amenityLower.includes('view')) return GardenIcon;
    if (amenityLower.includes('sea') && amenityLower.includes('view')) return GardenIcon;
    if (amenityLower.includes('private') && amenityLower.includes('suite')) return PrivateSuiteIcon;
    if (amenityLower.includes('romm')) return RoomIcon;

    if (amenityLower.includes('bathroom') || amenityLower.includes('bath')) return BathIcon;
    if (amenityLower.includes('pool') && amenityLower.includes('view')) return PoolIcon;
    return WifiIcon;
  };

  const amenities = room.amenities?.map(amenity => ({
    icon: getAmenityIcon(amenity),
    label: amenity
  })) || [];

  const getValidityText = () => {
    if (!activeOffer) return null;
    const start = activeOffer.startDate ? new Date(activeOffer.startDate) : null;
    const end = activeOffer.endDate ? new Date(activeOffer.endDate) : null;
    if (start && end) {
      return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
    }
    if (start) return `Valid from ${start.toLocaleDateString()}`;
    if (end) return `Valid until ${end.toLocaleDateString()}`;
    return null;
  };

  return (
    <>
      <div className="flex flex-col lg:grid lg:grid-cols-[1.5fr_1fr_1fr] h-full min-h-0">

        <div className="p-4 md:p-[20px] lg:p-[30px] flex flex-col justify-between space-y-4 min-h-0">
          <div>
            <div className="mb-[10px]">
              <h3
                className="text-[18px] md:text-[20px] font-semibold text-[#1D69F9] mb-[5px] cursor-pointer hover:underline"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsModalOpen(true);
                }}
              >
                {room.name}
              </h3>
              {availableRoomCount !== undefined && checkIn && checkOut && (
                <p className="text-[12px] md:text-[13px] text-[#FF0000] bg-[#FFE5E5] px-2 py-1 rounded-[4px] font-medium w-fit">
                  {availableRoomCount > 0
                    ? `${availableRoomCount} room${availableRoomCount > 1 ? 's' : ''} available`
                    : 'No rooms available'
                  }
                </p>
              )}
            </div>

            <div className="space-y-[7px] mb-[15px] text-[#373737]">
              <div className="flex items-center gap-[5px]">
                <BedIcon className="text-[#363636] text-[16px] md:text-[18px]" />
                <span className="text-[13px] md:text-[14px]">{room.beds}</span>
              </div>
              <div className="flex items-center gap-[9px]">
                <SizeIcon className="text-[#363636] text-[16px] md:text-[18px]" />
                <span className="text-[13px] md:text-[14px]">Size: {room.size || '150 m²'}</span>
              </div>
              <div className="flex items-center gap-[7px]">
                <CotIcon className="text-[#363636] text-[16px] md:text-[18px]" />
                <span className="text-[13px] md:text-[14px]">Cot available on request</span>
              </div>
              <div className="flex items-center gap-[7px]">
                <span className="text-[13px] md:text-[14px] font-medium text-[#1D69F9]">
                  Max Guests: {room.maxGuests} per room
                </span>
              </div>
            </div>

            <p className="text-[13px] md:text-[14px] text-[#373737] leading-[1.6] mb-[20px] line-clamp-3 md:line-clamp-none">{room.description}</p>

            <div className="flex flex-wrap gap-x-[15px] md:gap-x-[25px] gap-y-[8px] md:gap-y-[10px]">
              {amenities.map(item => {
                const IconComponent: IconType = item.icon;
                return (
                  <div key={item.label} className="flex items-center gap-[4px]">
                    <IconComponent className="text-[#464646] text-[14px] md:text-[16px]" />
                    <span className="text-[12px] md:text-[14px] text-[#464646]">{item.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className={`relative flex flex-col justify-center border-[1.5px] p-3 md:p-[14px] w-full lg:w-[376px] min-h-[300px] h-auto bg-[#EBFDED] border-[#88B988]`}>

          <div className="absolute top-2 right-2 md:top-[8px] md:right-[14px]">
            <span className="text-[11px] md:text-[13px] font-light text-[rgba(0,0,0,0.83)]">
              {activeOffer ? 'Discount' : 'No discount available'}
            </span>
          </div>

          <div className="absolute top-7 right-2 md:top-[35px] md:right-[14px]">
            {activeOffer ? (
              <div className="bg-[#3F8406] text-white rounded-[4px] text-[10px] md:text-[12px] font-semibold whitespace-nowrap px-2 py-1 md:px-3 md:py-[10px] flex items-center justify-center">
                {activeOffer.discountType === 'percentage'
                  ? `${activeOffer.discountValue}% OFF`
                  : activeOffer.discountType === 'pay_x_stay_y'
                    ? 'SPECIAL DEAL'
                    : `Save $${activeOffer.discountValue}`}
              </div>
            ) : (
              <div className="bg-[#F87171] text-white rounded-[4px] text-[10px] md:text-[12px] font-semibold whitespace-nowrap px-2 py-1 md:px-3 md:py-[10px] flex items-center justify-center">
                No Discount
              </div>
            )}
          </div>

          <div className="flex flex-col">
            <p className="text-[12px] md:text-[14px] font-semibold text-[#000000] mb-[10px] pr-16 bg-transparent">
              Price for {nights} {nights > 1 ? 'nights' : 'night'}, {localGuests.adults} {localGuests.adults > 1 ? 'adults' : 'adult'}
              {localRoomCount > 1 && `, ${localRoomCount} rooms`}
            </p>
            <div className="flex items-baseline gap-[5px] mb-[10px] relative">
              {activeOffer ? (
                <>
                  <span className="text-[12px] md:text-[14px] text-[#FF0000] line-through font-medium">
                    ${originalPrice}
                  </span>
                  <span className="text-[18px] md:text-[20px] font-bold text-[#232323]">
                    ${discountedPrice}
                  </span>
                </>
              ) : (
                <span className="text-[20px] font-bold text-[#232323]">
                  ${originalPrice}
                </span>
              )}
            </div>
            {activeOffer ? (
              <>
                <div className="flex flex-col gap-1 w-full my-1">
                  <p className="text-[12px] md:text-[13px] font-semibold text-[#14532D] uppercase tracking-wide">
                    {activeOffer.discountType === 'pay_x_stay_y' && activeOffer.stayNights && activeOffer.payNights
                      ? `STAY ${activeOffer.stayNights.toString().padStart(2, '0')} NIGHTS AND PAY FOR ONLY ${activeOffer.payNights.toString().padStart(2, '0')} NIGHTS`
                      : activeOffer.title || 'Special Offer'
                    }
                  </p>


                  {/* Coupon Code Logic - Static Only */}
                  {activeOffer.couponMode === 'static' && activeOffer.couponCode && (
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        if (typeof window !== 'undefined' && navigator?.clipboard) {
                          navigator.clipboard
                            .writeText(activeOffer.couponCode || '')
                            .then(() => {
                              setCopiedCouponId(activeOffer.id);
                              setTimeout(() => setCopiedCouponId(null), 2000);
                            })
                            .catch(() => { });
                        }
                      }}
                      className="group flex items-center justify-between gap-2 bg-white border border-dashed border-[#1D69F9] rounded px-2.5 py-1.5 cursor-pointer hover:bg-blue-50 transition-colors"
                      title="Click to copy coupon code"
                    >
                      <div className="flex flex-col">
                        <span className="text-[9px] text-gray-500 uppercase">Coupon Code</span>
                        <span className="text-[13px] font-bold text-[#1D69F9] tracking-wider">
                          {activeOffer.couponCode}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[#1D69F9]">
                        {copiedCouponId === activeOffer.id ? (
                          <>
                            <DoneIcon className="w-4 h-4" />
                            <span className="text-[11px] font-medium">Copied</span>
                          </>
                        ) : (
                          <ClipboardDocumentIcon className="w-5 h-5" />
                        )}
                      </div>
                    </div>
                  )}

                  {getValidityText() && (
                    <p className="text-[11px] text-[#065F46] mt-1">{getValidityText()}</p>
                  )}
                </div>
              </>
            ) : (
              <p className="text-[13px] font-semibold text-gray-500 italic mt-2">
                No special offers currently available for this room
              </p>
            )}
          </div>


          <span className="text-[11px] md:text-[12px] font-normal text-[#636468] mb-[10px] mt-[10px]">
            + ${(room.taxes || 0) * nights} taxes and charge
          </span>

          <div className="space-y-[6px] md:space-y-[9px] mt-[12px] md:mt-[18px]">
            <div className="flex items-center gap-[5px] text-[#484848] text-[12px] md:text-[14px] font-semibold">
              <DoneIcon className="text-[#489219] text-[15px] md:text-[17px] flex-shrink-0" />
              <span className="break-words">{getCancellationText()}</span>
            </div>
            <div className="flex items-center gap-[5px] text-[#484848] text-[12px] md:text-[14px] font-semibold">
              <DoneIcon className="text-[#489219] text-[15px] md:text-[17px] flex-shrink-0" />
              <span className="break-words">No prepayment needed – pay at the property</span>
            </div>
            <div className="flex items-center gap-[8px] text-[#484848] text-[12px] md:text-[14px] font-semibold">
              <NoCreditCardIcon className="text-[#489219] text-[11px] md:text-[12px] flex-shrink-0" />
              <span className="break-words">No credit card Needed</span>
            </div>
            <div className="flex items-center gap-[7px] text-[#484848] text-[12px] md:text-[14px] font-semibold">
              <NoCreditCardIcon className="text-[#489219] text-[13px] md:text-[15px] flex-shrink-0" />
              <span className="break-words">Breakfast included</span>
            </div>
            <div className="flex items-center gap-[7px] text-[#484848] text-[12px] md:text-[14px] font-semibold">
              <ChildIcon className="text-[#489219] text-[13px] md:text-[15px] flex-shrink-0" />
              <span className="break-words">Free stay for your child</span>
            </div>
          </div>
        </div>

        <div className="p-4 md:p-[20px] lg:p-[30px] flex flex-col justify-between bg-white space-y-4 min-h-0">

          <div className="bg-[#E9F1FF] border border-[#1D69F9] rounded-[4px] p-2 md:p-[10px] mb-3">
            <div className="flex flex-col gap-[6px] md:gap-[8px]">
              <p className="text-[12px] md:text-[14px] text-[#323232]">Check in - Check out</p>
              <p className="text-[14px] md:text-[16px] font-semibold text-[#0088FF] break-words">
                {checkIn && checkOut
                  ? `${formatDate(checkIn)}-${formatDate(checkOut)}`
                  : 'Select dates'
                }
              </p>
            </div>
            <p className="text-[12px] md:text-[14px] text-[#000000] font-semibold mt-[8px] md:mt-[10px]">{nightsText}</p>
          </div>

          <div className="space-y-[10px] md:space-y-[14px] pb-4">
            <GuestControl
              label="Number of rooms"
              value={localRoomCount}
              onIncrease={() => setLocalRoomCount(prev => prev + 1)}
              onDecrease={() => setLocalRoomCount(prev => Math.max(1, prev - 1))}
              min={1}
              max={availableRoomCount}
            />
            <div className="flex flex-col">
              <GuestControl
                label="Number of Guests"
                value={localGuests.adults}
                onIncrease={() => {
                  if (currentTotalGuests < totalCapacity) {
                    handleGuestChange('adults', 1);
                  }
                }}
                onDecrease={() => handleGuestChange('adults', -1)}
                min={1}
                max={totalCapacity - localGuests.children}
              />
              {currentTotalGuests >= totalCapacity && (
                <span className="text-[10px] text-red-500 mt-1 pl-1">Max capacity reached for selected rooms</span>
              )}
            </div>

            <GuestControl
              label="Child"
              value={localGuests.children}
              onIncrease={() => {
                if (currentTotalGuests < totalCapacity) {
                  handleGuestChange('children', 1);
                }
              }}
              onDecrease={() => handleGuestChange('children', -1)}
              min={0}
              max={totalCapacity - localGuests.adults}
            />
          </div>

          <button
            onClick={async () => {
              if (availableRoomCount !== undefined && availableRoomCount === 0) {
                alert('No rooms available for the selected dates. Please choose different dates.');
                return;
              }
              await onReserve(room, localRoomCount, localGuests);
            }}
            disabled={availableRoomCount !== undefined && availableRoomCount === 0}
            className={`w-full font-medium py-2 md:py-[10px] rounded-[7px] transition-colors text-[16px] md:text-[20px] mt-auto ${availableRoomCount !== undefined && availableRoomCount === 0
              ? 'bg-gray-400 text-white cursor-not-allowed'
              : 'bg-[#1D69F9] text-white hover:bg-[#1a5ae0]'
              }`}
          >
            {availableRoomCount !== undefined && availableRoomCount === 0 ? 'Not Available' : 'Reserve'}
          </button>
        </div>
      </div>
      <RoomDetailsModal
        room={room}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}