import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { useGroupRole } from "@/hooks/useGroupRole";
import { Button } from "@/components/ui/button";

// Group type for map-based members
export type GroupRole = "admin" | "editor" | "viewer";
export type Group = {
  groupId: string;
  name: string;
  createdBy: string;
  members: Record<string, GroupRole>; // map of uid -> role
  tripId?: string;
};

const MyGroups: React.FC = () => {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    setError(null);
    const fetchGroups = async () => {
      try {
        const groupsSnap = await getDocs(collection(db, "groups"));
        const userGroups: Group[] = [];
        groupsSnap.forEach((docSnap) => {
          const data = docSnap.data();
          // Only include groups where user is a member
          if (data.members && typeof data.members === "object" && user.uid in data.members) {
            userGroups.push({
              groupId: docSnap.id,
              name: data.name,
              createdBy: data.createdBy,
              members: data.members,
              tripId: data.tripId,
            });
          }
        });
        setGroups(userGroups);
      } catch (err) {
        setError("Failed to load groups. " + (err instanceof Error ? err.message : ""));
      } finally {
        setLoading(false);
      }
    };
    fetchGroups();
  }, [user]);

  if (!user) {
    return <div className="p-8 text-center">Please sign in to view your groups.</div>;
  }

  if (loading) {
    return <div className="p-8 text-center">Loading groups...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-600">{error}</div>;
  }

  if (groups.length === 0) {
    return <div className="p-8 text-center">You are not a member of any groups yet.</div>;
  }

  return (
    <div className="max-w-2xl mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">My Groups</h1>
      <div className="space-y-6">
        {groups.map((group) => {
          // Convert map to array for useGroupRole
          const membersArray = Object.entries(group.members).map(([uid, role]) => ({ uid, role }));
          const groupForRole = { ...group, members: membersArray };
          const role = useGroupRole(groupForRole);
          const isAdmin = role === "admin";
          const canEdit = role === "admin" || role === "editor";
          return (
            <div key={group.groupId} className="border rounded-lg p-4 bg-white shadow flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="font-semibold text-lg">{group.name}</div>
                <div className="text-sm text-gray-500">Role: {role || "(none)"}</div>
              </div>
              <div className="flex gap-2 mt-3 sm:mt-0">
                {canEdit && <Button variant="outline">🛠️ Edit Group</Button>}
                {isAdmin && <Button variant="outline">👥 Invite Member</Button>}
                {isAdmin && <Button variant="destructive">🗑️ Delete Group</Button>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MyGroups; 