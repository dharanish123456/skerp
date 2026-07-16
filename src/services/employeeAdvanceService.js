import api from '../config/api';

export const fetchEmployeeAdvances = async (filters = {}) => {
  try {
    const response = await api.get('/employee-advances', { params: filters });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch employee advances');
  }
};

export const createEmployeeAdvance = async (payload) => {
  try {
    const response = await api.post('/employee-advances', payload);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to create employee advance');
  }
};

export const updateEmployeeAdvance = async (id, payload) => {
  try {
    const response = await api.put(`/employee-advances/${id}`, payload);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to update employee advance');
  }
};

export const deleteEmployeeAdvance = async (id) => {
  try {
    await api.delete(`/employee-advances/${id}`);
    return true;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to delete employee advance');
  }
};

export const fetchAdvanceSummary = async (filters = {}) => {
  try {
    const response = await api.get('/employee-advances/summary', { params: filters });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch advance summary');
  }
};

export const fetchEmployees = async () => {
  try {
    const response = await api.get('/employees');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch employees');
  }
};

// Dummy exports to prevent errors from cached legacy page versions in the browser
export const addAdvanceRecovery = async () => {};
export const fetchAdvanceLedger = async () => {};
