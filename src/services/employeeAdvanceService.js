import { API_BASE_URL } from '../config/api';

export const fetchEmployeeAdvances = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.employeeId) params.append('employeeId', filters.employeeId);
  if (filters.startDate) params.append('startDate', filters.startDate);
  if (filters.endDate) params.append('endDate', filters.endDate);

  const response = await fetch(`${API_BASE_URL}/employee-advances?${params.toString()}`);
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || 'Failed to fetch employee advances');
  }
  return response.json();
};

export const createEmployeeAdvance = async (payload) => {
  const response = await fetch(`${API_BASE_URL}/employee-advances`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || 'Failed to create employee advance');
  }
  return response.json();
};

export const updateEmployeeAdvance = async (id, payload) => {
  const response = await fetch(`${API_BASE_URL}/employee-advances/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || 'Failed to update employee advance');
  }
  return response.json();
};

export const deleteEmployeeAdvance = async (id) => {
  const response = await fetch(`${API_BASE_URL}/employee-advances/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || 'Failed to delete employee advance');
  }
  return true;
};

export const fetchAdvanceSummary = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.startDate) params.append('startDate', filters.startDate);
  if (filters.endDate) params.append('endDate', filters.endDate);

  const response = await fetch(`${API_BASE_URL}/employee-advances/summary?${params.toString()}`);
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || 'Failed to fetch advance summary');
  }
  return response.json();
};

export const fetchEmployees = async () => {
  const response = await fetch(`${API_BASE_URL}/employees`);
  if (!response.ok) {
    throw new Error('Failed to fetch employees');
  }
  return response.json();
};

// Dummy exports to prevent errors from cached legacy page versions in the browser
export const addAdvanceRecovery = async () => {};
export const fetchAdvanceLedger = async () => {};
