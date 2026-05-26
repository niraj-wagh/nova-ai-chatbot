import { create } from 'zustand';
import { authAPI } from '../utils/api';
import { connectSocket, disconnectSocket } from '../services/socket';

const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  isLoading: false,
  isInitialized: false,

  initialize: async () => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        set({ token, user });
        connectSocket(token);
        // Verify token is still valid
        const data = await authAPI.getMe();
        set({ user: data.user, isInitialized: true });
      } catch {
        get().logout();
        set({ isInitialized: true });
      }
    } else {
      set({ isInitialized: true });
    }
  },

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const data = await authAPI.login({ email, password });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      connectSocket(data.token);
      set({ user: data.user, token: data.token, isLoading: false });
      return { success: true };
    } catch (error) {
      set({ isLoading: false });
      return { success: false, message: error.message };
    }
  },

  register: async (username, email, password) => {
    set({ isLoading: true });
    try {
      const data = await authAPI.register({ username, email, password });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      connectSocket(data.token);
      set({ user: data.user, token: data.token, isLoading: false });
      return { success: true };
    } catch (error) {
      set({ isLoading: false });
      return { success: false, message: error.message };
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    disconnectSocket();
    set({ user: null, token: null });
  },

  updatePreferences: async (prefs) => {
    try {
      const data = await authAPI.updatePreferences(prefs);
      const updatedUser = { ...get().user, preferences: data.user.preferences };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      set({ user: updatedUser });
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  },
}));

export default useAuthStore;
