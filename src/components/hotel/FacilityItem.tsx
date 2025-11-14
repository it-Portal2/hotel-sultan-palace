'use client';

import React from 'react';
import Image from 'next/image';

interface FacilityItemProps {
  icon: string;
  label: string;
  onClick?: () => void;
}

export default function FacilityItem({ icon, label, onClick }: FacilityItemProps) {
  return (
    <div 
      className={`flex items-center gap-[6px] ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <Image 
        src={icon} 
        alt={label} 
        width={15} 
        height={15} 
        className="object-contain"
      />
      <span className="text-[14px] text-[#323232]">{label}</span>
    </div>
  );
}

