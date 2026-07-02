import React from "react";
import { Outlet, Navigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { Vote, LogOut } from "lucide-react";

export default function VoterLayout() {
  const { user, logout } = useAuth();

  if (user?.type !== "voter") {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col">
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand/10 flex items-center justify-center">
            <Vote className="w-5 h-5 text-brand" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 uppercase tracking-tight">
              Click to Vote
            </p>
            <p className="text-xs text-gray-500">Voter Portal</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-gray-900">{user?.name}</p>
            <p className="text-xs text-gray-500">{user?.email}</p>
          </div>
          <button
            onClick={() => logout("/login")}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}