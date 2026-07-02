import React, { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { Search, Menu } from "lucide-react";

export default function TopBar({ onMenuClick }) {
  const { user } = useAuth();
  const [search, setSearch] = useState("");

  const displayName = user?.name || user?.email || "Admin User";
  const initial = (displayName?.[0] || "A").toUpperCase();
  const role = user?.role || "Admin";

  return (
    <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center justify-between flex-shrink-0">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="md:hidden p-2 -ml-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors flex-shrink-0"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search for voters, candidates, or records..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 sm:h-10 pl-10 pr-4 rounded-full bg-gray-100 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:bg-white transition-all"
          />
        </div>
      </div>
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 ml-3">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-bold text-gray-900">{displayName}</p>
          <p className="text-xs text-gray-500 capitalize">{role}</p>
        </div>
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-brand/20 flex items-center justify-center text-brand font-bold text-sm flex-shrink-0">
          {initial}
        </div>
      </div>
    </header>
  );
}