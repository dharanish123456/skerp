import api from '../config/api';

export const getExpenses = async (filters = {}) => {
  try {
    const response = await api.get('/expenses', { params: filters });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch expenses');
  }
};

export const addExpense = async (data) => {
  try {
    const response = await api.post('/expenses', data);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to add expense');
  }
};

export const updateExpense = async (id, data) => {
  try {
    const response = await api.put(`/expenses/${id}`, data);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to update expense');
  }
};

export const deleteExpense = async (id) => {
  try {
    await api.delete(`/expenses/${id}`);
    return true;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to delete expense');
  }
};

export const getExpenseSummary = async (filters = {}) => {
  try {
    const response = await api.get('/expenses/summary', { params: filters });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch summary');
  }
};

export const getCategories = async () => {
  try {
    const response = await api.get('/expense-categories');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch categories');
  }
};

export const addCategory = async (data) => {
  try {
    const response = await api.post('/expense-categories', data);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to add category');
  }
};

export const updateCategory = async (id, data) => {
  try {
    const response = await api.put(`/expense-categories/${id}`, data);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to update category');
  }
};

export const deleteCategory = async (id) => {
  try {
    await api.delete(`/expense-categories/${id}`);
    return true;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to delete category');
  }
};
