import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";

export type GroupRole = "admin" | "editor" | "viewer";
export type GroupMember = { uid: string; role: GroupRole };
export type Group = {
  groupId: string;
  name: string;
  createdBy: string;
  members: GroupMember[];
  tripId?: string;
};

export function useGroupRole(group: Group | null): GroupRole | null {
  const { user } = useAuth();

  return useMemo(() => {
    if (!group || !user?.uid) return null;
    const member = group.members.find(m => m.uid === user.uid);
    return member ? member.role : null;
  }, [group, user]);
} 