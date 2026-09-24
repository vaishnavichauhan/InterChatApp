import { Platform } from 'react-native';

/**
 * Global API & Socket Configuration
 *
 * - Android Emulator uses 10.0.2.2 to access host machine localhost.
 * - iOS Simulator uses localhost or 127.0.0.1.
 * - For physical devices on Wi-Fi, change `CUSTOM_HOST_IP` to your local machine IP (e.g. '192.168.1.100').
 */
const CUSTOM_HOST_IP: string | null = null; // Set to e.g. '192.168.1.100' when testing on physical device

const PORT = 5005;

const getHost = () => {
  if (CUSTOM_HOST_IP) {
    return CUSTOM_HOST_IP;
  }
  if (Platform.OS === 'android') {
    return '10.0.2.2';
  }
  return 'localhost';
};

export const HOST = getHost();
export const BASE_SERVER_URL = `http://${HOST}:${PORT}`;
export const API_BASE_URL = `${BASE_SERVER_URL}/api`;
export const SOCKET_URL = BASE_SERVER_URL;

export const resolveFileUrl = (url?: string | null): string => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:') || url.startsWith('file://')) {
    return url;
  }
  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  return `${BASE_SERVER_URL}${cleanPath}`;
};
