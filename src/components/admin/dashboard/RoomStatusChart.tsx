import React from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ChartOptions } from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface Props {
    roomStatus: {
        vacant: number;
        sold: number;
        blocked: number; // Maintenance
    };
    housekeeping: {
        clean: number;
        dirty: number;
        hkAssign: number; // Needs Attention/Inspected
    };
}

export default function RoomStatusChart({ roomStatus, housekeeping }: Props) {

    const options: ChartOptions<'bar'> = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom' as const,
                labels: {
                    usePointStyle: true,
                    boxWidth: 8,
                    font: { size: 11, family: "'Inter', sans-serif" },
                    padding: 20
                }
            },
            title: {
                display: false,
            },
            tooltip: {
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                titleColor: '#1f2937',
                bodyColor: '#4b5563',
                borderColor: '#e5e7eb',
                borderWidth: 1,
                padding: 10,
                displayColors: true,
                usePointStyle: true,
            }
        },
        scales: {
            x: {
                grid: { display: false },
                ticks: { font: { size: 11 }, color: '#6b7280' }
            },
            y: {
                grid: {
                    borderDash: [4, 4],
                    drawBorder: false,
                    color: '#f3f4f6'
                } as any,
                ticks: { stepSize: 1, font: { size: 11 }, color: '#6b7280' },
                border: { dash: [4, 4], display: false }
            }
        },
        layout: {
            padding: {
                top: 20
            }
        }
    };

    const data = {
        labels: ['Clean', 'Dirty', 'Attention', 'Blocked'],
        datasets: [
            {
                label: 'Room Status',
                data: [
                    housekeeping.clean,
                    housekeeping.dirty,
                    housekeeping.hkAssign,
                    roomStatus.blocked
                ],
                backgroundColor: [
                    '#10B981', // Emerald 500
                    '#EF4444', // Red 500
                    '#F59E0B', // Amber 500
                    '#6B7280', // Gray 500
                ],
                borderRadius: 6,
                barPercentage: 0.5,
                hoverBackgroundColor: [
                    '#059669',
                    '#DC2626',
                    '#D97706',
                    '#4B5563',
                ]
            },
        ],
    };

    return (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] h-full flex flex-col">
            <h3 className="text-lg font-bold text-gray-800 mb-6 font-display">Room Cleanliness</h3>
            <div className="flex-grow min-h-[300px] flex items-center justify-center">
                {housekeeping.clean + housekeeping.dirty + housekeeping.hkAssign + roomStatus.blocked === 0 ? (
                    <div className="text-center text-gray-400">
                        <p className="text-sm">No room status data available</p>
                    </div>
                ) : (
                    <Bar options={options} data={data} />
                )}
            </div>
        </div>
    );
}
