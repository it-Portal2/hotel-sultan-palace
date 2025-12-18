import React from 'react';

interface OccupancyChartsProps {
    arrivals: { pending: number; arrived: number };
    departures: { pending: number; checkedOut: number };
    guestsInHouse: { adults: number; children: number };
}

export default function OccupancyCharts({ arrivals, departures, guestsInHouse }: OccupancyChartsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {/* Arrival */}
            <div className="bg-white p-6 shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Arrivals</h3>
                <div className="flex items-center">
                    <div className="relative w-20 h-20 mr-6 flex-shrink-0">
                        <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                            <path className="text-blue-100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                            <path className="text-blue-500" strokeDasharray={`${(arrivals.arrived / (arrivals.pending + arrivals.arrived || 1)) * 100}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center text-xl font-bold text-gray-700">
                            {arrivals.pending + arrivals.arrived}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between min-w-[100px]">
                            <div className="flex items-center">
                                <span className="w-2.5 h-2.5 rounded-full bg-blue-100 mr-2"></span>
                                <span className="text-sm text-gray-600">Pending</span>
                            </div>
                            <span className="text-sm font-semibold pl-4">{arrivals.pending}</span>
                        </div>
                        <div className="flex items-center justify-between min-w-[100px]">
                            <div className="flex items-center">
                                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 mr-2"></span>
                                <span className="text-sm text-gray-600">Arrived</span>
                            </div>
                            <span className="text-sm font-semibold pl-4">{arrivals.arrived}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Departure */}
            <div className="bg-white p-6 shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Departures</h3>
                <div className="flex items-center">
                    <div className="relative w-20 h-20 mr-6 flex-shrink-0">
                        <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                            <path className="text-orange-100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                            <path className="text-orange-500" strokeDasharray={`${(departures.checkedOut / (departures.pending + departures.checkedOut || 1)) * 100}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center text-xl font-bold text-gray-700">
                            {departures.pending + departures.checkedOut}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between min-w-[100px]">
                            <div className="flex items-center">
                                <span className="w-2.5 h-2.5 rounded-full bg-orange-100 mr-2"></span>
                                <span className="text-sm text-gray-600">Pending</span>
                            </div>
                            <span className="text-sm font-semibold pl-4">{departures.pending}</span>
                        </div>
                        <div className="flex items-center justify-between min-w-[100px]">
                            <div className="flex items-center">
                                <span className="w-2.5 h-2.5 rounded-full bg-orange-500 mr-2"></span>
                                <span className="text-sm text-gray-600">Checked Out</span>
                            </div>
                            <span className="text-sm font-semibold pl-4">{departures.checkedOut}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Guest In House */}
            <div className="bg-white p-6 shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Guests In House</h3>
                <div className="flex items-center">
                    <div className="relative w-20 h-20 mr-6 flex-shrink-0">
                        <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                            <path className="text-purple-100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center text-xl font-bold text-gray-700">
                            {guestsInHouse.adults + guestsInHouse.children}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between min-w-[100px]">
                            <div className="flex items-center">
                                <span className="w-2.5 h-2.5 rounded-full bg-purple-500 mr-2"></span>
                                <span className="text-sm text-gray-600">Adult</span>
                            </div>
                            <span className="text-sm font-semibold pl-4">{guestsInHouse.adults}</span>
                        </div>
                        <div className="flex items-center justify-between min-w-[100px]">
                            <div className="flex items-center">
                                <span className="w-2.5 h-2.5 rounded-full bg-purple-200 mr-2"></span>
                                <span className="text-sm text-gray-600">Child</span>
                            </div>
                            <span className="text-sm font-semibold pl-4">{guestsInHouse.children}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
