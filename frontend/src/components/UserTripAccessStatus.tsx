import React from "react";
import { getUserRole } from "@/lib/groupUtils";
import type { GroupMember } from "@/services/tripService";

interface UserTripAccessStatusProps {
  user: { uid: string };
  members: GroupMember[] | undefined;
}

const UserTripAccessStatus: React.FC<UserTripAccessStatusProps> = ({ user, members }) => {
  if (!members) {
    return <div className="text-yellow-600">⚠️ Members data is loading or missing.</div>;
  }

  const role = getUserRole(members, user.uid);

  if (!role) {
    return (
      <div className="text-red-600 bg-red-100 p-2 rounded-xl mt-4">
        🚫 You are not part of this trip. Access denied.
      </div>
    );
  }

  return (
    <div className="text-green-700 bg-green-100 p-2 rounded-xl mt-4">
      ✅ You are part of this trip. Your role: <strong>{role}</strong>
    </div>
  );
};

export default UserTripAccessStatus; 