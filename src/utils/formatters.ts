export const formatTimestamp = (dateStr?: string | null): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';

  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: 'short' });
  } else {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
};

export const formatMessageTime = (dateStr?: string | null): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const formatFileSize = (bytes?: number): string => {
  if (!bytes || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
};

export const getInitials = (name?: string | null): string => {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

export type FileCategory = 'image' | 'video' | 'audio' | 'pdf' | 'word' | 'excel' | 'powerpoint' | 'text' | 'unknown';

export const getFileCategory = (filename?: string | null, mimeType?: string | null): FileCategory => {
  const ext = (filename?.split('.').pop() || '').toLowerCase();
  const mime = (mimeType || '').toLowerCase();

  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext) || mime.startsWith('image/')) {
    return 'image';
  }
  if (['mp4', 'mov', 'webm', 'mkv', 'avi'].includes(ext) || mime.startsWith('video/')) {
    return 'video';
  }
  if (['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac'].includes(ext) || mime.startsWith('audio/')) {
    return 'audio';
  }
  if (ext === 'pdf' || mime === 'application/pdf') {
    return 'pdf';
  }
  if (['docx', 'doc'].includes(ext) || mime.includes('word')) {
    return 'word';
  }
  if (['xlsx', 'xls', 'csv'].includes(ext) || mime.includes('spreadsheet') || mime.includes('excel')) {
    return 'excel';
  }
  if (['pptx', 'ppt'].includes(ext) || mime.includes('presentation') || mime.includes('powerpoint')) {
    return 'powerpoint';
  }
  if (['txt', 'json', 'log', 'md', 'js', 'ts', 'html', 'css'].includes(ext) || mime.startsWith('text/')) {
    return 'text';
  }
  return 'unknown';
};
