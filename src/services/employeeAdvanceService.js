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

export const fetchMyAdvances = async () => {
  try {
    const response = await api.get('/employee-advances/my-advances');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch your advances');
  }
};

export const createMyAdvanceRequest = async (payload) => {
  try {
    const response = await api.post('/employee-advances/my-request', payload);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to submit advance request');
  }
};

export const cancelMyAdvance = async (id) => {
  try {
    const response = await api.put(`/employee-advances/my-advances/${id}/cancel`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to cancel advance request');
  }
};

export const approveAdvance = async (id, payload) => {
  try {
    const response = await api.put(`/employee-advances/${id}/approve`, payload);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to approve advance request');
  }
};

export const rejectAdvance = async (id, payload) => {
  try {
    const response = await api.put(`/employee-advances/${id}/reject`, payload);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to reject advance request');
  }
};

// Dummy exports to prevent errors from cached legacy page versions in the browser
export const addAdvanceRecovery = async () => {};
export const fetchAdvanceLedger = async () => {};
