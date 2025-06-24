import { auth } from '@/lib/firebase';

const getBaseUrl = () => {
  // Use localhost for development, and your production URL otherwise
  return 'http://localhost:5000';
};

const getIdToken = async () => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User not authenticated');
  }
  return await user.getIdToken();
};

export type PackingListItem = {
  id: string;
  item: string;
  addedBy: string;
  packedBy: string | null;
  timestamp: number;
};

export const addPackingListItem = async (tripId: string, item: string): Promise<PackingListItem> => {
  const idToken = await getIdToken();
  const response = await fetch(`${getBaseUrl()}/trips/${tripId}/packing-items`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({ item }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to add packing item');
  }

  return response.json();
};

export const toggleItemPacked = async (tripId: string, itemId: string): Promise<PackingListItem> => {
  const idToken = await getIdToken();
  const response = await fetch(`${getBaseUrl()}/trips/${tripId}/packing-items/${itemId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to toggle item');
  }

  return response.json();
};

export const deletePackingListItem = async (tripId: string, itemId: string): Promise<{ success: boolean }> => {
  const idToken = await getIdToken();
  const response = await fetch(`${getBaseUrl()}/trips/${tripId}/packing-items/${itemId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to delete item');
  }

  return response.json();
}; 