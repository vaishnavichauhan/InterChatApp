import apiClient from './client';

export interface Company {
  id: number;
  company_name: string;
  name?: string;
  company_code?: string;
  legal_name?: string;
  tax_id?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  logo_url?: string;
  industry?: string;
  description?: string;
  is_main?: boolean;
  status: 'ACTIVE' | 'INACTIVE';
  department_count?: number;
  user_count?: number;
  created_at?: string;
  updated_at?: string;
  departments?: any[];
}

export const getCompanies = async (includeInactive = true, search = '') => {
  const params = new URLSearchParams();
  if (!includeInactive) params.append('includeInactive', 'false');
  if (search) params.append('search', search);
  const queryStr = params.toString() ? `?${params.toString()}` : '';
  const res = await apiClient.get(`/admin/companies${queryStr}`);
  return res.data;
};

export const getCompanyById = async (id: number | string) => {
  const res = await apiClient.get(`/admin/companies/${id}`);
  return res.data;
};

export const createCompany = async (companyData: Partial<Company>) => {
  const res = await apiClient.post('/admin/companies', companyData);
  return res.data;
};

export const updateCompany = async (id: number | string, companyData: Partial<Company>) => {
  const res = await apiClient.put(`/admin/companies/${id}`, companyData);
  return res.data;
};

export const deleteCompany = async (id: number | string) => {
  const res = await apiClient.delete(`/admin/companies/${id}`);
  return res.data;
};

export const toggleCompanyStatus = async (id: number | string, status: string | boolean) => {
  const res = await apiClient.patch(`/admin/companies/${id}/status`, { status });
  return res.data;
};
