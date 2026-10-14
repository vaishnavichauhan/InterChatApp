//-local run URl---------------------------------

// const PORT = 5005;
// export const HOST = `10.128.21.185:${PORT}`; // Local machine IP for physical device & emulator
// export const BASE_SERVER_URL = `http://${HOST}`;

// ── Live Production URL (Uncomment when deploying) ─────────────────────────
export const HOST = 'interchat.epoxyhouse.in';
export const BASE_SERVER_URL = `https://${HOST}`;

///
export const API_BASE_URL = `${BASE_SERVER_URL}/api`; // http://10.128.21.185:5005/api
export const SOCKET_URL = BASE_SERVER_URL;

export const resolveFileUrl = (url?: string | null): string => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:') || url.startsWith('file://')) {
    return url;
  }
  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  return `${BASE_SERVER_URL}${cleanPath}`;
};
