import api from '../config/api';

export const getRoles = async () => {
  try {
    const response = await api.get('/admin/roles');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch roles');
  }
};

export const getRole = async (id) => {
  try {
    const response = await api.get(`/admin/roles/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch role details');
  }
};

export const createRole = async (roleData) => {
  try {
    const response = await api.post('/admin/roles', roleData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to create role');
  }
};

export const updateRole = async (id, roleData) => {
  try {
    const response = await api.put(`/admin/roles/${id}`, roleData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to update role');
  }
};

export const updateRolePermissions = async (id, permissionIds) => {
  try {
    const response = await api.put(`/admin/roles/${id}/permissions`, { permissionIds });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to update role permissions');
  }
};

export const deleteRole = async (id) => {
  try {
    await api.delete(`/admin/roles/${id}`);
    return true;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to delete role');
  }
};

export const getPermissions = async () => {
  try {
    const response = await api.get('/admin/permissions');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch permissions');
  }
};
