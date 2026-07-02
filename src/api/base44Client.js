// Re-export from local store so the app runs entirely on localStorage
// with no Base44 backend dependency. This keeps the platform-managed
// AuthContext.jsx import valid while routing to local storage.
export { base44 } from "@/lib/localStore";