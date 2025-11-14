'use client';

import React from 'react';

const LegalInfoSection = () => {
    return (
        <div className="px-4 md:px-[114px] py-6 md:py-[117px] space-y-[40px]">
            <h2 className="text-[28px] font-semibold text-[#2B2B2B]">Legal Information & Check-in Requirements</h2>
            <p className="text-[15px] text-[#4B4B4B] leading-relaxed max-w-[780px]">
                Please review these important legal details and requirements concerning your booking and arrival at Sultan Palace.
            </p>

            <div className="space-y-[32px]">
                <div>
                    <h3 className="text-[22px] font-semibold text-[#3F3F3F] mb-[15px]">Legal info</h3>
                    <ul className="space-y-3 text-[16px] text-[#3F3F3F] leading-relaxed list-disc list-inside">
                        <li>Please inform Sultan Palace in advance about your expected arrival time.</li>
                        <li>You can share this information in the Special Requests box during booking or by contacting the property directly using the details in your confirmation.</li>
                        <li>All guests must present a valid <span className="font-bold">photo ID</span> and <span className="font-bold">credit card</span> at the time of check-in.</li>
                        <li>Special Requests are handled based on availability and may incur additional charges.</li>
                        <li>Guests under <span className="font-bold">18 years</span> of age can only check in when accompanied by a <span className="font-bold">parent or legal guardian</span>.</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default LegalInfoSection;