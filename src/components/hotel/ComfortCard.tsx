'use client';

import React from 'react';
import { IoIosArrowForward as ArrowIcon } from 'react-icons/io';
import { IconType } from 'react-icons';

interface ComfortCardProps {
  icon: IconType;
  category: string;
  title: string;
}

export default function ComfortCard({ icon: Icon, category, title }: ComfortCardProps) {
  return (
    <div className="relative bg-white border border-[rgba(146,146,146,0.19)] rounded-[12px] p-[14px] h-full shadow-[0px_6px_16px_rgba(32,32,32,0.05)]">
      <div className="flex items-start gap-[8px]">
        <span className="w-[40px] h-[40px] rounded-full bg-[#FFF3E6] flex items-center justify-center">
          <Icon className="text-[#6D6D6D] text-[20px]" aria-hidden="true" />
        </span>
        <div className="flex flex-col gap-[4px]">
          <span className="text-[16px] font-semibold text-[#2F2F2F] leading-[1.1]">{category}</span>
          <span className="text-[12px] text-[#6D6D6D] leading-[1.125]">{title}</span>
        </div>
      </div>
      <ArrowIcon className="absolute right-[14px] bottom-[14px] text-[#8F8F8F] text-[18px]" aria-hidden="true" />
    </div>
  );
}

