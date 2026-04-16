import { useState, useCallback, useEffect } from 'react';
import { authService } from '../services/auth';
import { useNavigate } from 'react-router-dom';

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!authService.getToken());
  const [user, setUser] = useState<{ id: number; email: string; username?: string; role?: string } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && !user) {
      authService.getCurrentUser()
        .then(setUser)
        .catch(() => {
          authService.logout();
          setIsAuthenticated(false);
          setUser(null);
          navigate('/login');
        });
    }
  }, [isAuthenticated, user, navigate]);

  const login = useCallback(async (credentials: any) => {
    try {
      await authService.login(credentials);
      setIsAuthenticated(true);
      navigate('/');
      return true;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }, [navigate]);

  const logout = useCallback(() => {
    authService.logout();
    setIsAuthenticated(false);
    setUser(null);
    navigate('/login');
  }, [navigate]);

  return {
    isAuthenticated,
    user,
    login,
    logout,
    getToken: authService.getToken
  };
};
