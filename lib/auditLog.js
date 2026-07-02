import { base44 } from "@/lib/localStore";

export async function logAction(action, details, electionId = null) {
  try {
    const user = await base44.auth.me();
    const name = user?.name || "Unknown User";
    const role = user?.role
      ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
      : "User";
    const userId = user?.email?.split("@")[0] || "00-0000";
    await base44.entities.AuditLog.create({
      user: `${name} (${role} ${userId})`,
      action,
      details: details || "No additional details",
      election_id: electionId,
    });
  } catch {
    // silently fail — audit logging should not block operations
  }
}