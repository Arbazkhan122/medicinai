import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { StorageOption } from '../services/storage/storageManager';

interface AuthUser {
  id: string;
  email: string;
  name?: string;
  storagePreferences: StorageOption[];
  encryptionKeyHash: string;
}

interface AuthStore {
  // Authentication state
  user: AuthUser | null;
  encryptionKey: string | null;
  isAuthenticated: boolean;
  
  // Actions
  setUser: (user: AuthUser | null) => void;
  setEncryptionKey: (key: string | null) => void;
  logout: () => void;
  
  // Storage management
  updateStoragePreferences: (preferences: StorageOption[]) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      encryptionKey: null,
      isAuthenticated: false,

      // Actions
      setUser: (user) => set({ 
        user, 
        isAuthenticated: !!user 
      }),

      setEncryptionKey: (key) => set({ encryptionKey: key }),

      logout: () => set({ 
        user: null, 
        encryptionKey: null, 
        isAuthenticated: false 
      }),

      updateStoragePreferences: (preferences) => {
        const { user } = get();
        if (user) {
          set({
            user: {
              ...user,
              storagePreferences: preferences
            }
          });
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated
        // Note: We don't persist encryptionKey for security
      })
    }
  )
);