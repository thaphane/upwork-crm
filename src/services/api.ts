import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
  baseURL: '/api',  // This will be proxied through Nginx
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to add the auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth API
export const auth = {
  login: (email: string, password: string) => 
    api.post('/auth/login', { email, password }),
  register: (userData: any) => 
    api.post('/auth/register', userData),
  getProfile: () => 
    api.get('/auth/profile'),
};

// Products API
export const products = {
  getAll: () => 
    api.get('/products'),
  getOne: (id: string) => 
    api.get(`/products/${id}`),
  create: (data: any) => 
    api.post('/products', data),
  update: (id: string, data: any) => 
    api.put(`/products/${id}`, data),
  delete: (id: string) => 
    api.delete(`/products/${id}`),
  generateQR: (id: string) => 
    api.get(`/products/${id}/qr`),
  logScan: (id: string, data: any) => 
    api.post(`/products/scan/${id}`, data),
};

// Leads API
export const leads = {
  getAll: () => 
    api.get('/leads'),
  create: (data: any) => 
    api.post('/leads', data),
  update: (id: string, data: any) => 
    api.put(`/leads/${id}`, data),
  delete: (id: string) => 
    api.delete(`/leads/${id}`),
};

// Customers API
export const customers = {
  getAll: () => 
    api.get('/customers'),
  create: (data: any) => 
    api.post('/customers', data),
  update: (id: string, data: any) => 
    api.put(`/customers/${id}`, data),
  delete: (id: string) => 
    api.delete(`/customers/${id}`),
  addNote: (id: string, note: string) => 
    api.post(`/customers/${id}/notes`, { content: note }),
};

// Dashboard API
export const dashboard = {
  getStats: () => 
    api.get('/dashboard/stats'),
  getCharts: () => 
    api.get('/dashboard/charts'),
};

// Analytics API
export const analytics = {
  getAll: () => 
    api.get('/analytics'),
};

export default api; 