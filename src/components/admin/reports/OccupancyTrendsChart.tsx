import React from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts';

interface OccupancyTrendsChartProps {
    data: {
        name: string;
        occupancyRate: number;
    }[];
}

export default function OccupancyTrendsChart({ data }: OccupancyTrendsChartProps) {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#9CA3AF', fontSize: 10, fontWeight: 500 }}
                    dy={10}
                />
                <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#9CA3AF', fontSize: 10 }}
                    tickFormatter={(value) => `${value}%`}
                />
                <Tooltip
                    cursor={{ fill: '#F9FAFB' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 20px -5px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                />
                <Bar dataKey="occupancyRate" radius={[4, 4, 0, 0]} barSize={30} name="Occupancy Rate">
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.occupancyRate > 80 ? '#10B981' : entry.occupancyRate > 50 ? '#3B82F6' : '#F59E0B'} />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );
}
