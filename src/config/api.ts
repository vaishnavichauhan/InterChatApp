
//-local run URl---------------------------------

// const PORT = 5005;
// export const HOST = `192.168.1.14:${PORT}`; //10.0.2.2:
// export const BASE_SERVER_URL = `http://${HOST}`;

// ── Live Production URL ───────────────────────────────────────────────────
export const HOST = 'interchat.epoxyhouse.in';
export const BASE_SERVER_URL = `https://${HOST}`;

///
export const API_BASE_URL = `${BASE_SERVER_URL}/api`; // https://interchat.epoxyhouse.in/api
export const SOCKET_URL = BASE_SERVER_URL;

export const resolveFileUrl = (url?: string | null): string => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:') || url.startsWith('file://')) {
    return url;
  }
  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  return `${BASE_SERVER_URL}${cleanPath}`;
};
