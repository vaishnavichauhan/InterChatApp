import { create } from 'zustand';
import {
  checkAppUpdateApi,
  AppUpdateResponse,
  CURRENT_APP_VERSION,
  isUpdateNeeded,
} from '../api/appUpdateApi';

export interface AppUpdateState {
  currentVersion: string;
  updateInfo: AppUpdateResponse | null;
  checkingUpdate: boolean;
  hasUpdateAvailable: boolean;
  checkForUpdates: () => Promise<AppUpdateResponse | null>;
  resetUpdateState: () => void;
}

export const useAppUpdateStore = create<AppUpdateState>((set) => ({
  currentVersion: CURRENT_APP_VERSION,
  updateInfo: null,
  checkingUpdate: false,
  hasUpdateAvailable: false,

  checkForUpdates: async () => {
    try {
      set({ checkingUpdate: true });
      const res = await checkAppUpdateApi(CURRENT_APP_VERSION);
      const isAvailable = Boolean(
        res?.updateRequired ||
        (res?.latestVersion && isUpdateNeeded(CURRENT_APP_VERSION, res.latestVersion))
      );

      set({
        updateInfo: res,
        hasUpdateAvailable: isAvailable,
        checkingUpdate: false,
      });

      return res;
    } catch (err) {
      console.warn('[useAppUpdateStore] Error checking updates:', err);
      set({ checkingUpdate: false });
      return null;
    }
  },

  resetUpdateState: () => {
    set({
      updateInfo: null,
      checkingUpdate: false,
      hasUpdateAvailable: false,
    });
  },
}));
