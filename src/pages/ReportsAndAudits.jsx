import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { FileText, Loader2, Search } from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";
import Dropdown from "@/components/dashboard/Dropdown";
import { useElection } from "@/components/dashboard/ElectionContext";
import { base44 } from "@/lib/localStore";

function getActionColor(action) {
  if (
    action.includes("CREATED") ||
    action.includes("ADDED") ||
    action.includes("REGISTERED") ||
    action.includes("DEFINED") ||
    action.includes("ASSIGNED") ||
    action.includes("IMPORTED") ||
    action.includes("VOTE")
  )
    return "bg-green-100 text-green-700";
  if (action.includes("UPDATED") || action.includes("STARTED"))
    return "bg-blue-100 text-blue-700";
  if (action.includes("REMOVED") || action.includes("ENDED"))
    return "bg-red-100 text-red-700";
  if (action.includes("IMPORTED")) return "bg-purple-100 text-purple-700";
  return "bg-gray-100 text-gray-600";
}

export default function ReportsAndAudits() {
  const { selectedElection } = useElection();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("All Actions");

  useEffect(() => {
    const loadLogs = async () => {
      try {
        const data = selectedElection
          ? await base44.entities.AuditLog.filter(
              { election_id: selectedElection.id },
              "-created_date",
              200
            )
          : await base44.entities.AuditLog.list("-created_date", 200);
        setLogs(data);
      } catch {
        setLogs([]);
      } finally {
        setLoading(false);
      }
    };
    setLoading(true);
    loadLogs();
  }, [selectedElection?.id]);

  const actionTypes = useMemo(() => {
    const types = new Set(logs.map((l) => l.action));
    return ["All Actions", ...Array.from(types).sort()];
  }, [logs]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return logs.filter((log) => {
      if (actionFilter !== "All Actions" && log.action !== actionFilter)
        return false;
      if (q) {
        const inUser = log.user?.toLowerCase().includes(q);
        const inAction = log.action?.toLowerCase().includes(q);
        const inDetails = log.details?.toLowerCase().includes(q);
        if (!inUser && !inAction && !inDetails) return false;
      }
      return true;
    });
  }, [logs, search, actionFilter]);

  return (
    <div className="p-4 sm:p-6">
      <PageHeader
        icon={FileText}
        title="Reports & Audit Trail"
        subtitle={
          selectedElection
            ? `Monitoring activity for ${selectedElection.title}`
            : "Monitoring all activity"
        }
      />

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-xl border border-gray-200 overflow-hidden"
      >
        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 px-5 py-4 border-b border-gray-100">
          <div className="relative">
            <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1.5">
              Search
            </p>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by user, action, or details"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-10 pl-10 pr-3 rounded-lg border border-gray-200 bg-white text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand/40 transition-all"
              />
            </div>
          </div>
          <Dropdown
            label="Action Type"
            value={actionFilter}
            onChange={setActionFilter}
            options={actionTypes}
            placeholder="All Actions"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-brand animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-gray-400">
            {logs.length === 0
              ? "No audit logs yet. Actions will appear here automatically."
              : "No logs match your search."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  {["Timestamp", "User", "Action", "Details"].map((h) => (
                    <th
                      key={h}
                      className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((log) => (
                  <tr
                    key={log.id}
                    className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-5 py-3 text-sm text-gray-600 whitespace-nowrap">
                      {log.created_date
                        ? format(
                            new Date(log.created_date),
                            "MMM d, yyyy HH:mm:ss"
                          )
                        : "—"}
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-900">
                      {log.user}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getActionColor(
                          log.action
                        )}`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-500 max-w-md truncate">
                      {log.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}