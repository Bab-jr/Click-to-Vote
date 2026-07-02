import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Loader2, UploadCloud, X } from "lucide-react";
import Modal from "@/components/dashboard/Modal";
import SearchableSelect from "@/components/dashboard/SearchableSelect";
import Combobox from "@/components/dashboard/Combobox";
import { base44 } from "@/lib/localStore";
import { logAction } from "@/lib/auditLog";
import { CLUSTERS, GRADES, getTracksForGrade } from "@/lib/trackConfig";

export default function AddCandidateModal({
  open,
  onClose,
  onSuccess,
  electionId,
  position,
  positionValue,
  partyId,
  partyName,
  lockedTrack,
  lockedGrade,
  voters,
}) {
  const [selectedVoterName, setSelectedVoterName] = useState("");
  const [name, setName] = useState("");
  const [userId, setUserId] = useState("");
  const [email, setEmail] = useState("");
  const [cluster, setCluster] = useState("");
  const [track, setTrack] = useState("");
  const [grade, setGrade] = useState("");
  const [section, setSection] = useState("");
  const [photo, setPhoto] = useState("");
  const [motto, setMotto] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setSelectedVoterName("");
      setName("");
      setUserId("");
      setEmail("");
      setCluster("");
      setTrack(lockedTrack || "");
      setGrade(lockedGrade || "");
      setSection("");
      setPhoto("");
      setMotto("");
      setDescription("");
      setError("");
    }
  }, [open, lockedTrack, lockedGrade]);

  const voterOptions = voters.map((v) => ({
    value: v.id,
    label: `${v.name} (${v.user_id})`,
    data: v,
  }));

  const handleVoterSelect = (option) => {
    const v = option.data;
    setSelectedVoterName(v.name);
    setName(v.name);
    setUserId(v.user_id || "");
    setEmail(v.email || "");
    setCluster(v.cluster || "");
    if (!lockedGrade) setGrade(v.grade || "");
    if (!lockedTrack) setTrack(v.track || "");
    setSection(v.section || "");
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({
        file,
      });
      setPhoto(file_url);
    } catch {
      // ignore upload errors
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await base44.entities.Candidate.create({
        user_id: userId,
        name,
        email,
        cluster,
        track: lockedTrack || track,
        grade: lockedGrade || grade,
        section,
        position: positionValue,
        party_id: partyId,
        election_id: electionId,
        photo,
        motto,
        description,
      });
      await logAction(
        "ADDED CANDIDATE",
        `Added ${name} as candidate for ${position} (${partyName})`,
        electionId
      );
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || "Failed to add candidate");
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
      title="Assign Candidate"
      subtitle={`${position} — ${partyName}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
            {error}
          </div>
        )}

        <SearchableSelect
          label="Select a Voter (optional)"
          options={voterOptions}
          value={selectedVoterName}
          onChange={handleVoterSelect}
          placeholder="Type to search voters…"
        />

        <div className="border-t border-gray-100 pt-4 space-y-4">
          {/* Photo upload */}
          <div>
            <label className="text-sm font-medium text-gray-700">
              Photo (optional)
            </label>
            <div className="mt-1.5 flex items-center gap-3">
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
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter name"
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
              placeholder="email@school.edu"
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
            {lockedGrade ? (
              <div>
                <label className={labelClass}>Grade</label>
                <input
                  type="text"
                  value={lockedGrade}
                  disabled
                  className={lockedInputClass}
                />
              </div>
            ) : (
              <Combobox
                label="Grade"
                value={grade}
                onChange={(val) => {
                  setGrade(val);
                  setTrack("");
                }}
                options={GRADES}
                placeholder="Select"
              />
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {lockedTrack ? (
              <div>
                <label className={labelClass}>Track</label>
                <input
                  type="text"
                  value={lockedTrack}
                  disabled
                  className={lockedInputClass}
                />
              </div>
            ) : (
              <Combobox
                label="Track"
                value={track}
                onChange={setTrack}
                options={getTracksForGrade(grade)}
                placeholder={grade ? "Select" : "Select grade first"}
              />
            )}
            <div>
              <label className={labelClass}>Section</label>
              <input
                type="text"
                value={section}
                onChange={(e) => setSection(e.target.value)}
                placeholder="Section"
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">
              Motto (optional)
            </label>
            <input
              type="text"
              value={motto}
              onChange={(e) => setMotto(e.target.value)}
              placeholder="Candidate's motto or tagline"
              className={`${inputClass} mt-1.5`}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Candidate's platform or description"
              rows={3}
              className="w-full px-3 py-2.5 mt-1.5 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand/40 transition-all resize-none"
            />
          </div>
        </div>

        <motion.button
          type="submit"
          disabled={loading}
          whileTap={{ scale: 0.97 }}
          className="w-full h-11 rounded-lg bg-brand text-white font-medium text-sm hover:bg-brand/90 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Assigning…
            </>
          ) : (
            "Assign Candidate"
          )}
        </motion.button>
      </form>
    </Modal>
  );
}