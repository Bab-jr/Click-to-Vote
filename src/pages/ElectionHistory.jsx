import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { History, ChevronDown, Loader2 } from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";
import StatusPill from "@/components/dashboard/StatusPill";
import ElectionResultDetail from "@/components/dashboard/ElectionResultDetail";
import { base44 } from "@/lib/localStore";

export default function ElectionHistory() {
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await base44.entities.Election.list("-created_date");
        setElections(data);
      } catch {
        setElections([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const toggle = (id) => setExpandedId(expandedId === id ? null : id);

  return (
    <div className="p-4 sm:p-6">
      <PageHeader
        icon={History}
        title="Election History"
        subtitle="Results and records from all elections"
      />

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-brand animate-spin" />
        </div>
      ) : elections.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
          <History className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-400">
            No elections have been created yet.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {elections.map((el, idx) => (
            <motion.div
              key={el.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: idx * 0.05 }}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden"
            >
              <button
                onClick={() => toggle(el.id)}
                className="w-full text-left p-5 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <StatusPill status={el.status} />
                    <div className="min-w-0">
                      <h3 className="text-base sm:text-lg font-bold text-gray-900 truncate">
                        {el.title}
                      </h3>
                      {el.school_year && (
                        <p className="text-xs text-gray-500">SY {el.school_year}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="hidden sm:block text-right text-xs text-gray-500">
                      {el.start_date_time && (
                        <p>Started: {format(new Date(el.start_date_time), "MMM d, yyyy")}</p>
                      )}
                      {el.end_date_time && (
                        <p>Ended: {format(new Date(el.end_date_time), "MMM d, yyyy")}</p>
                      )}
                    </div>
                    <motion.div
                      animate={{ rotate: expandedId === el.id ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    </motion.div>
                  </div>
                </div>
              </button>
              <AnimatePresence>
                {expandedId === el.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-gray-100 p-5">
                      <ElectionResultDetail election={el} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}