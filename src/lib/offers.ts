import { SpecialOffer } from './firestoreService';

export type DiscountType = 'percentage' | 'fixed';

export interface OfferEvaluationContext {
  roomName?: string;
  guestCount?: number;
  now?: Date;
  checkIn?: Date | null;
  checkOut?: Date | null;
}

export interface AppliedOfferInfo {
  id: string;
  title: string;
  description: string;
  discountType: DiscountType;
  discountValue: number;
  couponCode: string | null;
  couponMode: 'none' | 'static' | 'unique_per_user';
  startDate: string | null;
  endDate: string | null;
}

const parseDate = (value?: string | null): Date | null => {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
};

export const isSpecialOfferValid = (
  offer: SpecialOffer,
  context: OfferEvaluationContext = {}
): boolean => {
  if (!offer?.isActive) return false;

  const now = context.now || new Date();
  const start = parseDate(offer.startDate);
  const end = parseDate(offer.endDate);

  if (start && now < start) return false;
  if (end) {
    const endOfDay = new Date(end);
    endOfDay.setHours(23, 59, 59, 999);
    if (now > endOfDay) return false;
  }

  if (!offer.applyToAllPersons) {
    const guests = context.guestCount ?? 0;
    if (offer.minPersons && guests < offer.minPersons) return false;
    if (offer.maxPersons && guests > offer.maxPersons) return false;
  }

  if (offer.targetAudience === 'specific_rooms' && offer.roomTypes?.length) {
    if (context.roomName) {
      const roomName = context.roomName.toLowerCase();
      const matches = offer.roomTypes.some((type) =>
        roomName.includes(type.toLowerCase())
      );
      if (!matches) return false;
    }
    // If context.roomName is not provided, we skip the room check.
    // This allows the offer to be considered "valid" for the cart overall,
    // (e.g., dates are valid), and specific room exclusions will be handled
    // by the calculation logic (getDiscountAmount).
  }

  return true;
};

export const calculateDiscountAmount = (
  baseAmount: number,
  offer: Pick<SpecialOffer, 'discountType' | 'discountValue'>
): number => {
  if (offer.discountType === 'fixed') {
    return Math.min(baseAmount, offer.discountValue);
  }
  return (baseAmount * offer.discountValue) / 100;
};

export const buildAppliedOfferInfo = (
  offer: SpecialOffer
): AppliedOfferInfo => ({
  id: offer.id,
  title: offer.title,
  description: offer.description,
  discountType: offer.discountType,
  discountValue: offer.discountValue,
  couponCode: offer.couponCode || null,
  couponMode: offer.couponMode,
  startDate: offer.startDate || null,
  endDate: offer.endDate || null,
});

export const formatOfferValidity = (offer: SpecialOffer): string | null => {
  const start = parseDate(offer.startDate);
  const end = parseDate(offer.endDate);
  if (!start && !end) return null;

  if (start && end) {
    return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
  }
  if (start) {
    return `From ${start.toLocaleDateString()}`;
  }
  return `Until ${end!.toLocaleDateString()}`;
};

