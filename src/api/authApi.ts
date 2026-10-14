import apiClient from './client';

export interface LoginPayload {
  username: string;
  password: string;
  deviceId?: string;
}

export interface DeviceRegistrationPayload {
  username: string;
  password: string;
  deviceId: string;
}

export const loginUser = async (data: LoginPayload) => {
  return apiClient.post('/auth/login', data);
};

export const requestDeviceRegistration = async (data: DeviceRegistrationPayload) => {
  return apiClient.post('/auth/request-device', data);
};

export interface ChangeFirstPasswordPayload {
  newPassword: string;
  confirmPassword: string;
}

export const logoutUser = async (data?: { deviceId?: string; userId?: number }) => {
  return apiClient.post('/auth/logout', data || {});
};

export const changeFirstPassword = async (data: ChangeFirstPasswordPayload) => {
  return apiClient.post('/auth/change-first-password', data);
};

export const getMyPermissions = async () => {
  return apiClient.get('/auth/my-permissions');
};

export const updateProfile = async (data: { name: string; email: string; mob_no: string }) => {
  return apiClient.put('/auth/update-profile', data);
};
