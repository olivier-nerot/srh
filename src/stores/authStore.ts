import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  firstname: string;
  lastname: string;
  infopro?: string;
  isadmin: boolean;
  newsletter: boolean;
  hospital?: string;
  address?: string;
  subscription?: string;
  avatar?: string;
  membershipNumber?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthStore extends AuthState {
  logout: () => void;
  setUser: (user: User) => void;
  clearUser: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      logout: () => {
        set({ 
          user: null, 
          isAuthenticated: false, 
          isLoading: false 
        });
      },

      setUser: (user: User) => {
        set({ 
          user, 
          isAuthenticated: true, 
          isLoading: false 
        });
      },

      clearUser: () => {
        set({ 
          user: null, 
          isAuthenticated: false, 
          isLoading: false 
        });
      }
    }),
    {
      name: 'srh-auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);