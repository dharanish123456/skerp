import api from '../config/api';

const message = (error, fallback) => error.response?.data?.message || fallback;

export const fetchAttendance = async (filters = {}) => {
  try {
    const response = await api.get('/attendance', { params: filters });
    return response.data;
  } catch (error) {
    throw new Error(message(error, 'Failed to load attendance'), { cause: error });
  }
};

export const fetchAttendanceSummary = async (filters = {}) => {
  try {
    const response = await api.get('/attendance/summary', { params: filters });
    return response.data;
  } catch (error) {
    throw new Error(message(error, 'Failed to load attendance summary'), { cause: error });
  }
};

export const createAttendance = async (payload) => {
  try {
    const response = await api.post('/attendance', payload);
    return response.data;
  } catch (error) {
    throw new Error(message(error, 'Failed to create attendance'), { cause: error });
  }
};

export const updateAttendance = async (id, payload) => {
  try {
    const response = await api.put(`/attendance/${id}`, payload);
    return response.data;
  } catch (error) {
    throw new Error(message(error, 'Failed to update attendance'), { cause: error });
  }
};

export const deleteAttendance = async (id) => {
  try {
    await api.delete(`/attendance/${id}`);
  } catch (error) {
    throw new Error(message(error, 'Failed to delete attendance'), { cause: error });
  }
};

export const fetchTodayAttendance = async () => {
  try {
    const response = await api.get('/attendance/my/today');
    return response.data;
  } catch (error) {
    throw new Error(message(error, 'Failed to load today’s attendance'), { cause: error });
  }
};

export const checkIn = async (payload) => {
  try {
    let body = null;
    const headers = {};
    if (payload && (payload.selfieBlob || payload.latitude || payload.longitude)) {
      body = new FormData();
      if (payload.selfieBlob) body.append('selfie', payload.selfieBlob, 'selfie.jpg');
      if (payload.latitude !== undefined && payload.latitude !== null) body.append('latitude', payload.latitude);
      if (payload.longitude !== undefined && payload.longitude !== null) body.append('longitude', payload.longitude);
      headers['Content-Type'] = 'multipart/form-data';
    }
    const response = await api.post('/attendance/my/check-in', body, { headers });
    return response.data;
  } catch (error) {
    throw new Error(message(error, 'Unable to check in'), { cause: error });
  }
};

export const checkOut = async (payload) => {
  try {
    let body = null;
    const headers = {};
    if (payload && (payload.selfieBlob || payload.latitude || payload.longitude)) {
      body = new FormData();
      if (payload.selfieBlob) body.append('selfie', payload.selfieBlob, 'selfie.jpg');
      if (payload.latitude !== undefined && payload.latitude !== null) body.append('latitude', payload.latitude);
      if (payload.longitude !== undefined && payload.longitude !== null) body.append('longitude', payload.longitude);
      headers['Content-Type'] = 'multipart/form-data';
    }
    const response = await api.post('/attendance/my/check-out', body, { headers });
    return response.data;
  } catch (error) {
    throw new Error(message(error, 'Unable to check out'), { cause: error });
  }
};
