import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getUserRole } from "@/lib/groupUtils";

export type GroupRole = "admin" | "editor" | "viewer";
export type GroupMember = { uid: string; role: GroupRole };
export type Group = {
  groupId: string;
  name: string;
  createdBy: string;
  members: Record<string, GroupRole> | GroupMember[];
  tripId?: string;
};

export function useGroupRole(group: Group | null): GroupRole | null {
  const { user } = useAuth();

  return useMemo(() => {
    return getUserRole(group?.members, user?.uid);
  }, [group, user]);
} 