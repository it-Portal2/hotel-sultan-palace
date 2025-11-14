import { IconType } from 'react-icons';
import {
  MdRestaurant,
  
  MdAirportShuttle,
  
  MdRoomService,
  MdPool,
  MdSpa,
  MdFreeBreakfast,
  MdOutlineHotel,
  MdOutlineBathroom,
  MdWeekend,
  MdRestaurantMenu,
  MdWifi,
  MdOutlineLocalParking,
  MdOutlineRoomService,
  MdOutlineCelebration,
  MdLocalLaundryService,
  MdSecurity,
  MdOutlineKingBed,
  MdOutlineCameraAlt,
  MdOutlinePark,
  MdKitchen,
  MdOutlineBedroomChild,
  MdInfo,
  MdOutlineTranslate,
  MdOutlinePool,
  MdLocalBar,
} from 'react-icons/md';
import { FaWifi, FaParking, FaUmbrellaBeach } from 'react-icons/fa';
import { GiCoffeeCup } from 'react-icons/gi';

export type PopularFacility = { icon: IconType; label: string; special?: 'link' };

export const popularFacilities: PopularFacility[] = [
  { icon: MdPool, label: 'Outdoor swimming pool' },
  { icon: MdAirportShuttle, label: 'Airport shuttle' },
  { icon: MdRestaurant, label: '2 restaurants' },
  { icon: MdRoomService, label: 'Room service' },
  { icon: FaWifi, label: 'Free WiFi' },
  { icon: FaParking, label: 'Free parking' },
  { icon: GiCoffeeCup, label: 'Tea/coffee maker in all rooms' },
  { icon: MdLocalBar, label: 'Bar' },
  { icon: FaUmbrellaBeach, label: 'Private beach area' },
  { icon: MdFreeBreakfast, label: 'Fabulous breakfast' },
];

export const greatStayItems = [
  'Balcony',
  'Private bathroom',
  '2 restaurants',
  'Parking',
  'Air conditioning',
  'View',
  'Bath',
  'Free WiFi',
  'Room service',
  'Family rooms',
];

export const bathroomItems = [
  'Toilet paper',
  'Bath or shower',
  'Slippers',
  'Private bathroom',
  'Toilet',
  'Free toiletries',
  'Bathrobe',
  'Hairdryer',
  'Bath',
  'Shower',
];

export const activityItems = [
  { label: 'Themed dinner nights', tags: ['Additional charge'] },
  { label: 'Walking tours', tags: ['Additional charge'] },
  { label: 'Beach' },
  { label: 'Badminton equipment' },
  { label: 'Entertainment staff' },
  { label: 'Snorkelling', tags: ['Additional charge', 'Off-site'] },
  { label: 'Diving', tags: ['Additional charge', 'Off-site'] },
  { label: 'Darts' },
  { label: 'Games room' },
  { label: 'Fishing', tags: ['Additional charge', 'Off-site'] },
];

export const foodItems = [
  { label: 'Coffee house on site' },
  { label: 'Wine/champagne', tags: ['Additional charge'] },
  { label: 'Kid-friendly buffet' },
  { label: 'Kid meals' },
  { label: 'Special diet menus (on request)' },
  { label: 'Bar' },
  { label: 'Restaurant' },
  { label: 'Tea/Coffee maker' },
];

export const wellnessItems = [
  'Full body massage',
  'Hand massage',
  'Head massage',
  'Couples massage',
  'Foot massage',
  'Neck massage',
  'Back massage',
  'Spa facilities',
  'Body scrub',
  'Body treatments',
  'Hair styling',
  'Hair colouring',
  'Hair cut',
  'Pedicure',
  'Manicure',
  'Hair treatments',
  'Make up services',
  'Waxing services',
  'Facial treatments',
  'Beauty Services',
  'Sun umbrellas',
  'Sun loungers or beach chairs',
  'Public Bath',
  { label: 'Massage', tags: ['Additional charge'] },
];

export const languages = ['English', 'Hindi', 'Swahili'];

export const receptionItems = [
  'Invoice provided',
  'Concierge service',
  { label: 'Luggage storage', tags: ['Additional charge'] },
  'Tour desk',
  'Express check-in/check-out',
  '24-hour front desk',
];

