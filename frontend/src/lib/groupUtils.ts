import type { GroupRole, GroupMember } from "@/services/tripService";

/**
 * The 'members' field in Firestore can be in two shapes:
 * 1. A map/object: { [uid: string]: GroupRole }
 * 2. An array (legacy): GroupMember[] which is { uid: string, role: GroupRole }[]
 */
type MembersShape = Record<string, GroupRole> | GroupMember[];

/**
 * Normalizes the 'members' field from a Firestore group document into a
 * consistent array of objects.
 * Handles both the new map/object format and the legacy array format.
 *
 * @param members - The members data from a group document.
 * @returns An array of { uid: string, role: GroupRole } objects.
 */
export const normalizeMembersToArray = (members: MembersShape | undefined | null): GroupMember[] => {
  if (!members) {
    return [];
  }

  // Handle the new map/object format: { uid: "role" }
  if (typeof members === "object" && !Array.isArray(members)) {
    return Object.entries(members).map(([uid, role]) => ({
      uid,
      role: role as GroupRole,
    }));
  }

  // Handle the legacy array format: [{ uid, role }]
  if (Array.isArray(members)) {
    // Optional: Add validation to ensure it matches GroupMember structure
    return members;
  }

  return [];
};

/**
 * Gets the role for a specific user from a group's members object.
 * This function is optimized for the map/object structure for fast lookups.
 *
 * @param members - The members data from a group document.
 * @param userId - The UID of the user to check.
 * @returns The user's role (e.g., 'admin', 'editor') or null if not a member.
 */
export const getUserRole = (members: MembersShape | undefined | null, userId: string | undefined): GroupRole | null => {
  if (!members || !userId) {
    return null;
  }

  // Optimized for map/object structure
  if (typeof members === "object" && !Array.isArray(members)) {
    return (members as Record<string, GroupRole>)[userId] || null;
  }

  // Fallback for legacy array structure
  if (Array.isArray(members)) {
    const member = members.find(m => m.uid === userId);
    return member ? member.role : null;
  }

  return null;
}; 