import { api } from './api';

export const authService = {
  login: async (credentials: any) => {
    const response = await api.post('/login', credentials);
    if (response.data.access_token) {
      localStorage.setItem('token', response.data.access_token);
    }
    return response.data;
  },

  createUser: async (user: any) => {
    const response = await api.post('/create-user', user);
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await api.get('/me');
    return response.data;
  },

  getUsers: async () => {
    const response = await api.get('/users');
    return response.data;
  },

  updateUser: async (id: number, data: any) => {
    const response = await api.put(`/users/${id}`, data);
    return response.data;
  },

  deleteUser: async (id: number) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
  },

  getToken: () => {
    return localStorage.getItem('token');
  }
};
