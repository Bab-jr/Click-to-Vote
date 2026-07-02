import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Loader2, UploadCloud, FileText } from "lucide-react";
import Modal from "@/components/dashboard/Modal";
import { base44 } from "@/lib/localStore";
import { logAction } from "@/lib/auditLog";

function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length === 0) return [];
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  return lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim());
    const row = {};
    headers.forEach((h, i) => {
      row[h] = values[i] || "";
    });
    return row;
  });
}

export default function ImportVotersModal({
  open,
  onClose,
  onSuccess,
  electionId,
}) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setError("");
    setSuccess("");
  };

  const handleImport = async () => {
    if (!file) {
      setError("Please select a CSV file");
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const text = await file.text();
      const rows = parseCSV(text);
      const voters = rows
        .map((r) => ({
          user_id: r.user_id || r.userid || r.id || "",
          name: r.name || "",
          email: r.email || "",
          password: "",
          password_changed: false,
          cluster: r.cluster || "",
          grade: r.grade || "",
          track: "",
          section: "",
          election_id: electionId,
          has_voted: false,
        }))
        .filter((v) => v.name && v.email);

      if (voters.length === 0) {
        setError(
          "No valid voter records found. Ensure CSV has columns: user_id, name, email, grade, cluster"
        );
        return;
      }
      await base44.entities.Voter.bulkCreate(voters);
      await logAction(
        "IMPORTED VOTERS",
        `Imported ${voters.length} voters via CSV`,
        electionId
      );
      setSuccess(`Successfully imported ${voters.length} voters`);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      onSuccess();
    } catch (err) {
      setError(err.message || "Failed to import voters");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Import Voters"
      subtitle="Upload a CSV file to add voters in bulk"
    >
      <div className="space-y-4">
        {error && (
          <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="px-4 py-3 rounded-lg bg-green-50 border border-green-200 text-green-600 text-sm">
            {success}
          </div>
        )}
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-brand/40 hover:bg-brand/5 transition-colors"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
          />
          {file ? (
            <div className="flex items-center justify-center gap-2 text-sm text-gray-700">
              <FileText className="w-5 h-5 text-brand" />
              <span className="font-medium">{file.name}</span>
            </div>
          ) : (
            <>
              <UploadCloud className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">
                Click to select a CSV file
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Columns: user_id, name, email, grade, cluster
              </p>
            </>
          )}
        </div>
        <motion.button
          onClick={handleImport}
          disabled={loading || !file}
          whileTap={{ scale: 0.97 }}
          className="w-full h-11 rounded-lg bg-brand text-white font-medium text-sm hover:bg-brand/90 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Importing…
            </>
          ) : (
            "Import Voters"
          )}
        </motion.button>
      </div>
    </Modal>
  );
}