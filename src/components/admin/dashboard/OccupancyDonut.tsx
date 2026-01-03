import React from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

interface Props {
    occupied: number;
    vacant: number;
    maintenance: number;
}

export default function OccupancyDonut({ occupied, vacant, maintenance }: Props) {
    const total = occupied + vacant + maintenance;
    // occupancy usually excludes maintenance from denominator or treated as N/A? 
    // Usually: Sold / Total Available. Or Sold / Total Inventory.
    // Let's use % of total rooms.
    const occupancyRate = total > 0 ? Math.round((occupied / total) * 100) : 0;

    const data = {
        labels: ['Occupied', 'Vacant', 'Maintenance'],
        datasets: [
            {
                data: [occupied, vacant, maintenance],
                backgroundColor: [
                    'rgba(59, 130, 246, 0.9)', // Blue (Occupied)
                    'rgba(243, 244, 246, 1)',  // Gray (Vacant)
                    'rgba(107, 114, 128, 0.3)', // Dark Gray (Maintenance)
                ],
                borderWidth: 0,
                cutout: '75%',
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: { enabled: false }
        },
        cutout: '75%',
    };

    return (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] h-full flex flex-col">
            <h3 className="text-lg font-bold text-gray-800 mb-6 font-display">Occupancy Rate</h3>

            <div className="flex-grow flex flex-col items-center justify-center min-h-[250px] relative">
                {/* Chart Container */}
                <div className="relative w-48 h-48">
                    <Doughnut data={data} options={options} />
                    {/* Centered Percentage */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-4xl font-extrabold text-gray-900">{occupancyRate}%</span>
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest mt-1">Occupied</span>
                    </div>
                </div>

                {/* Legend/Status Breakdown */}
                <div className="w-full mt-8 grid grid-cols-3 gap- text-center divide-x divide-gray-100">
                    <div className="px-2">
                        <span className="block text-xl font-bold text-gray-800">{occupied}</span>
                        <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Sold</span>
                    </div>
                    <div className="px-2">
                        <span className="block text-xl font-bold text-gray-800">{vacant}</span>
                        <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Vacant</span>
                    </div>
                    <div className="px-2">
                        <span className="block text-xl font-bold text-gray-800">{maintenance}</span>
                        <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Block</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
