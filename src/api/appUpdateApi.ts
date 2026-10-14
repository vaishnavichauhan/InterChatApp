import axios from 'axios';
import { Linking, Alert, Platform, ToastAndroid } from 'react-native';
import apiClient from './client';
import { BASE_SERVER_URL } from '../config/api';

/**
 * Current App Version as defined in requirements
 */
export const CURRENT_APP_VERSION = '01.14.10';

/**
 * Export a helper function returning the current app version
 */
export const getAppVersion = (): string => {
  return CURRENT_APP_VERSION;
};

export interface AppUpdateResponse {
  success: boolean;
  currentVersion?: string;
  latestVersion?: string;
  updateRequired: boolean;
  apkAvailable?: boolean;
  downloadUrl?: string;
  message?: string;
  fileSize?: number;
  lastModified?: string;
}

/**
 * Normalizes version strings for consistent comparison (e.g. '01.00.00' vs 'v1.0.0')
 */
export const normalizeVersion = (v?: string | null): string => {
  if (!v) return '';
  return String(v).trim().toLowerCase().replace(/^v/, '');
};

/**
 * Returns true if the latest version differs from the current version
 */
export const isUpdateNeeded = (
  current: string = CURRENT_APP_VERSION,
  latest?: string | null
): boolean => {
  if (!latest || String(latest).trim() === '') return false;
  return normalizeVersion(current) !== normalizeVersion(latest);
};

/**
 * Resolves the full URL for APK downloading or Play Store redirection.
 * Handles full URLs, relative paths, and domains without explicit http/https.
 */
export const getFullDownloadUrl = (downloadUrl?: string): string => {
  if (!downloadUrl || downloadUrl === '[REPLACE_WITH_YOUR_APK_URL]') {
    return `${BASE_SERVER_URL}/api/app/download`;
  }

  const trimmed = downloadUrl.trim();

  // If already full protocol
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('market://')
  ) {
    return trimmed;
  }

  // If domain string without scheme (e.g. "interchat.epoxyhouse.in/apk/app-release.apk")
  if (/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(\/.*)?$/.test(trimmed)) {
    return `https://${trimmed}`;
  }

  const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${BASE_SERVER_URL}${cleanPath}`;
};

/**
 * Call the existing update endpoint: GET /app/check-update?version=${CURRENT_APP_VERSION}
 * With automatic fallback candidates if primary endpoint returns 404 or fails.
 */
export const checkAppUpdateApi = async (
  version: string = CURRENT_APP_VERSION
): Promise<AppUpdateResponse> => {
  let responseData: any = null;

  // 1. Primary Attempt: Standard apiClient (uses baseURL from config/api)
  try {
    const response = await apiClient.get<AppUpdateResponse>('/app/check-update', {
      params: { version },
      timeout: 8000,
    });
    if (response?.data?.success) {
      responseData = response.data;
    }
  } catch (apiErr: any) {
    console.warn('[checkAppUpdateApi] Primary apiClient request failed:', apiErr?.message);
  }

  // 2. Candidate Fallback Attempt (useful when developing on local machine / emulator)
  if (!responseData) {
    const fallbackCandidates = [
      'http://10.128.21.185:5005/api/app/check-update',
      'http://10.0.2.2:5005/api/app/check-update',
      'http://localhost:5005/api/app/check-update',
      'https://interchat.epoxyhouse.in/api/app/check-update',
    ];

    for (const fallbackUrl of fallbackCandidates) {
      try {
        const fallbackRes = await axios.get<AppUpdateResponse>(fallbackUrl, {
          params: { version },
          timeout: 4000,
        });
        if (fallbackRes?.data?.success) {
          console.log(`[checkAppUpdateApi] Successfully reached candidate: ${fallbackUrl}`);
          responseData = fallbackRes.data;
          break;
        }
      } catch {
        // Try next fallback candidate
      }
    }
  }

  if (!responseData) {
    throw new Error('Unable to connect to update server. Please check your network connection.');
  }

  const data: AppUpdateResponse = responseData;
  const isDifferent = isUpdateNeeded(version, data.latestVersion);
  const updateRequired = Boolean(data.updateRequired || isDifferent);

  const hasValidUrl =
    Boolean(data.downloadUrl) &&
    data.downloadUrl !== '[REPLACE_WITH_YOUR_APK_URL]' &&
    String(data.downloadUrl).trim() !== '';

  const apkAvailable =
    data.apkAvailable !== undefined ? Boolean(data.apkAvailable) : hasValidUrl;

  return {
    ...data,
    currentVersion: data.currentVersion || version,
    updateRequired,
    apkAvailable,
  };
};

/**
 * Implement triggerApkDownload(downloadUrl, apkAvailable, latestVersion)
 * using React Native Linking.openURL() to open the download link in the device browser.
 * Show Toast/Alert if the download is unavailable or fails.
 */
export const triggerApkDownload = async (
  downloadUrl?: string,
  apkAvailable: boolean = true,
  latestVersion?: string
): Promise<void> => {
  try {
    if (apkAvailable === false || downloadUrl === '[REPLACE_WITH_YOUR_APK_URL]') {
      Alert.alert(
        'Update Unavailable',
        `The latest build (v${latestVersion || 'latest'}) is currently not available for download on the server. Please try again later or contact support.`
      );
      return;
    }

    const fullUrl = getFullDownloadUrl(downloadUrl);
    console.log(`[triggerApkDownload] Triggering download for v${latestVersion || 'latest'} from:`, fullUrl);

    if (Platform.OS === 'android') {
      ToastAndroid.show('Opening download in browser...', ToastAndroid.SHORT);
    }

    const supported = await Linking.canOpenURL(fullUrl).catch(() => true);
    if (supported) {
      await Linking.openURL(fullUrl);
    } else {
      await Linking.openURL(fullUrl);
    }
  } catch (err: any) {
    console.warn('[triggerApkDownload] Open URL error:', err);
    Alert.alert(
      'Download Error',
      err?.message || 'Unable to open download URL in browser. Please check your internet connection.'
    );
  }
};
