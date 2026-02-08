export type PreviewType = 'image' | 'pdf' | 'video' | 'unsupported';

const IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg', 'ico'];
const PDF_EXTENSIONS = ['pdf'];
const VIDEO_EXTENSIONS = ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv'];

export function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
}

export function getPreviewType(filename: string): PreviewType {
  const ext = getFileExtension(filename);
  
  if (IMAGE_EXTENSIONS.includes(ext)) {
    return 'image';
  }
  if (PDF_EXTENSIONS.includes(ext)) {
    return 'pdf';
  }
  if (VIDEO_EXTENSIONS.includes(ext)) {
    return 'video';
  }
  return 'unsupported';
}

export function getMimeType(filename: string): string {
  const ext = getFileExtension(filename);
  
  // Image types
  if (ext === 'png') return 'image/png';
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
  if (ext === 'gif') return 'image/gif';
  if (ext === 'webp') return 'image/webp';
  if (ext === 'bmp') return 'image/bmp';
  if (ext === 'svg') return 'image/svg+xml';
  if (ext === 'ico') return 'image/x-icon';
  
  // PDF
  if (ext === 'pdf') return 'application/pdf';
  
  // Video types
  if (ext === 'mp4') return 'video/mp4';
  if (ext === 'webm') return 'video/webm';
  if (ext === 'ogg') return 'video/ogg';
  if (ext === 'mov') return 'video/quicktime';
  if (ext === 'avi') return 'video/x-msvideo';
  if (ext === 'mkv') return 'video/x-matroska';
  
  return 'application/octet-stream';
}

export function canPlayVideo(mimeType: string): boolean {
  const video = document.createElement('video');
  const canPlay = video.canPlayType(mimeType);
  return canPlay === 'probably' || canPlay === 'maybe';
}
