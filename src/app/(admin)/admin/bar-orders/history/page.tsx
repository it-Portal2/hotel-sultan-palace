"use client";

import React from "react";

export default function BarOrdersHistoryPage() {
  return (
    <div className="flex flex-col h-full bg-gray-50/30">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 shrink-0">
        <h1 className="text-2xl font-bold text-gray-800 tracking-tight">
          Bar Order History
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          View past bar orders, completed and cancelled.
        </p>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center mb-4">
            <svg
              className="h-8 w-8 text-indigo-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-700">Coming Soon</h2>
          <p className="text-sm text-gray-400 mt-1 max-w-sm">
            Bar order history will be available in a future update. Use the Bar
            Dashboard to manage active orders for now.
          </p>
        </div>
      </div>
    </div>
  );
}
