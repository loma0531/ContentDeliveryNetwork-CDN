// Define the shared FileItem interface
export interface FileItem {
  id: string; // Keep ID for potential future database operations
  name: string;
  originalName?: string;
  type: 'file' | 'folder';
  size: number;
  mimeType?: string;
  parentId?: string; // This might be the parent's ID or path depending on backend
  publicUrl?: string;
  downloadCount?: number;
  createdAt: string; // Assuming date is returned as string from API
  path: string; // Path relative to user's root directory (e.g., 'folder1/subfolderA')
}