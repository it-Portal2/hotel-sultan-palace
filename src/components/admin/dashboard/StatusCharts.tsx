import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, Tooltip } from 'recharts';

interface StatusChartsProps {
    roomStatus: {
        vacant: number;
        sold: number;
        dayUse: number;
        complimentary: number;
        blocked: number;
    };
    housekeeping: {
        clean: number;
        hkAssign: number;
        dirty: number;
        block: number;
    };
}

export default function StatusCharts({ roomStatus, housekeeping }: StatusChartsProps) {
    // Room Status Donut Data
    const roomStatusChartData = [
        { name: 'Vacant', value: roomStatus.vacant, color: '#0EA5E9' }, // Sky Blue
        { name: 'Sold', value: roomStatus.sold, color: '#6366F1' }, // Indigo
        { name: 'Day Use', value: roomStatus.dayUse, color: '#10B981' }, // Emerald
        { name: 'Complimentary', value: roomStatus.complimentary, color: '#F59E0B' }, // Amber
        { name: 'Blocked', value: roomStatus.blocked, color: '#EF4444' }, // Red
    ];

    const activeRoomStatusData = roomStatusChartData.some(d => d.value > 0)
        ? roomStatusChartData
        : [{ name: 'Vacant', value: 1, color: '#E2E8F0' }];

    // Housekeeping Bar Data
    const housekeepingChartData = [
        { name: 'Clean', value: housekeeping.clean, fill: '#10B981' }, // Emerald
        { name: 'Assign', value: housekeeping.hkAssign, fill: '#F59E0B' }, // Amber
        { name: 'Dirty', value: housekeeping.dirty, fill: '#EF4444' }, // Red
        { name: 'Block', value: housekeeping.block, fill: '#64748B' }, // Slate
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {/* Room Status */}
            <div className="bg-white p-6 shadow-sm border border-gray-100 flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-semibold text-gray-800">Room Status</h3>
                    <span className="text-xs font-medium px-2 py-1 bg-gray-100 text-gray-600">Real-time</span>
                </div>

                <div className="flex items-center justify-between">
                    <div className="w-32 h-32 relative mx-auto md:mx-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={activeRoomStatusData}
                                    innerRadius={45}
                                    outerRadius={60}
                                    paddingAngle={2}
                                    dataKey="value"
                                    stroke="none"
                                    cornerRadius={4}
                                >
                                    {activeRoomStatusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <span className="text-xl font-bold text-gray-700">{roomStatus.vacant + roomStatus.sold + roomStatus.blocked}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 ml-4 flex-1">
                        {roomStatusChartData.map((item) => (
                            <div key={item.name} className="flex items-center text-sm w-full gap-4">
                                <div className="flex items-center flex-1">
                                    <span className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: item.color }}></span>
                                    <span className="text-gray-600">{item.name}</span>
                                </div>
                                <span className="font-semibold text-gray-900">{item.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Housekeeping Status */}
            <div className="bg-white p-6 shadow-sm border border-gray-100 flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-semibold text-gray-800">Housekeeping</h3>
                    <span className="text-xs font-medium px-2 py-1 bg-gray-100 text-gray-600">Today</span>
                </div>

                <div className="w-full h-40">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={housekeepingChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 11, fill: '#64748B' }}
                                dy={10}
                            />
                            <Tooltip
                                cursor={{ fill: '#F1F5F9', radius: 4 }}
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                            <Bar dataKey="value" barSize={32} radius={[0, 0, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
