import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../lib/api';

const AUTH_QUERY_KEY = ['auth'];

export const getStoredUser = () => {
  const stored = localStorage.getItem('user');
  return stored ? JSON.parse(stored) : null;
};

export const isAuthenticated = () => {
  const token = localStorage.getItem('authToken');
  return !!token;
};

export const useLoginMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (credentials) => {
      const response = await apiClient.post('/auth/login', credentials);
      const { token, refreshToken, data } = response.data;

      localStorage.setItem('authToken', token);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(data.user));

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY });
    },
  });
};

export const useRegisterMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userData) => {
      const response = await apiClient.post('/auth/register', userData);
      const { token, refreshToken, data } = response.data;

      localStorage.setItem('authToken', token);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(data.user));

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY });
    },
  });
};

export const useLogoutMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      try {
        await apiClient.post('/auth/logout');
      } catch (error) {
        console.warn('Logout API call failed, continuing with local logout');
      }

      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');

      return true;
    },
    onSuccess: () => {
      queryClient.clear();
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY });
    },
  });
};

export const useGetMeQuery = () => {
  return useQuery({
    queryKey: [...AUTH_QUERY_KEY, 'me'],
    queryFn: async () => {
      const storedUser = localStorage.getItem('user');
      const token = localStorage.getItem('authToken');

      if (!token || !storedUser) {
        return null;
      }

      try {
        const response = await apiClient.get('/auth/me');
        const user = response.data.data;
        localStorage.setItem('user', JSON.stringify(user));
        return user;
      } catch (error) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        return null;
      }
    },
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60,
    retry: false,
  });
};

export const useRefreshTokenMutation = () => {
  return useMutation({
    mutationFn: async () => {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await apiClient.post('/auth/refresh-token', { refreshToken });
      const { token, refreshToken: newRefreshToken, data } = response.data;

      localStorage.setItem('authToken', token);
      localStorage.setItem('refreshToken', newRefreshToken);
      localStorage.setItem('user', JSON.stringify(data.user));

      return response.data;
    },
  });
};
