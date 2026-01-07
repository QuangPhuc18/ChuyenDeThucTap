import axios from 'axios';

let inMemoryToken = null;

export const setAuthToken = (token) => {
  inMemoryToken = token || null;
  if (typeof window !== 'undefined') {
    if (token) {
      localStorage.setItem('authToken', token);
    } else {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
    }
  }
};

const httpAxios = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000/api',
  timeout: 20000,
  withCredentials: false, // bật true nếu bạn dùng cookie session / sanctum
  headers: {
    Accept: 'application/json',
  },
});

// Request interceptor: attach Bearer token
httpAxios.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('authToken');
      const token = inMemoryToken || stored;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: return full response; handle 401 by clearing token
httpAxios.interceptors.response.use(
  (response) => response, // giữ nguyên response để bên service tùy ý normalize
  (error) => {
    if (error?.response?.status === 401 && typeof window !== 'undefined') {
      setAuthToken(null);
      // Không redirect ngay ở interceptor để tránh vòng lặp; để page tự xử lý.
    }
    return Promise.reject(error);
  }
);

export default httpAxios;