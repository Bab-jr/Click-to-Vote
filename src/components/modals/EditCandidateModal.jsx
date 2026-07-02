import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Loader2, UploadCloud, X } from "lucide-react";
import Modal from "@/components/dashboard/Modal";
import Combobox from "@/components/dashboard/Combobox";
import { base44 } from "@/lib/localStore";
import { logAction } from "@/lib/auditLog";
import { POSITION_LABELS } from "@/lib/resultsHelper";
import { CLUSTERS } from "@/lib/trackConfig";

export default function EditCandidateModal({
  open,
  onClose,
  onSuccess,
  candidate,
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [cluster, setCluster] = useState("");
  const [section, setSection] = useState("");
  const [photo, setPhoto] = useState("");
  const [motto, setMotto] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (open && candidate) {
      setName(candidate.name || "");
      setEmail(candidate.email || "");
      setCluster(candidate.cluster || "");
      setSection(candidate.section || "");
      setPhoto(candidate.photo || "");
      setMotto(candidate.motto || "");
      setDescription(candidate.description || "");
      setError("");
    }
  }, [open, candidate]);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setPhoto(file_url);
    } catch {
      // ignore
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await base44.entities.Candidate.update(candidate.id, {
        name,
        email,
        cluster,
        section,
        photo,
        motto,
        description,
      });
      await logAction(
        "EDITED CANDIDATE",
        `Edited candidate ${name} (${POSITION_LABELS[candidate.position] || candidate.position})`,
        candidate.election_id
      );
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || "Failed to update candidate");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full h-11 px-3 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand/40 transition-all";
  const lockedInputClass = `${inputClass} bg-gray-50 text-gray-500 cursor-not-allowed`;
  const labelClass =
    "text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1.5 block";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit Candidate"
      subtitle={candidate ? `${POSITION_LABELS[candidate.position] || candidate.position} · ${candidate.grade || ""} ${candidate.track ? "· " + candidate.track : ""}` : ""}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
            {error}
          </div>
        )}

        <div className="flex items-center gap-3">
          {photo ? (
            <div className="relative">
              <img
                src={photo}
                alt="Preview"
                className="w-14 h-14 rounded-full object-cover border border-gray-200"
              />
              <button
                type="button"
                onClick={() => setPhoto("")}
                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
              <UploadCloud className="w-5 h-5 text-gray-400" />
            </div>
          )}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingPhoto}
            className="px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-60"
          >
            {uploadingPhoto ? "Uploading…" : photo ? "Change Photo" : "Upload Photo"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoUpload}
            className="hidden"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className={`${inputClass} mt-1.5`}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`${inputClass} mt-1.5`}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Combobox
            label="Cluster"
            value={cluster}
            onChange={setCluster}
            options={CLUSTERS}
            placeholder="Select"
          />
          <div>
            <label className={labelClass}>Section</label>
            <input
              type="text"
              value={section}
              onChange={(e) => setSection(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Grade</label>
            <input type="text" value={candidate?.grade || ""} disabled className={lockedInputClass} />
          </div>
          <div>
            <label className={labelClass}>Track</label>
            <input type="text" value={candidate?.track || ""} disabled className={lockedInputClass} />
          </div>
        </div>
        <p className="text-xs text-gray-400">
          Grade and track are locked — they define the candidate's ballot slot.
        </p>
        <div>
          <label className="text-sm font-medium text-gray-700">Motto (optional)</label>
          <input
            type="text"
            value={motto}
            onChange={(e) => setMotto(e.target.value)}
            className={`${inputClass} mt-1.5`}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">Description (optional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-3 py-2.5 mt-1.5 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand/40 transition-all resize-none"
          />
        </div>

        <motion.button
          type="submit"
          disabled={loading}
          whileTap={{ scale: 0.97 }}
          className="w-full h-11 rounded-lg bg-brand text-white font-medium text-sm hover:bg-brand/90 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Saving…
            </>
          ) : (
            "Save Changes"
          )}
        </motion.button>
      </form>
    </Modal>
  );
}