import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useGroupRole } from "@/hooks/useGroupRole";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Group type for array-based members
export type GroupRole = "admin" | "editor" | "viewer";
export type GroupMember = { uid: string; role: GroupRole };
export type Group = {
  groupId: string;
  name: string;
  createdBy: string;
  members: GroupMember[];
  tripId?: string;
};

const GroupSettings: React.FC = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [renaming, setRenaming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Fetch group data
  useEffect(() => {
    if (!groupId) return;
    setLoading(true);
    setError(null);
    const fetchGroup = async () => {
      try {
        const groupRef = doc(db, "groups", groupId);
        const groupSnap = await getDoc(groupRef);
        if (!groupSnap.exists()) {
          setError("Group not found");
          setGroup(null);
        } else {
          const data = groupSnap.data();
          // Convert members map or array to array of {uid, role}
          let members: GroupMember[] = [];
          if (Array.isArray(data.members)) {
            members = data.members;
          } else if (data.members && typeof data.members === "object") {
            members = Object.entries(data.members).map(([uid, role]) => ({ uid, role }));
          }
          setGroup({
            groupId: groupSnap.id,
            name: data.name,
            createdBy: data.createdBy,
            members,
            tripId: data.tripId,
          });
          setRenameValue(data.name || "");
        }
      } catch (err) {
        setError("Failed to load group. " + (err instanceof Error ? err.message : ""));
        setGroup(null);
      } finally {
        setLoading(false);
      }
    };
    fetchGroup();
  }, [groupId]);

  // Use the hook for role/permission logic
  const role = useGroupRole(group);
  const isAdmin = role === "admin";
  const canEdit = role === "admin" || role === "editor";

  // Rename group handler
  const handleRename = async () => {
    if (!group || !canEdit || !renameValue.trim()) return;
    setRenaming(true);
    try {
      await updateDoc(doc(db, "groups", group.groupId), { name: renameValue.trim() });
      setGroup({ ...group, name: renameValue.trim() });
    } catch (err) {
      setError("Failed to rename group. " + (err instanceof Error ? err.message : ""));
    } finally {
      setRenaming(false);
    }
  };

  // Delete group handler
  const handleDelete = async () => {
    if (!group || !isAdmin) return;
    setDeleting(true);
    try {
      await deleteDoc(doc(db, "groups", group.groupId));
      navigate("/my-groups");
    } catch (err) {
      setError("Failed to delete group. " + (err instanceof Error ? err.message : ""));
    } finally {
      setDeleting(false);
    }
  };

  // Placeholder for manage members
  const handleManageMembers = () => {
    // Implement member management UI/modal as needed
    alert("Manage Members (promote/demote/remove) - only for admins");
  };

  if (loading) {
    return <div className="p-8 text-center">Loading group settings...</div>;
  }
  if (error) {
    return <div className="p-8 text-center text-red-600">{error}</div>;
  }
  if (!group) {
    return <div className="p-8 text-center">Group not found.</div>;
  }

  return (
    <div className="max-w-xl mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Group Settings</h1>
      <div className="border rounded-lg p-6 bg-white shadow space-y-6">
        <div>
          <div className="font-semibold text-lg mb-1">Group Name</div>
          <div className="flex gap-2 items-center">
            <Input
              value={renameValue}
              onChange={e => setRenameValue(e.target.value)}
              disabled={!canEdit || renaming}
              className="w-64"
            />
            {canEdit && (
              <Button onClick={handleRename} disabled={renaming || !renameValue.trim()}>
                ✏️ Rename Group
              </Button>
            )}
          </div>
        </div>
        {isAdmin && (
          <div>
            <div className="font-semibold text-lg mb-2">Members</div>
            <Button variant="outline" onClick={handleManageMembers}>
              👥 Manage Members
            </Button>
          </div>
        )}
        {isAdmin && (
          <div>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              🗑️ Delete Group
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupSettings; 