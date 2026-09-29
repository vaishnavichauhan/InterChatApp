import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDeviceId } from '../utils/device';
import { getMyPermissions } from '../api/authApi';
import { getSocket, disconnectSocket } from '../utils/socket';

export interface User {
  id: number;
  name: string;
  username: string;
  email: string;
  role: 'admin' | 'user' | string;
  user_type_id?: number;
  user_type_name?: string;
  mob_no?: string | null;
  departments?: Array<{ department_id: number; department_name: string }>;
  department_ids?: number[];
  device_allow_download?: boolean;
}

export interface UserPermissions {
  canChat: boolean;
  canCamera: boolean;
  canView: boolean;
  canUpload: boolean;
  canDownload: boolean;
  canGroup: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  deviceId: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  permissions: UserPermissions;
  initialize: () => Promise<void>;
  login: (user: User, token: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (partialUser: Partial<User>) => Promise<void>;
  refreshPermissions: () => Promise<void>;
}

const defaultPermissions: UserPermissions = {
  canChat: true,
  canCamera: true,
  canView: true,
  canUpload: true,
  canDownload: false,
  canGroup: true,
};

export const isDeviceDownloadAllowed = (user: any): boolean => {
  if (!user) return false;
  if (
    user.device_allow_download === false ||
    user.device_allow_download === 0 ||
    user.device_allow_download === '0'
  ) {
    return false;
  }
  return true;
};

export const isUserAdminRole = (user: any): boolean => {
  if (!user) return false;
  const role = String(user.role || '').toLowerCase().trim();
  const typeName = String(user.user_type_name || user.typeName || '').toLowerCase().trim();
  return (
    ['admin', 'master_admin', 'super admin', 'administrator', 'super administrator', 'master'].includes(role) ||
    ['admin', 'master_admin', 'super admin', 'administrator', 'super administrator'].includes(typeName) ||
    user.username?.toLowerCase() === 'admin' ||
    Number(user.user_type_id) === 1 ||
    Number(user.role_id) === 1
  );
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  deviceId: null,
  isAuthenticated: false,
  isLoading: true,
  permissions: defaultPermissions,

  initialize: async () => {
    try {
      const deviceId = await getDeviceId();
      const storedToken = await AsyncStorage.getItem('token');
      const storedUserStr = await AsyncStorage.getItem('user');

      if (storedToken && storedUserStr) {
        const parsedUser = JSON.parse(storedUserStr) as User;
        const isAdmin = isUserAdminRole(parsedUser);
        const devAllowed = isDeviceDownloadAllowed(parsedUser);

        set({
          user: parsedUser,
          token: storedToken,
          deviceId,
          isAuthenticated: true,
          isLoading: false,
          permissions: {
            canChat: true,
            canCamera: true,
            canView: true,
            canUpload: true,
            canDownload: isAdmin && devAllowed,
            canGroup: true,
          },
        });

        // Connect socket for active user
        getSocket(parsedUser.id);

        // Fetch granular backend permissions in background
        get().refreshPermissions();
      } else {
        set({
          deviceId,
          isLoading: false,
          isAuthenticated: false,
          user: null,
          token: null,
        });
      }
    } catch (err) {
      console.warn('Failed to restore auth session', err);
      set({ isLoading: false, isAuthenticated: false });
    }
  },

  login: async (user: User, token: string) => {
    try {
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('user', JSON.stringify(user));

      const isAdmin = isUserAdminRole(user);
      const devAllowed = isDeviceDownloadAllowed(user);
      const deviceId = await getDeviceId();

      set({
        user,
        token,
        deviceId,
        isAuthenticated: true,
        permissions: {
          canChat: true,
          canCamera: true,
          canView: true,
          canUpload: true,
          canDownload: isAdmin && devAllowed,
          canGroup: true,
        },
      });

      // Connect socket
      getSocket(user.id);

      get().refreshPermissions();
    } catch (err) {
      console.error('Error during login store update:', err);
    }
  },

  logout: async () => {
    try {
      disconnectSocket();
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');

      set({
        user: null,
        token: null,
        isAuthenticated: false,
        permissions: defaultPermissions,
      });
    } catch (err) {
      console.error('Error during logout:', err);
    }
  },

  updateUser: async (partialUser: Partial<User>) => {
    const currentUser = get().user;
    if (!currentUser) return;
    const updated = { ...currentUser, ...partialUser };
    await AsyncStorage.setItem('user', JSON.stringify(updated));
    set({ user: updated });
  },

  refreshPermissions: async () => {
    const currentUser = get().user;
    if (!currentUser) return;

    const isAdmin = isUserAdminRole(currentUser);
    const devAllowed = isDeviceDownloadAllowed(currentUser);

    if (isAdmin) {
      set({
        permissions: {
          ...defaultPermissions,
          canDownload: devAllowed,
        },
      });
      return;
    }

    try {
      const res = await getMyPermissions();
      if (res.data?.success) {
        if (res.data.isAdmin) {
          set({
            permissions: {
              ...defaultPermissions,
              canDownload: devAllowed,
            },
          });
          return;
        }

        const perms = res.data.permissions;
        const hasPerm = (master: string, action: 'read' | 'write') => {
          if (!perms) return false;
          if (Array.isArray(perms)) {
            const match = perms.find((p: any) => p.master_name === master);
            if (!match) return false;
            return action === 'read' ? Boolean(match.can_read) : Boolean(match.can_write);
          } else if (typeof perms === 'object') {
            const p = perms[master];
            if (!p) return false;
            return action === 'read' ? Boolean(p.read) : Boolean(p.write);
          }
          return false;
        };

        const hasDownloadRole =
          Boolean(hasPerm('document_download', 'read') || hasPerm('document_download', 'write'));

        const canDownload = hasDownloadRole && devAllowed;

        set({
          permissions: {
            canChat: hasPerm('chat', 'write'),
            canCamera: hasPerm('camera_access', 'read') || hasPerm('camera_access', 'write'),
            canView: hasPerm('document_view', 'read') || hasPerm('document_view', 'write'),
            canUpload: hasPerm('document_upload', 'write'),
            canDownload,
            canGroup: hasPerm('group_create', 'write'),
          },
        });
      }
    } catch (err) {
      console.warn('Failed to fetch user permissions from server:', err);
    }
  },
}));
