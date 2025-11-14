'use client';

import { IconType } from 'react-icons';
import {
  MdAirportShuttle,

} from 'react-icons/md';
import { FaWhatsapp } from 'react-icons/fa';
import { PiAirplaneInFlightBold } from 'react-icons/pi';

type TransportCard = {
  icon: IconType;
  title: string;
  description: string;
  meta?: string;
  details?: string[];
};

const transportCards: TransportCard[] = [
  {
    icon: MdAirportShuttle,
    title: 'Airport Shuttle Service',
    description: 'The hotel offers free airport shuttle ',
    meta: 'Additional charge',
    details: ['(pickup and drop-off)'],
  },
  {
    icon: PiAirplaneInFlightBold,
    title: 'Closest airports',
    description: 'Abeid Amani Karume International Airport (ZNZ) · 33 km',
    details: ['All distances are approximate; actual travel routes may differ.'],
  },

];

const contactOptions = [
  { label: 'Front desk concierge', value: '+255 657 269 674' },
  { label: 'WhatsApp reservations', value: '+255 684 888 111', icon: FaWhatsapp },
  { label: 'Email travel desk', value: 'reservations@sultanpalacehotelznz.com' },
];



export default function TransportSection() {
  return (
    <div className="px-4 md:px-[114px] py-6 md:py-[117px]">
      <div className="space-y-[40px]">
     
          <h2 className="text-[28px] font-semibold text-[#2B2B2B]">Transport & Travel Assistance</h2>
          <p className="text-[15px] text-[#4B4B4B] leading-relaxed">
            Seamless journeys from runway to resort. Choose the transfer that suits you best
            or let our concierge coordinate every leg of your trip.
          </p>
    

        <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 gap-2 sm:gap-[20px]">
          {transportCards.map(({ icon: Icon, title, description, meta, details }) => (
            <article
              key={title}
              className="rounded-[16px] border border-[#E1E8FF] bg-white px-3 py-4 sm:px-6 sm:py-7 shadow-[0px_14px_32px_rgba(17,60,170,0.08)] flex flex-col gap-2 sm:gap-4"
            >
              <div className="flex items-start gap-2 sm:gap-3">
                <span className="w-8 h-8 sm:w-11 sm:h-11 rounded-full bg-[#FFE7D7] flex items-center justify-center flex-shrink-0">
                  <Icon className="text-[#FF6A00] text-[16px] sm:text-[22px]" />
                </span>
                <div className="min-w-0">
                  <h3 className="text-[13px] sm:text-[17px] font-semibold text-[#222] leading-tight">{title}</h3>
                  {meta && (
                    <span className="inline-block mt-1 text-[9px] sm:text-[11px] font-medium text-[#FF6A00] bg-[#FFE7D7] px-1.5 sm:px-2 py-[2px] rounded-full">
                      {meta}
                    </span>
                  )}
                </div>
              </div>
              <p className="text-[11px] sm:text-[14px] text-[#4F4F4F] leading-relaxed">{description}</p>
              {details && (
                <ul className="space-y-1 text-[11px] sm:text-[13px] text-[#3C3C3C]">
                  {details.map((detail) => (
                    <li key={detail} className="leading-snug">• {detail}</li>
                  ))}
                </ul>
              )}
            </article>
          ))}
        </div>

        <section >
      

          <aside className="rounded-[18px] border border-[#E8E8E8] bg-[#F9FBFF] px-7 py-8 shadow-[0px_12px_28px_rgba(16,65,170,0.07)] space-y-5">
            <h3 className="text-[20px] font-semibold text-[#1E1E1E]">Need assistance?</h3>
            <p className="text-[14px] text-[#505050] leading-relaxed">
              Our travel desk is available daily from 07:00 – 23:00 to manage transfers,
              sightseeing, and transport upgrades.
            </p>
            <ul className="space-y-3 text-[14px] text-[#2F2F2F]">
              {contactOptions.map(({ label, value, icon: Icon }) => (
                <li key={label} className="flex items-center gap-3">
                  {Icon && (
                    <span className="w-8 h-8 rounded-full bg-white border border-[#FFE7D7] flex items-center justify-center text-[#FF6A00]">
                      <Icon className="text-[16px] text-[#FF6A00] bg-transparent " />
                    </span>
                  )}
                  <div>
                    <p className="font-medium">{label}</p>
                    <p className="text-[13px] text-[#5A5A5A]">{value}</p>
                  </div>
                </li>
              ))}
            </ul>
          </aside>
        </section>
      </div>
    </div>
  );
}


