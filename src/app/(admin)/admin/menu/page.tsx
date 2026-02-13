"use client";

import React, { useState } from "react";
import MenuTabContent from "@/components/admin/menu/MenuTabContent";
import type { MenuType } from "@/lib/types/foodMenu";

export default function AdminMenuPage() {
  const [activeTab, setActiveTab] = useState<MenuType>("food");

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Top Tab Bar */}
      <div className="bg-white border-b border-gray-200 px-6 flex items-center gap-8 shadow-sm z-20 flex-shrink-0">
        <button
          onClick={() => setActiveTab("food")}
          className={`py-4 px-2 relative font-bold text-sm transition-all ${
            activeTab === "food"
              ? "text-[#FF6A00]"
              : "text-gray-500 hover:text-gray-800"
          }`}
        >
          FOOD MENU
          {activeTab === "food" && (
            <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#FF6A00] rounded-t-full shadow-sm" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("bar")}
          className={`py-4 px-2 relative font-bold text-sm transition-all ${
            activeTab === "bar"
              ? "text-[#FF6A00]"
              : "text-gray-500 hover:text-gray-800"
          }`}
        >
          BAR / BEVERAGES
          {activeTab === "bar" && (
            <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#FF6A00] rounded-t-full shadow-sm" />
          )}
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden relative">
        {/* We mount both but hide one to preserve state if needed, or we can just remount.
            Remounting is safer for ensuring fresh data fetching, which MenuTabContent does on prop change.
        */}
        <MenuTabContent menuType={activeTab} />
      </div>
    </div>
  );
}
