import apiClient from './client';

export interface SendMessagePayload {
  conversationId: number;
  messageText: string;
  parentMessageId?: number | null;
  attachmentId?: number | null;
}

export interface CreateGroupPayload {
  title: string;
  memberIds: number[];
  isAnnouncement?: boolean;
  whoCanPost?: 'ALL_MEMBERS' | 'SELECTED_MEMBERS' | 'ADMIN_ONLY';
  departmentId?: number | null;
}

export const getConversations = async () => {
  const res = await apiClient.get('/chat/conversations');
  return res.data;
};

export const startDirectChat = async (targetUserId: number) => {
  const res = await apiClient.post('/chat/direct', { targetUserId });
  return res.data;
};

export const createGroupChat = async (payload: CreateGroupPayload) => {
  const res = await apiClient.post('/chat/group', payload);
  return res.data;
};

export const deleteGroupChat = async (conversationId: number) => {
  const res = await apiClient.delete(`/chat/group/${conversationId}`);
  return res.data;
};

export const updateGroupSettings = async (
  conversationId: number,
  settings: { title?: string; whoCanPost?: string; description?: string }
) => {
  const res = await apiClient.patch(`/chat/group/${conversationId}/settings`, settings);
  return res.data;
};

export const getGroupMembers = async (conversationId: number) => {
  const res = await apiClient.get(`/chat/group/${conversationId}/members`);
  return res.data;
};

export const searchCoworkers = async (q: string) => {
  const res = await apiClient.get(`/chat/users/search?q=${encodeURIComponent(q)}`);
  return res.data;
};

export const getConversationMessages = async (conversationId: number) => {
  const res = await apiClient.get(`/chat/messages/${conversationId}`);
  return res.data;
};

export const sendChatMessage = async (payload: SendMessagePayload) => {
  const res = await apiClient.post('/chat/messages', payload);
  return res.data;
};

export interface FileUploadAsset {
  uri: string;
  name: string;
  type: string;
}

export const uploadChatAttachment = async (asset: FileUploadAsset) => {
  const formData = new FormData();
  formData.append('file', {
    uri: asset.uri,
    name: asset.name,
    type: asset.type,
  } as any);

  const res = await apiClient.post('/chat/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return res.data;
};
