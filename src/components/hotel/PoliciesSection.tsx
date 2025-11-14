'use client';

import { IconType } from 'react-icons';
import {
  MdOutlineAccessTime,
  MdOutlinePets,
  MdOutlineCreditCard,
  MdWifi,
  MdDirectionsCarFilled,
  MdOutlineWc,
} from 'react-icons/md';
import { FaUserAlt } from 'react-icons/fa';

type PolicyCard = {
  icon: IconType;
  title: string;
  items: string[];
};

const stayPolicies: PolicyCard[] = [
  {
    icon: MdOutlineAccessTime,
    title: 'Check-in / Check-out',
    items: [
      'Check in: 15:00',
      'Check out: 11:00 until 12:00',
    ],
  },
  {
    icon: MdWifi,
    title: 'Internet',
    items: [
      'WiFi is available in all areas and is free of charge.',
    ],
  },
  {
    icon: FaUserAlt, 
    title: 'Age restriction',
    items: [
      'The minimum age for check-in is 18',
    ],
  },
  {
    icon: MdDirectionsCarFilled,
    title: 'Parking',
    items: [
      'Free private parking is possible on site (reservation is not needed).',
    ],
  },
  {
    icon: MdOutlinePets,
    title: 'Pets',
    items: [
      'Pets are not allowed.',
    ],
  },
  {
    icon: MdOutlineWc, 
    title: 'No curfew',
    items: [
      'Come and go anytime you want.',
    ],
  },
  {
    icon: MdOutlineCreditCard,
    title: 'Accepted payment methods',
    items: [
      'Mastercard, Visa, Cash',
    ],
  },
];

export default function PoliciesSection() {
  return (
    <div className="px-4 md:px-[114px] py-6 md:py-[117px] space-y-[40px]">
    
        <h2 className="text-[28px] font-semibold text-[#2B2B2B]">Stay Policies</h2>
        <p className="text-[15px] text-[#4B4B4B] leading-relaxed max-w-[780px]">
          We keep our guidelines transparent so you can plan every detail of your stay with confidence.
          Should you need any clarification, our guest relations team is ready to help.
        </p>
      

      <section className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 gap-2 sm:gap-[20px]">
        {stayPolicies.map(({ icon: Icon, title, items }) => (
          <article
            key={title}
            className="rounded-[16px] border border-[#EBF0FF] bg-white px-3 py-4 sm:px-7 sm:py-8 shadow-[0px_12px_30px_rgba(19,63,172,0.08)] space-y-2 sm:space-y-3"
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="w-8 h-8 sm:w-11 sm:h-11 rounded-full bg-[#FFE7D7] flex items-center justify-center flex-shrink-0">
                <Icon className="text-[#FF6A00] text-[16px] sm:text-[22px]" />
              </span>
              <h3 className="text-[13px] sm:text-[17px] font-semibold text-[#222] leading-tight">{title}</h3>
            </div>
            <ul className="space-y-1 sm:space-y-2 text-[11px] sm:text-[13px] text-[#3F3F3F] leading-relaxed">
              {items.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </article>
        ))}
      </section>

    </div>
  );
}