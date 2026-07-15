import { API_BASE_URL } from '../config/api';

export const getExpenses = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.startDate) params.append('startDate', filters.startDate);
  if (filters.endDate) params.append('endDate', filters.endDate);
  if (filters.categoryId) params.append('categoryId', filters.categoryId);

  const response = await fetch(`${API_BASE_URL}/expenses?${params.toString()}`);
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || 'Failed to fetch expenses');
  }
  return response.json();
};

export const addExpense = async (data) => {
  const response = await fetch(`${API_BASE_URL}/expenses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || 'Failed to add expense');
  }
  return response.json();
};

export const updateExpense = async (id, data) => {
  const response = await fetch(`${API_BASE_URL}/expenses/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || 'Failed to update expense');
  }
  return response.json();
};

export const deleteExpense = async (id) => {
  const response = await fetch(`${API_BASE_URL}/expenses/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || 'Failed to delete expense');
  }
  return true;
};

export const getExpenseSummary = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.startDate) params.append('startDate', filters.startDate);
  if (filters.endDate) params.append('endDate', filters.endDate);

  const response = await fetch(`${API_BASE_URL}/expenses/summary?${params.toString()}`);
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || 'Failed to fetch summary');
  }
  return response.json();
};

export const getCategories = async () => {
  const response = await fetch(`${API_BASE_URL}/expense-categories`);
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || 'Failed to fetch categories');
  }
  return response.json();
};

export const addCategory = async (data) => {
  const response = await fetch(`${API_BASE_URL}/expense-categories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || 'Failed to add category');
  }
  return response.json();
};

export const updateCategory = async (id, data) => {
  const response = await fetch(`${API_BASE_URL}/expense-categories/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || 'Failed to update category');
  }
  return response.json();
};

export const deleteCategory = async (id) => {
  const response = await fetch(`${API_BASE_URL}/expense-categories/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || 'Failed to delete category');
  }
  return true;
};
