import apiClient from './client';

export interface Department {
  id: number;
  department_name: string;
  description?: string;
  status: 'ACTIVE' | 'INACTIVE';
  company_id?: number | null;
  company_name?: string;
  member_count?: number;
  admin_count?: number;
  created_at?: string;
  updated_at?: string;
}

export const getDepartments = async (includeInactive = true, companyId?: number | string) => {
  let url = `/admin/departments?includeInactive=${includeInactive}`;
  if (companyId && companyId !== 'all') {
    url += `&companyId=${companyId}`;
  }
  const res = await apiClient.get(url);
  return res.data;
};

export const getDepartmentById = async (id: number | string) => {
  const res = await apiClient.get(`/admin/departments/${id}`);
  return res.data;
};

export const createDepartment = async (departmentData: {
  department_name: string;
  description?: string;
  status?: string;
  company_id?: number | string | null;
}) => {
  const res = await apiClient.post('/admin/departments', departmentData);
  return res.data;
};

export const updateDepartment = async (id: number | string, departmentData: any) => {
  const res = await apiClient.put(`/admin/departments/${id}`, departmentData);
  return res.data;
};

export const deleteDepartment = async (id: number | string) => {
  const res = await apiClient.delete(`/admin/departments/${id}`);
  return res.data;
};

export const toggleDepartmentStatus = async (id: number | string, status: boolean | string) => {
  const res = await apiClient.patch(`/admin/departments/${id}/status`, { status });
  return res.data;
};

export const getDepartmentMembers = async (id: number | string) => {
  const res = await apiClient.get(`/admin/departments/${id}/members`);
  return res.data;
};

export const assignUserDepartments = async (userId: number | string, departments: any[]) => {
  const res = await apiClient.post(`/admin/departments/user/${userId}/assign`, { departments });
  return res.data;
};
