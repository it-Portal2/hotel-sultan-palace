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
            <InformationCircleIcon className="h-6 w-6 text-gray-400 hover:text-gray-600 cursor-help transition-colors" />

            <div className="absolute right-0 top-full mt-2 w-[400px] bg-white border border-gray-200 shadow-xl rounded-lg p-5 z-50 hidden group-hover:block transition-all duration-200 ease-out transform origin-top-right">
                <h4 className="text-sm font-bold text-gray-800 mb-4 border-b border-gray-100 pb-2">Legend</h4>

                <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                    {/* Booking Status */}
                    <div className="space-y-3">
                        <h5 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Booking Status</h5>

                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 bg-[#FA8072] rounded-sm"></span>
                                <span className="text-xs text-gray-600">Arrived</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 bg-[#EAB676] rounded-sm"></span>
                                <span className="text-xs text-gray-600">Stayover</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 bg-[#8B0000] rounded-sm"></span>
                                <span className="text-xs text-gray-600">Due Out</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 bg-[#0000FF] rounded-sm"></span>
                                <span className="text-xs text-gray-600">Checked Out</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 bg-[#008000] rounded-sm"></span>
                                <span className="text-xs text-gray-600">Confirmed Reservation</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 bg-[#32CD32] rounded-sm"></span>
                                <span className="text-xs text-gray-600">Dayuse Reservation</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 bg-[#8B4513] rounded-sm"></span>
                                <span className="text-xs text-gray-600">Dayuse</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 bg-[#1A1A1A] rounded-sm"></span>
                                <span className="text-xs text-gray-600">Maintenance Block</span>
                            </div>
                        </div>
                    </div>

                    {/* Booking Indicators */}
                    <div className="space-y-3">
                        <h5 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Booking Indicators</h5>

                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <FaCrown className="w-3 h-3 text-yellow-600" />
                                <span className="text-xs text-gray-600">Group Owner</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <FaDollarSign className="w-3 h-3 text-red-500" />
                                <span className="text-xs text-gray-600">Payment Pending</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <FaFemale className="w-3 h-3 text-pink-500" />
                                <span className="text-xs text-gray-600">Single Lady</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <FaCodeBranch className="w-3 h-3 text-blue-500" />
                                <span className="text-xs text-gray-600">Split Reservation</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <FaUsers className="w-3 h-3 text-indigo-500" />
                                <span className="text-xs text-gray-600">Group Booking</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <FaHandPaper className="w-3 h-3 text-orange-500" />
                                <span className="text-xs text-gray-600">Stop Room Move</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <FaStar className="w-3 h-3 text-yellow-500" />
                                <span className="text-xs text-gray-600">VIP Guest</span>
                            </div>
                        </div>
                    </div>

                    {/* Room Indicators */}
                    <div className="col-span-2 space-y-3 pt-2 border-t border-gray-100">
                        <h5 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Room Indicators</h5>

                        <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                            <div className="flex items-center gap-2">
                                <FaSmokingBan className="w-3 h-3 text-red-500" />
                                <span className="text-xs text-gray-600">No Smoking</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <FaSmoking className="w-3 h-3 text-gray-600" />
                                <span className="text-xs text-gray-600">Smoking</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <FaBroom className="w-3 h-3 text-orange-500" />
                                <span className="text-xs text-gray-600">Dirty</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <FaSprayCan className="w-3 h-3 text-green-500" />
                                <span className="text-xs text-gray-600">Clean</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <FaLink className="w-3 h-3 text-blue-500" />
                                <span className="text-xs text-gray-600">Connected Rooms</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <FaClipboardCheck className="w-3 h-3 text-gray-600" />
                                <span className="text-xs text-gray-600">Work Order</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 bg-blue-200 border border-blue-300"></span>
                                <span className="text-xs text-gray-600">Unassigned Room</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 bg-red-200 border border-red-300"></span>
                                <span className="text-xs text-gray-600">Unconfirmed Bookings</span>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default LegendPopover;
