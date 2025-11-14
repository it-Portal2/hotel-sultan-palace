'use client';

import React from 'react';
import { MdCheckCircleOutline, MdRestaurant, MdLocationOn, MdLocalBar, MdFreeBreakfast, MdOutlineWc } from 'react-icons/md';
import { IconType } from 'react-icons';
import { FaCheck } from 'react-icons/fa';

type FoodCard = {
    icon: IconType;
    title: string;
    items: string[];
    description?: string;
};

const facilitiesData: FoodCard[] = [
    {
        icon: MdFreeBreakfast,
        title: 'Dining Hours',
        items: [
            'Breakfast served: 07:30 to 10:00',
            'Lunch, Dinner, and Cocktail hour available.',
        ],
        description: "Enjoy our daily breakfast service and other meal options.",
    },
    {
        icon: MdRestaurant,
        title: 'On-site Restaurants',
        items: [
            'Restaurant 1: International cuisine (Open for Breakfast, Lunch, Dinner).',
            'Restaurant 2: International cuisine (Menu: À la carte).',
        ],
        description: "Two distinct dining experiences offering diverse cuisines.",
    },
    {
        icon: MdCheckCircleOutline,
        title: 'Special Services & Amenities',
        items: [
            'Packed lunches, Wine/champagne.',
            'Kid meals, Kid-friendly buffet.',
            'Special diet menus (on request).',
        ],
        description: "We cater to all dietary needs and offer flexible services.",
    },
    {
        icon: MdLocalBar,
        title: 'Bars & Coffee',
        items: [
            'Bar access for guests.',
            'Coffee house on site.',
        ],
        description: "Relax with a drink or enjoy freshly brewed coffee.",
    },
    {
        icon: MdOutlineWc, 
        title: 'In-Room Facilities',
        items: [
            'Tea/Coffee maker',
            'Electric kettle',
        ],
        description: "Convenient facilities available right in your room.",
    },
];

const nearbyLocations = [
    { type: 'Restaurants', data: [
      { name: "Door Restaurant", distance: "450 m" },
      { name: "Blue Dongwe Jetty", distance: "1.6 km" },
      { name: "The Rock Restaurant Zanzibar", distance: "3 km" },
    ]},
    { type: 'Cafes & bars', data: [
      { name: "The Sands Beach Resort", distance: "900 m" },
      { name: "Zanzibar Pastry & Coffee", distance: "34 km" },
    ]},
    { type: 'Supermarkets', data: [
      { name: "Supermarket (Paje)", distance: "10 km" },
      { name: "Mwanakwerekwemwe Market", distance: "33 km" },
    ]},
];

const FoodAndDrinkSection = () => {
    
  return (
    <div className="px-4 md:px-[114px] py-6 md:py-[117px] space-y-[40px]">
    
        <h2 className="text-[28px] font-semibold text-[#2B2B2B]">Food & Beverage Experience</h2>
        <p className="text-[15px] text-[#4B4B4B] leading-relaxed max-w-[780px]">
            Explore our on-site dining options and enjoy a variety of cuisines and services, 
            along with nearby local favorites for an unforgettable culinary journey.
        </p>

        <section className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 gap-2 sm:gap-[20px]">
            {facilitiesData.map(({ icon: Icon, title, items, description }) => (
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
                    <p className="text-[11px] sm:text-[13px] text-[#3F3F3F] leading-relaxed italic">{description}</p>
                    <ul className="space-y-1 text-[11px] sm:text-[13px] text-[#3F3F3F] leading-relaxed pt-2 border-t border-gray-100">
                        {items.map((item) => (
                            <li key={item} className='flex items-start gap-1'>
                                <FaCheck className="text-green-500 text-[8px] sm:text-[10px] mt-[4px] flex-shrink-0" />
                                {item}
                            </li>
                        ))}
                    </ul>
                </article>
            ))}
        </section>

        <section className="pt-10">
            <h3 className="text-[24px] font-semibold text-[#3F3F3F] mb-[24px] border-b border-gray-200 pb-2">Nearby Dining & Shopping</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
                {nearbyLocations.map((category) => (
                    <div key={category.type}>
                        <h4 className="text-[18px] font-bold text-[#3F3F3F] mb-4 mt-2">{category.type}</h4>
                        <div className="space-y-2">
                            {category.data.map((item, i) => (
                                <div key={i} className="flex justify-between items-center text-gray-700 border-b border-gray-100 pb-2 text-[15px]">
                                    <span className="flex items-center gap-2">
                                        <MdLocationOn className="text-gray-400 text-lg"/>
                                        {item.name}
                                    </span>
                                    <span className="font-medium text-gray-500 text-[14px]">{item.distance}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </section>

    </div>
  );
};

export default FoodAndDrinkSection;