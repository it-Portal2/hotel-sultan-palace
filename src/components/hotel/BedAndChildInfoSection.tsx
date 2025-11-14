'use client';

import React from 'react';

const BedAndChildInfoSection = () => {
    return (
        <div className="px-4 md:px-[114px] py-6 md:py-[117px] space-y-[40px]">
            <h2 className="text-[28px] font-semibold text-[#2B2B2B]">Bed and Child Information</h2>
            <p className="text-[15px] text-[#4B4B4B] leading-relaxed max-w-[780px]">
                Please review our policies regarding children and bed arrangements to ensure a comfortable stay.
            </p>

            <div className="space-y-[32px]">
                <div>
                    <h3 className="text-[22px] font-semibold text-[#3F3F3F] mb-[15px]">Child Policy</h3>
                    <ul className="space-y-3 text-[16px] text-[#3F3F3F] leading-relaxed list-disc list-inside">
                        <li>All children are welcome at the property.</li>
                        <li>Guests aged 18 years or older will be counted as adults.</li>
                        <li>For accurate pricing and room capacity, please mention the number of children and their ages while making your booking.</li>
                    </ul>
                </div>

                <div>
                    <h3 className="text-[22px] font-semibold text-[#3F3F3F] mb-[15px]">Cots & Extra Beds</h3>
                    <ul className="space-y-3 text-[16px] text-[#3F3F3F] leading-relaxed list-disc list-inside">
                        <li>The property does not provide extra beds or baby cots.</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default BedAndChildInfoSection;