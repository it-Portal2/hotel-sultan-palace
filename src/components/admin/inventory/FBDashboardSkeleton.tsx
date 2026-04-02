import { Skeleton } from "@/components/ui/skeleton";

export default function FBDashboardSkeleton() {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Stats Summary Skeleton (8 cards) */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <div key={i} className="bg-white p-3 rounded-lg border shadow-sm space-y-2">
                        <Skeleton className="h-2 w-12" />
                        <Skeleton className="h-5 w-20" />
                    </div>
                ))}
            </div>

            {/* Main Report Card Skeleton */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden min-h-[500px]">
                {/* Level 1 Tabs (Locations) */}
                <div className="bg-gray-50/50 border-b flex flex-wrap pt-2 px-2 gap-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="px-4 py-2 border-b-2 border-transparent">
                            <Skeleton className="h-4 w-24" />
                        </div>
                    ))}
                </div>

                {/* Level 2 Tabs (Order Types) */}
                <div className="bg-white border-b flex px-4 gap-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="px-4 py-3 border-b-2 border-transparent">
                            <Skeleton className="h-4 w-20" />
                        </div>
                    ))}
                </div>

                {/* Level 2.5 Filters (Payment Methods) */}
                <div className="bg-gray-50/30 border-b px-4 py-2 flex flex-wrap items-center gap-2">
                    {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-6 w-16 rounded-full" />
                    ))}
                </div>

                {/* Level 3 Content Area */}
                <div className="p-6">
                    {/* Summary Card Skeleton */}
                    <div className="mb-8 p-6 bg-blue-50/40 rounded-2xl border border-blue-100/50 flex flex-wrap items-center gap-x-12 gap-y-6 shadow-sm">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="flex flex-col space-y-2">
                                <Skeleton className="h-3 w-20" />
                                <Skeleton className="h-8 w-28" />
                            </div>
                        ))}
                    </div>

                    {/* Table Skeleton */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-1">
                            <div className="flex items-center gap-2">
                                <Skeleton className="w-1.5 h-1.5 rounded-full" />
                                <Skeleton className="h-3 w-40" />
                            </div>
                        </div>
                        <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                            <div className="bg-gray-50/80 px-5 py-4 border-b border-gray-100 flex justify-between">
                                {[1, 2, 3, 4, 5, 6, 7].map(i => <Skeleton key={i} className="h-3 w-16" />)}
                            </div>
                            <div className="divide-y divide-gray-50">
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <div key={i} className="px-5 py-4 flex justify-between">
                                        {[1, 2, 3, 4, 5, 6, 7].map(j => <Skeleton key={j} className="h-3 w-16" />)}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Pagination Skeleton */}
                        <div className="flex items-center justify-between px-2 pt-2">
                            <Skeleton className="h-3 w-48" />
                            <div className="flex items-center gap-2">
                                <Skeleton className="w-8 h-8 rounded-lg" />
                                <Skeleton className="w-16 h-8 rounded-lg" />
                                <Skeleton className="w-8 h-8 rounded-lg" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
