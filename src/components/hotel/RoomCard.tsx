'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Room } from '@/lib/firestoreService';
import RoomDetailsModal from './RoomDetailsModal';
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
import { IconType } from 'react-icons';

interface RoomCardProps {
  room: Room;
  checkIn: Date | null;
  checkOut: Date | null;
  guests: { adults: number; children: number; rooms: number };
  onGuestChange: (key: 'adults' | 'children' | 'rooms', delta: number) => void;
  onReserve: (room: Room, roomCount: number) => void;
  formatDate: (date: Date | null) => string;
  availableRoomCount?: number;
}

const GuestControl = ({ label, value, onIncrease, onDecrease, min }: {
    label: string;
    value: number;
    onIncrease: () => void;
    onDecrease: () => void;
    min: number;
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
          className="text-[#383838] w-5 h-5 md:w-6 md:h-6 flex items-center justify-center transition-colors hover:bg-gray-100 rounded"
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
  guests,
  onGuestChange,
  onReserve,
  formatDate,
  availableRoomCount
}: RoomCardProps) {
  const router = useRouter();
  // Local state for room count (each card has its own)
  const [localRoomCount, setLocalRoomCount] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const nights = checkIn && checkOut ? Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)) : 1;
  const nightsText = nights > 1 ? `${nights} nights` : '1 night';
  
  // Calculate price: room.price * nights * number of rooms (using local room count)
  const basePrice = room.price * nights * localRoomCount;
  const originalPrice = Math.round(basePrice);
  const discountPercent = 10;
  const discountedPrice = Math.round(originalPrice * 0.9);

  // Get cancellation 
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
    if (amenityLower.includes('romm') ) return RoomIcon;
     
    if (amenityLower.includes('bathroom') || amenityLower.includes('bath')) return BathIcon;
    if (amenityLower.includes('pool') && amenityLower.includes('view')) return PoolIcon;
    return WifiIcon;
  };

  const amenities = room.amenities?.map(amenity => ({
    icon: getAmenityIcon(amenity),
    label: amenity
  })) || [];

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

        <div className="relative flex flex-col justify-center bg-[#EBFDED] border-[1.5px] border-[#88B988] p-3 md:p-[14px] w-full lg:w-[376px] min-h-[300px] lg:h-[350px]">
          
          <div className="absolute top-2 right-2 md:top-[8px] md:right-[14px]">
            <span className="text-[11px] md:text-[13px] font-light text-[rgba(0,0,0,0.83)]">Discount</span>
          </div>

          <div className="absolute top-7 right-2 md:top-[35px] md:right-[14px]">
            <div className="bg-[#3F8406] text-white rounded-[4px] text-[10px] md:text-[12px] font-semibold whitespace-nowrap px-2 py-1 md:px-3 md:py-[10px] flex items-center justify-center">
              {discountPercent}% OFF
            </div>
          </div>

          <div className="flex flex-col">
            <p className="text-[12px] md:text-[14px] font-semibold text-[#000000] mb-[10px]">
              Price for {nights} {nights > 1 ? 'nights' : 'night'}, {guests.adults} {guests.adults > 1 ? 'adults' : 'adult'}
              {localRoomCount > 1 && `, ${localRoomCount} rooms`}
            </p>
            <div className="flex items-baseline gap-[5px] mb-[10px] relative">
              <span className="text-[12px] md:text-[14px] text-[#FF0000] line-through font-medium">${originalPrice}</span>
              <span className="text-[18px] md:text-[20px] font-bold text-[#232323]">${discountedPrice}</span>
            </div>
          </div>
          
          <span className="text-[11px] md:text-[12px] font-normal text-[#636468] mb-[10px] mt-[10px]">+ $50 taxes and charge</span>
          
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
            />
            <GuestControl 
              label="Number of Guests"
              value={guests.adults}
              onIncrease={() => onGuestChange('adults', 1)}
              onDecrease={() => onGuestChange('adults', -1)}
              min={1}
            />
            <GuestControl 
              label="Child"
              value={guests.children}
              onIncrease={() => onGuestChange('children', 1)}
              onDecrease={() => onGuestChange('children', -1)}
              min={0}
            />
          </div>
          
          <button 
            onClick={async () => {
              if (availableRoomCount !== undefined && availableRoomCount === 0) {
                alert('No rooms available for the selected dates. Please choose different dates.');
                return;
              }
              await onReserve(room, localRoomCount);
              router.push('/add-ons');
            }}
            disabled={availableRoomCount !== undefined && availableRoomCount === 0}
            className={`w-full font-medium py-2 md:py-[10px] rounded-[7px] transition-colors text-[16px] md:text-[20px] mt-auto ${
              availableRoomCount !== undefined && availableRoomCount === 0
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