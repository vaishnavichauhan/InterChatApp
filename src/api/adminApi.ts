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
