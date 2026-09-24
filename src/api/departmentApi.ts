import apiClient from './client';

export const getDepartments = async (includeInactive = true) => {
  const res = await apiClient.get(`/admin/departments?includeInactive=${includeInactive}`);
  return res.data;
};

export const getDepartmentById = async (id: number) => {
  const res = await apiClient.get(`/admin/departments/${id}`);
  return res.data;
};

export const createDepartment = async (departmentData: { department_name: string; description?: string }) => {
  const res = await apiClient.post('/admin/departments', departmentData);
  return res.data;
};

export const updateDepartment = async (id: number, departmentData: any) => {
  const res = await apiClient.put(`/admin/departments/${id}`, departmentData);
  return res.data;
};

export const deleteDepartment = async (id: number) => {
  const res = await apiClient.delete(`/admin/departments/${id}`);
  return res.data;
};

export const toggleDepartmentStatus = async (id: number, status: boolean) => {
  const res = await apiClient.patch(`/admin/departments/${id}/status`, { status });
  return res.data;
};

export const getDepartmentMembers = async (id: number) => {
  const res = await apiClient.get(`/admin/departments/${id}/members`);
  return res.data;
};
