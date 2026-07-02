// Academic structure is centralized in src/config/appConfig.js.
// This file re-exports it so existing imports from "@/lib/trackConfig"
// keep working while there is a single source of truth to edit.
export {
  CLUSTERS,
  GRADES,
  TRACKS_BY_GRADE,
  TRACKS,
  SECTIONS_PER_GRADE,
  getTracksForGrade,
  getSectionsForGrade,
} from "@/config/appConfig";