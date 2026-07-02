import React, { createContext, useContext, useState, useEffect } from "react";
import { base44 } from "@/lib/localStore";

const ElectionContext = createContext(null);

export function useElection() {
  return useContext(ElectionContext);
}

export function ElectionProvider({ children }) {
  const [elections, setElections] = useState([]);
  const [selectedElection, setSelectedElection] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchElections = async () => {
    try {
      const all = await base44.entities.Election.list();
      const now = new Date();
      const updates = [];
      for (const el of all) {
        let newStatus = el.status;
        if (
          el.status === "preparing" &&
          el.start_date_time &&
          new Date(el.start_date_time) <= now
        ) {
          newStatus = "ongoing";
        }
        if (
          newStatus === "ongoing" &&
          el.end_date_time &&
          new Date(el.end_date_time) <= now
        ) {
          newStatus = "finished";
        }
        if (newStatus !== el.status) {
          updates.push(
            base44.entities.Election.update(el.id, { status: newStatus })
          );
          el.status = newStatus;
        }
      }
      await Promise.all(updates);
      setElections(all);
      setSelectedElection((prev) => {
        if (prev && all.find((e) => e.id === prev.id && e.status !== "finished"))
          return prev;
        const selectable = all.filter((e) => e.status !== "finished");
        return selectable[0] || null;
      });
    } catch {
      // no elections yet
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchElections();
  }, []);

  return (
    <ElectionContext.Provider
      value={{
        elections,
        selectedElection,
        setSelectedElection,
        loading,
        refresh: fetchElections,
      }}
    >
      {children}
    </ElectionContext.Provider>
  );
}