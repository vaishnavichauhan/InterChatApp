// ── Local Development URL (Commented Out) ──────────────────────────────────
// const CUSTOM_HOST_IP: string | null = '192.168.1.14';
// const PORT = 5005;
// const getHost = () => {
//   if (CUSTOM_HOST_IP) {
//     return CUSTOM_HOST_IP;
//   }
//   if (Platform.OS === 'android') {
//     return '10.0.2.2';
//   }
//   return 'localhost';
// };
// export const HOST = getHost();
// export const BASE_SERVER_URL = `http://${HOST}:${PORT}`;
// export const API_BASE_URL = `${BASE_SERVER_URL}/api`;
// export const SOCKET_URL = BASE_SERVER_URL;

// ── Live Production URL ───────────────────────────────────────────────────
export const HOST = 'interchat.jeenweb.com';
export const BASE_SERVER_URL = `http://${HOST}`;
export const API_BASE_URL = `${BASE_SERVER_URL}/api`; // http://interchat.jeenweb.com/api
export const SOCKET_URL = BASE_SERVER_URL;

export const resolveFileUrl = (url?: string | null): string => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:') || url.startsWith('file://')) {
    return url;
  }
  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  return `${BASE_SERVER_URL}${cleanPath}`;
};
