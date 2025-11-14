'use client';

import React from 'react';
import { IconType } from 'react-icons';
import { MdOutlineDirectionsBike, MdOutlineFitnessCenter, MdOutlineTheaterComedy, MdMusicNote, MdOutlineLocalLibrary, MdOutlineDinnerDining, MdOutlineExplore, MdBeachAccess,  MdOutlineSportsTennis, MdOutlineLocalBar, MdOutlineCasino } from 'react-icons/md';

type ActivityItem = {
    icon: IconType;
    name: string;
    charge?: boolean; 
};

const activitiesData: ActivityItem[] = [
    { icon: MdOutlineDirectionsBike, name: "Bicycle rental" },
    { icon: MdOutlineFitnessCenter, name: "Aerobics" },
    { icon: MdOutlineTheaterComedy, name: "Live sport events (broadcast)" },
    { icon: MdMusicNote, name: "Live music/performance" },
    { icon: MdOutlineLocalLibrary, name: "Tour or class about local culture" },
    { icon: MdOutlineDinnerDining, name: "Themed dinner nights" },
    { icon: MdOutlineExplore, name: "Walking tours", charge: true },
    { icon: MdBeachAccess, name: "Beach" },
    { icon: MdOutlineSportsTennis, name: "Badminton equipment" },
    { icon: MdOutlineTheaterComedy, name: "Entertainment staff" },
    { icon: MdOutlineCasino, name: "Darts" },
    { icon: MdOutlineLocalBar, name: "Games room" },
];

const ActivitiesSection = () => {
  return (
    <div className="px-4 md:px-[114px] py-6 md:py-[117px] space-y-[40px]">
        <h2 className="text-[28px] font-semibold text-[#2B2B2B]">On-Site & Local Activities</h2>
        <p className="text-[15px] text-[#4B4B4B] leading-relaxed max-w-[780px]">
            Whether you seek relaxation on the beach or thrilling water sports, we offer a diverse range of activities for all ages.
        </p>

        <section className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-x-[24px] gap-y-[12px] sm:gap-y-[20px] pt-4">
            {activitiesData.map(({ icon: Icon, name, charge }) => (
                <div 
                    key={name}
                    className="flex items-center gap-2 sm:gap-3 p-2 sm:p-4 rounded-lg bg-white shadow-sm border border-gray-100 transition-shadow hover:shadow-md"
                >
                    <Icon className={`text-[18px] sm:text-[24px] flex-shrink-0 ${charge ? 'text-[#FF6A00]' : 'text-[#FF6A00]'}`} />
                    <span className="text-[12px] sm:text-[15px] text-[#222] font-medium flex-1 min-w-0">
                        {name}
                    </span>
                    {charge && (
                        <span className="text-[9px] sm:text-[11px] text-[#FF6A00] bg-[#FFE7D7] px-1.5 sm:px-2 py-0.5 rounded-full font-semibold whitespace-nowrap flex-shrink-0">
                            Extra Charge
                        </span>
                    )}
                </div>
            ))}
        </section>
    </div>
  );
};

export default ActivitiesSection;