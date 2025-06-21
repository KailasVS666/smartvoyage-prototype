export interface GroupMember {
  uid: string;
  role: 'admin' | 'editor';
}

export interface Group {
  groupId: string;
  name: string;
  createdBy: string;
  members: GroupMember[];
  tripId?: string;
} 