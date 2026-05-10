import { useUIStore, getCurrentUser } from './store';

export { getCurrentUser };

export function useAuth() {
  const isAuthenticated = useUIStore((state) => state.isAuthenticated);
  const login = useUIStore((state) => state.login);
  const logout = useUIStore((state) => state.logout);

  return {
    user: getCurrentUser(),
    isAuthenticated,
    login: async (username: string, password: string) => {
      return login(username, 'auth-user');
    },
    logout,
  };
}