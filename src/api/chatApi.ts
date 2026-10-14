import apiClient from './client';

export interface SendMessagePayload {
  conversationId: number;
  messageText: string;
  parentMessageId?: number | null;
  attachmentId?: number | null;
}

export interface CreateGroupPayload {
  title: string;
  description?: string;
  memberIds: number[];
  isAnnouncement?: boolean;
  whoCanPost?: 'ALL_MEMBERS' | 'SELECTED_MEMBERS' | 'ADMIN_ONLY';
  allowedMemberIds?: number[];
  departmentId?: number | null;
  departmentIds?: number[];
  companyId?: number | null;
  companyIds?: number[];
  isCompanyGroup?: boolean;
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
  settings: {
    title?: string;
    whoCanPost?: string;
    who_can_post?: string;
    description?: string;
    allowed_member_ids?: number[];
  }
) => {
  const res = await apiClient.patch(`/chat/group/${conversationId}/settings`, settings);
  return res.data;
};

export const getGroupMembers = async (conversationId: number) => {
  const res = await apiClient.get(`/chat/group/${conversationId}/members`);
  return res.data;
};

export const searchCoworkers = async (
  q: string = '',
  deptOrParams?: number | null | {
    departmentId?: number | null;
    departmentIds?: number[] | string;
    companyId?: number | null;
    companyIds?: number[] | string;
  }
) => {
  const searchParams = new URLSearchParams();
  if (q) searchParams.append('q', q);

  if (typeof deptOrParams === 'number') {
    searchParams.append('departmentId', String(deptOrParams));
  } else if (deptOrParams && typeof deptOrParams === 'object') {
    if (deptOrParams.departmentId) {
      searchParams.append('departmentId', String(deptOrParams.departmentId));
    }
    if (deptOrParams.departmentIds) {
      const val = Array.isArray(deptOrParams.departmentIds)
        ? deptOrParams.departmentIds.join(',')
        : deptOrParams.departmentIds;
      if (val) searchParams.append('departmentIds', String(val));
    }
    if (deptOrParams.companyId) {
      searchParams.append('companyId', String(deptOrParams.companyId));
    }
    if (deptOrParams.companyIds) {
      const val = Array.isArray(deptOrParams.companyIds)
        ? deptOrParams.companyIds.join(',')
        : deptOrParams.companyIds;
      if (val) searchParams.append('companyIds', String(val));
    }
  }

  const queryStr = searchParams.toString() ? `?${searchParams.toString()}` : '';
  const res = await apiClient.get(`/chat/users/search${queryStr}`);
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

export const deleteMessage = async (
  messageId: number,
  deleteType: 'FOR_ME' | 'FOR_EVERYONE' = 'FOR_ME'
) => {
  const res = await apiClient.delete(`/chat/messages/${messageId}`, {
    data: { deleteType },
  });
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

export const getOnlineUsers = async (): Promise<{ success: boolean; onlineUserIds: (string | number)[] }> => {
  const res = await apiClient.get('/chat/online-users');
  return res.data;
};
