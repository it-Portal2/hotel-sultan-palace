import React from 'react';
import { InformationCircleIcon } from '@heroicons/react/24/outline';
import {
    FaBed,
    FaBroom,
    FaClipboardCheck,
    FaCodeBranch,
    FaCrown,
    FaDollarSign,
    FaFemale,
    FaHandPaper,
    FaLink,
    FaSmoking,
    FaSmokingBan,
    FaSprayCan,
    FaStar,
    FaUsers
} from 'react-icons/fa';

const LegendPopover = () => {
    return (
        <div className="relative group z-50">
            <InformationCircleIcon className="h-6 w-6 text-gray-500 hover:text-gray-700 cursor-help transition-colors" />

            <div className="absolute right-0 top-full mt-2 w-[550px] bg-white border border-gray-300 shadow-2xl rounded-sm p-4 z-50 hidden group-hover:block transition-all duration-200 ease-out transform origin-top-right">
                <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                    {/* Booking Status */}
                    <div className="space-y-2">
                        <h5 className="text-sm font-bold text-gray-800 mb-2">Booking Status</h5>
                        <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 bg-[#22c55e] rounded-sm"></span> {/* Confirmed - Green */}
                                <span className="text-xs text-gray-700">Confirmed</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 bg-[#dc2626] rounded-sm"></span> {/* Checked In - Red */}
                                <span className="text-xs text-gray-700">Checked In</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 bg-[#2563eb] rounded-sm"></span> {/* Checked Out - Blue */}
                                <span className="text-xs text-gray-700">Checked Out</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 bg-[#1A1A40] rounded-sm"></span> {/* Maintenance - Dark */}
                                <span className="text-xs text-gray-700">Maintenance</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 bg-[#7c3aed] rounded-sm"></span> {/* Stay Over - Purple */}
                                <span className="text-xs text-gray-700">Stay Over</span>
                            </div>
                        </div>
                    </div>

                    {/* Booking Indicators */}
                    <div className="space-y-2">
                        <h5 className="text-sm font-bold text-gray-800 mb-2">Booking Indicators</h5>
                        <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded-full bg-red-100 flex items-center justify-center text-[10px] text-red-700 font-bold border border-red-200">
                                    <FaDollarSign className="w-2.5 h-2.5" />
                                </div>
                                <span className="text-xs text-gray-700">Payment Pending</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center text-[10px] text-green-700 font-bold border border-green-200">
                                    <FaDollarSign className="w-2.5 h-2.5" />
                                </div>
                                <span className="text-xs text-gray-700">Fully Paid</span>
                            </div>
                        </div>
                    </div>

                    {/* Room Indicators */}
                    <div className="col-span-2 space-y-2 pt-4 border-t border-gray-200">
                        <h5 className="text-sm font-bold text-gray-800 mb-2">Room Indicators</h5>
                        <div className="grid grid-cols-2 gap-y-2 gap-x-8">
                            <div className="flex items-center gap-2">
                                <FaSmokingBan className="w-3 h-3 text-gray-600" />
                                <span className="text-xs text-gray-700">No Smoking</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <FaBroom className="w-3 h-3 text-gray-600" />
                                <span className="text-xs text-gray-700">Dirty / Cleanup</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <FaBed className="w-3 h-3 text-gray-600" />
                                <span className="text-xs text-gray-700">Clean</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LegendPopover;
