import React from 'react';
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardSkeleton() {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* KPI Cards Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-start gap-4">
                        <Skeleton className="w-10 h-10 rounded-lg shrink-0" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-3 w-20" />
                            <Skeleton className="h-7 w-32" />
                            <Skeleton className="h-3 w-24" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Chart + P&L Snapshot Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Bar Chart Skeleton */}
                <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                        <Skeleton className="h-5 w-48" />
                        <Skeleton className="h-5 w-24 rounded-full" />
                    </div>
                    <div className="p-6">
                        <div className="flex items-end gap-6 h-60 px-4 pb-2 border-b border-gray-100 mt-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex flex-col items-center flex-1 h-full justify-end space-y-3">
                                    <Skeleton className="h-6 w-20" />
                                    <Skeleton 
                                        className="w-full max-w-[80px] rounded-t-lg" 
                                        style={{ height: i === 1 ? '85%' : i === 2 ? '60%' : '45%' }} 
                                    />
                                    <Skeleton className="h-3 w-16" />
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 grid grid-cols-2 text-center pt-4 gap-4">
                            <div className="flex flex-col items-center space-y-2">
                                <Skeleton className="h-3 w-16" />
                                <Skeleton className="h-6 w-24" />
                            </div>
                            <div className="flex flex-col items-center space-y-2">
                                <Skeleton className="h-3 w-16" />
                                <Skeleton className="h-6 w-24" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* P&L Snapshot Skeleton */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 space-y-2">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-3 w-20" />
                    </div>
                    <div className="p-6 space-y-5">
                        <div className="space-y-3">
                            <div className="flex justify-between"><Skeleton className="h-4 w-24" /><Skeleton className="h-4 w-16" /></div>
                            <div className="flex justify-between"><Skeleton className="h-4 w-28" /><Skeleton className="h-4 w-20" /></div>
                        </div>
                        <div className="border-t border-dashed border-gray-200 pt-5 flex justify-between">
                            <Skeleton className="h-4 w-24" /><Skeleton className="h-4 w-16" />
                        </div>
                        <div className="border-t-2 border-gray-100 pt-5 flex justify-between">
                            <Skeleton className="h-6 w-24" /><Skeleton className="h-6 w-20" />
                        </div>
                        <div className="pt-3 space-y-2 border-t border-gray-100">
                            <div className="flex justify-between"><Skeleton className="h-3 w-32" /><Skeleton className="h-3 w-12" /></div>
                            <div className="flex justify-between"><Skeleton className="h-3 w-28" /><Skeleton className="h-3 w-12" /></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Table Skeleton */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Skeleton className="w-5 h-5 rounded" />
                        <Skeleton className="h-5 w-40" />
                    </div>
                    <Skeleton className="h-6 w-64" />
                </div>
                <div className="p-0">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <Skeleton className="h-4 w-4" />
                                <Skeleton className="h-4 w-48" />
                            </div>
                            <div className="flex items-center gap-12">
                                <Skeleton className="h-4 w-16" />
                                <Skeleton className="h-4 w-12" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Top Analytics Skeletons */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-10">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                            <Skeleton className="w-5 h-5 rounded-full" />
                            <Skeleton className="h-5 w-32" />
                        </div>
                        <div className="p-6 space-y-4">
                            {[1, 2, 3, 4, 5].map((j) => (
                                <div key={j} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Skeleton className="w-6 h-6 rounded-full" />
                                        <Skeleton className="h-4 w-24" />
                                    </div>
                                    <Skeleton className="h-4 w-12" />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
