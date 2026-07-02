import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { useElection } from "./ElectionContext";
import { useAuth } from "@/lib/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  History,
  Users,
  UserCheck,
  ShieldCheck,
  FileText,
  LogOut,
  ChevronDown,
  Vote,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Election Dashboard", path: "/", icon: LayoutDashboard },
  { label: "Election History", path: "/history", icon: History },
  { label: "Voter Management", path: "/voters", icon: Users },
  { label: "Candidate Management", path: "/candidates", icon: UserCheck },
  { label: "Officers Management", path: "/officers", icon: ShieldCheck },
  { label: "Reports & Audit", path: "/reports", icon: FileText },
];

export default function Sidebar({ onNavigate }) {
  const { elections, selectedElection, setSelectedElection, loading } =
    useElection();
  const { logout, user } = useAuth();
  const activeElections = elections.filter((e) => e.status !== "finished");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Officers only manage voters, candidates, and reports — they cannot see
  // the dashboard, history, or officer management (admin/adviser only).
  const isOfficer = user?.role === "officer";
  const visibleItems = isOfficer
    ? NAV_ITEMS.filter(
        (item) => !["/", "/history", "/officers"].includes(item.path)
      )
    : NAV_ITEMS;

  const handleLogout = () => {
    logout("/login");
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col flex-shrink-0 h-screen">
      {/* Brand header */}
      <div className="px-5 pt-5 pb-4">
        <p className="text-base font-bold text-gray-900 tracking-tight uppercase">
          Click to Vote
        </p>
        <p className="text-xs text-gray-500">Administrator Portal</p>
      </div>

      {/* Active election dropdown */}
      <div className="px-4 pb-4 border-b border-gray-100">
        <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1.5">
          Active Election
        </p>
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg border border-gray-200 hover:border-brand/40 transition-colors"
          >
            <span className="flex items-center gap-2 min-w-0">
              <Vote className="w-4 h-4 text-brand flex-shrink-0" />
              <span className="text-sm font-medium text-gray-900 truncate">
                {loading
                  ? "Loading…"
                  : selectedElection?.title || "No active election"}
              </span>
            </span>
            <motion.span
              animate={{ rotate: dropdownOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
            </motion.span>
          </button>
          <AnimatePresence>
            {dropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setDropdownOpen(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-30 overflow-hidden max-h-60 overflow-y-auto"
                >
                  {activeElections.length === 0 ? (
                    <p className="px-3 py-2.5 text-sm text-gray-400">
                      No active elections
                    </p>
                  ) : (
                    activeElections.map((el) => (
                      <button
                        key={el.id}
                        onClick={() => {
                          setSelectedElection(el);
                          setDropdownOpen(false);
                        }}
                        className={`w-full px-3 py-2.5 text-sm text-left hover:bg-brand/5 transition-colors ${
                          selectedElection?.id === el.id
                            ? "bg-brand/5 text-brand font-medium"
                            : "text-gray-700"
                        }`}
                      >
                        {el.title}
                      </button>
                    ))
                  )}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              onClick={onNavigate}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-brand/5 text-brand"
                    : "text-gray-600 hover:bg-gray-50"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 ${
                      isActive ? "bg-brand" : "bg-brand/10"
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 ${
                        isActive ? "text-white" : "text-brand"
                      }`}
                    />
                  </span>
                  {item.label}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-gray-100">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
        >
          <span className="w-7 h-7 rounded-md bg-red-50 flex items-center justify-center flex-shrink-0">
            <LogOut className="w-4 h-4 text-red-500" />
          </span>
          Logout
        </button>
      </div>
    </aside>
  );
}