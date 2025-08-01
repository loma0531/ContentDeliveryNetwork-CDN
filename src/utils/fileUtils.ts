import fs from 'fs/promises';
import path from 'path';

export const getUserUploadDir = (userId: unknown): string => {
  return path.join(process.cwd(), 'src', 'uploads', String(userId));
};


export const ensureUploadDir = async (userId: string): Promise<void> => {
  const uploadDir = getUserUploadDir(userId);
  try {
    await fs.access(uploadDir);
  } catch {
    await fs.mkdir(uploadDir, { recursive: true });
  }
};

export const getFileExtension = (filename: string): string => {
  return path.extname(filename).toLowerCase();
};

export const generateUniqueFilename = (originalName: string): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const extension = getFileExtension(originalName);
  const nameWithoutExt = path.basename(originalName, extension);
  return `${nameWithoutExt}_${timestamp}_${random}${extension}`;
};

export const isImageFile = (mimeType: string): boolean => {
  return mimeType.startsWith('image/');
};

export const getPublicFileUrl = (userId: string, filename: string): string => {
  const baseUrl = process.env.CDN_BASE_URL || 'http://localhost:3000';
  // Encode the filename (which is the relative path) to handle slashes and special characters
  const encodedFilename = encodeURIComponent(filename);
  return `${baseUrl}/api/files/public/${userId}/${encodedFilename}`;
};

export const validateFileSize = (size: number, maxSizeMB = 100): boolean => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024; // Convert MB to bytes
  return size <= maxSizeBytes;
};

export const validateFileType = (mimeType: string, allowedTypes?: string[]): boolean => {
  if (!allowedTypes) {
    // Default allowed types
    const defaultAllowed = [
      'image/', 'video/', 'audio/', 'application/pdf',
      'text/', 'application/zip', 'application/x-zip-compressed',
      'application/msword', 'application/vnd.openxmlformats-officedocument'
    ];
    return defaultAllowed.some(type => mimeType.startsWith(type));
  }
  return allowedTypes.includes(mimeType);
};