export const entertainmentItems = [
  "Kids' outdoor play equipment",
  'Indoor play area',
  'Board games/puzzles',
];

export const cleaningItems = [
  'Daily housekeeping',
  { label: 'Ironing service', tags: ['Additional charge'] },
  { label: 'Dry cleaning', tags: ['Additional charge'] },
  { label: 'Laundry', tags: ['Additional charge'] },
];

export const safetyItems = [
  'Fire extinguishers',
  'CCTV outside property',
  'CCTV in common areas',
  'Key access',
  '24-hour security',
  'Safety deposit box',
];

export const bedroomItems = ['Wardrobe or closet', 'Dressing room'];

export const viewItems = ['View'];

export const outdoorItems = [
  'Outdoor furniture',
  'Beachfront',
  'Private beach area',
  'Balcony',
  'Terrace',
  'Garden',
];

export const kitchenItems = [
  'Cleaning products',
  'Electric kettle',
];

export const roomAmenitiesItems = [
  'Socket near the bed',
  'Clothes rack',
];

export const generalItems = [
  { label: 'Shuttle service', tags: ['Additional charge'] },
  'Shared lounge/TV area',
  'Designated smoking area',
  'Air conditioning',
  'Non-smoking throughout',
  'Mosquito net',
  'Hardwood or parquet floors',
  'Private entrance',
  'Car hire',
  'Packed lunches',
  'Soundproof rooms',
  'Family rooms',
  { label: 'Airport shuttle', tags: ['Additional charge'] },
  'Non-smoking rooms',
  'Room service',
];

export const outdoorPoolItems = [
  { label: 'Free!' },
  { label: 'Open all year' },
  'All ages welcome',
  'Infinity pool',
  'Pool with view',
  'Pool/beach towels',
  'Pool bar',
  'Pool cover',
  'Sun umbrellas',
];

import { IconType as _IconType } from 'react-icons';

export type FacilityItem = string | { label: string; tags?: string[] };
export type FacilitySection = { title: string; icon: IconType; items: FacilityItem[] };

export const leftSections: FacilitySection[] = [
  { title: 'Great for your stay', icon: MdOutlineHotel, items: greatStayItems },
  { title: 'Bathroom', icon: MdOutlineBathroom, items: bathroomItems },
  { title: 'Room Amenities', icon: MdOutlineBedroomChild, items: roomAmenitiesItems },
  { title: 'Activities', icon: MdOutlinePool, items: activityItems },
  { title: 'Living Area', icon: MdWeekend, items: ['Seating Area'] },
  { title: 'Food & Drink', icon: MdRestaurantMenu, items: foodItems },
  { title: 'Internet', icon: MdWifi, items: [{ label: 'WiFi is available in all areas and is free of charge.' }] },
  { title: 'Parking', icon: MdOutlineLocalParking, items: [{ label: 'Free private parking is possible on site (reservation is not needed).' }] },
];

export const rightSections: FacilitySection[] = [
  { title: 'Reception services', icon: MdOutlineRoomService, items: receptionItems },
  { title: 'Entertainment and family services', icon: MdOutlineCelebration, items: entertainmentItems },
  { title: 'Cleaning services', icon: MdLocalLaundryService, items: cleaningItems },
  { title: 'Safety & security', icon: MdSecurity, items: safetyItems },
  { title: 'Bedroom', icon: MdOutlineKingBed, items: bedroomItems },
  { title: 'View', icon: MdOutlineCameraAlt, items: viewItems },
  { title: 'Outdoors', icon: MdOutlinePark, items: outdoorItems },
  { title: 'Kitchen', icon: MdKitchen, items: kitchenItems },
  { title: 'General', icon: MdInfo, items: generalItems },
  { title: 'Outdoor swimming pool', icon: MdOutlinePool, items: outdoorPoolItems },
  {
    title: 'Wellness',
    icon: MdSpa,
    items: wellnessItems.map((item) => (typeof item === 'string' ? { label: item } : item)),
  },
  { title: 'Languages spoken', icon: MdOutlineTranslate, items: languages.map((lang) => ({ label: lang })) },
];

