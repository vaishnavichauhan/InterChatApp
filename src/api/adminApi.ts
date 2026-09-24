import apiClient from './client';

export const getDashboardStats = async () => {
  return apiClient.get('/admin/dashboard-stats');
};

export const getAllUsers = async (includeInactive = false) => {
  return apiClient.get(`/admin/users${includeInactive ? '?includeInactive=true' : ''}`);
};

export const toggleUserActive = async (id: number, active: boolean) => {
  return apiClient.patch(`/admin/user/${id}/toggle-active`, { active });
};

export const getPendingDevices = async () => {
  return apiClient.get('/admin/pending-devices');
};

export const approveDevice = async (deviceRowId: number, allowDownload = true) => {
  return apiClient.put(`/admin/approve-device/${deviceRowId}`, { allowDownload });
};

export const revokeDevice = async (userId: number) => {
  return apiClient.put(`/admin/revoke-device/${userId}`);
};

export const fetchAuditLogs = async (userId: number | null = null) => {
  if (userId) {
    return apiClient.get(`/admin/audit-logs/${userId}`);
  }
  return apiClient.get('/admin/audit-logs');
};

export const updateUserByAdmin = async (id: number, data: any) => {
  return apiClient.put(`/admin/user/${id}`, data);
};

export const createUserByAdmin = async (data: any) => {
  return apiClient.post('/admin/create-user', data);
};

export const getUserTypes = async () => {
  return apiClient.get('/usertypes/all');
};

export const createUserType = async (data: any) => {
  return apiClient.post('/usertypes/add', data);
};

export const updateUserType = async (id: number, data: any) => {
  return apiClient.put(`/usertypes/update/${id}`, data);
};

export const deleteUserType = async (id: number) => {
  return apiClient.delete(`/usertypes/delete/${id}`);
};

export const getStorageConfig = async () => {
  return apiClient.get('/admin/storage-config');
};

export const saveStorageConfig = async (data: any) => {
  return apiClient.post('/admin/storage-config', data);
};

export const testStorageConnection = async (data: any) => {
  return apiClient.post('/admin/storage-config/test', data);
};
