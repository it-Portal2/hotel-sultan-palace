import React from 'react';
import {
    ArrowRightOnRectangleIcon,
    ArrowLeftOnRectangleIcon,
    UserGroupIcon,
    CurrencyDollarIcon
} from '@heroicons/react/24/outline';

interface Props {
    arrivals: { pending: number; arrived: number };
    departures: { pending: number; checkedOut: number };
    guestsInHouse: { adults: number; children: number };
    occupiedRooms: number;
    revenue: {
        total: number;
        month: number;
    };
}

const StatCard = ({
    title,
    icon: Icon,
    mainValue,
    prefix = '',
    subStats,
    colorClass,
    bgClass
}: {
    title: string;
    icon: any;
    mainValue: string | number;
    prefix?: string;
    subStats: { label: string; value: number | string }[];
    colorClass: string;
    bgClass: string;
}) => (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] hover:shadow-[0_4px_12px_-2px_rgba(0,0,0,0.08)] transition-all duration-300 relative overflow-hidden group">
        {/* Background Decoration */}
        <div className={`absolute -right-6 -top-6 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity duration-500 scale-150`}>
            <Icon className={`w-36 h-36 ${colorClass}`} />
        </div>

        <div className="flex justify-between items-start mb-4 relative z-10">
            <div>
                <p className="text-xs font-bold tracking-wider text-gray-400 uppercase mb-1">{title}</p>
                <div className="flex items-baseline gap-1">
                    <span className="text-sm font-semibold text-gray-400">{prefix}</span>
                    <span className="text-3xl font-extrabold text-gray-800 tracking-tight">
                        {typeof mainValue === 'number' ? mainValue.toLocaleString() : mainValue}
                    </span>
                </div>
            </div>
            <div className={`p-3 rounded-xl ${bgClass} ${colorClass} bg-opacity-10 backdrop-blur-sm`}>
                <Icon className="w-6 h-6" />
            </div>
        </div>

        <div className="flex items-center gap-4 relative z-10">
            {subStats.map((stat, idx) => (
                <div key={idx} className={`flex flex-col ${idx > 0 ? 'pl-4 border-l border-gray-100' : ''}`}>
                    <span className="text-[10px] uppercase text-gray-400 font-bold mb-0.5">{stat.label}</span>
                    <span className="text-sm font-semibold text-gray-600">{stat.value}</span>
                </div>
            ))}
        </div>
    </div>
);

export default function TodaysOperations({ arrivals, departures, guestsInHouse, occupiedRooms, revenue }: Props) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">

            {/* Arrivals */}
            <StatCard
                title="Arrivals"
                icon={ArrowRightOnRectangleIcon}
                mainValue={arrivals.pending + arrivals.arrived}
                colorClass="text-blue-600"
                bgClass="bg-blue-50"
                subStats={[
                    { label: 'Checked In', value: arrivals.arrived },
                    { label: 'Pending', value: arrivals.pending }
                ]}
            />

            {/* Departures */}
            <StatCard
                title="Departures"
                icon={ArrowLeftOnRectangleIcon}
                mainValue={departures.pending + departures.checkedOut}
                colorClass="text-orange-600"
                bgClass="bg-orange-50"
                subStats={[
                    { label: 'Checked Out', value: departures.checkedOut },
                    { label: 'Pending', value: departures.pending }
                ]}
            />

            {/* In House */}
            <StatCard
                title="Guest Count"
                icon={UserGroupIcon}
                mainValue={occupiedRooms} // Using occupied rooms as main metric? Or total guests?
                // Let's swap mainValue to Total Guests (adults + children) for "Guest Count" context
                // Or keep consistency. Let's show Total Guests as main value.
                // mainValue={guestsInHouse.adults + guestsInHouse.children}
                // Actually the prop passed is occupiedRooms. Let's calculate total guests.
                // But wait, previous mainValue was occupiedRooms. Let's stick to consistent logic but maybe label 'In House Rooms'?
                // User liked "In House". Let's use Occupied Rooms count as big number.
                colorClass="text-emerald-600"
                bgClass="bg-emerald-50"
                subStats={[
                    { label: 'Adults', value: guestsInHouse.adults },
                    { label: 'Children', value: guestsInHouse.children }
                ]}
            />

            {/* Revenue */}
            <StatCard
                title="Revenue"
                icon={CurrencyDollarIcon}
                mainValue={revenue.total}
                prefix="$"
                colorClass="text-violet-600"
                bgClass="bg-violet-50"
                subStats={[
                    { label: 'Total', value: `$${revenue.total.toLocaleString()}` }
                ]}
            />
        </div>
    );
}
