'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import {
  Upload,
  FolderPlus,
  LogOut,
  Moon,
  Sun,
  Settings,
  Search,
  Grid,
  List,
  Shield,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { FileUploadZone } from './FileUploadZone';
import { FileGrid } from './FileGrid';
import { Breadcrumb } from './Breadcrumb';
import { CreateFolderDialog } from './CreateFolderDialog';
import { AdminPanel } from './AdminPanel';
import { RenameDialog } from './RenameDialog';
import { AccountSettings } from './AccountSettings';
import { FileItem } from '@/types/file';
import { useTranslation } from '@/hooks/useTranslation';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UploadProgressPanel } from './UploadProgressPanel';
import { v4 as uuidv4 } from 'uuid'; // Add this import

interface UploadingFile {
  id: string; // Add ID field
  name: string;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'failed';
}

export function FileDashboard() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const { t } = useTranslation();
  const router = useRouter();

  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentFolderPath, setCurrentFolderPath] = useState<string>('');
  const [breadcrumbs, setBreadcrumbs] = useState<Array<{ path: string; name: string }>>([
    { path: '', name: 'Home' } // Initialize root breadcrumb with path: ''
  ]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [uploadKey, setUploadKey] = useState(0);

  // State for rename dialog
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [itemToRename, setItemToRename] = useState<FileItem | null>(null);

  // Quota states
  const [usedQuota, setUsedQuota] = useState<number>(0);
  const [quota, setQuota] = useState<number>(15 * 1024 * 1024 * 1024); // 15 GB default

  // State for account settings modal
  const [showAccountSettings, setShowAccountSettings] = useState(false);

  // State for logout confirmation dialog
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Add new state
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);

  const loadFiles = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (user?.id) {
        params.append('userId', user.id);
      } else {
        setFiles([]);
        setLoading(false);
        return;
      }
      if (currentFolderPath) {
        params.append('parentPath', currentFolderPath);
      }
      const response = await fetch(`/api/files/list?${params}`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setFiles(data.items);
        setUsedQuota(data.usedQuota || 0);
        setQuota(data.quota || 15 * 1024 * 1024 * 1024);
      } else {
        if (response.status === 401) {
          await logout();
          // The redirect is handled by the useEffect in HomePage
          return;
        }
        if (response.status === 403) {
            router.push('/forbidden');
            return;
        }
        throw new Error('Failed to load files');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load files',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [currentFolderPath, user, toast, logout, router]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  const handleFileUpload = async (file: File, onProgress: (progress: number) => void) => {
    const uploadId = uuidv4();
    const formData = new FormData();
    formData.append('file', file);
    
    if (!user?.id) {
      toast({
        title: 'Error',
        description: 'User not authenticated. Cannot upload file.',
        variant: 'destructive',
      });
      return;
    }

    formData.append('userId', user.id);
    if (currentFolderPath) {
      formData.append('parentId', currentFolderPath);
    }

    // Add file to upload queue with unique ID
    setUploadingFiles(prev => [...prev, {
      id: uploadId,
      name: file.name,
      progress: 0,
      status: 'pending'
    }]);

    try {
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = (event.loaded / event.total) * 100;
          onProgress(progress);
          
          setUploadingFiles(prev => prev.map(f => 
            f.id === uploadId
              ? { ...f, progress, status: 'uploading' }
              : f
          ));
        }
      });

      // Setup promise to handle response
      const uploadPromise = new Promise((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(xhr.response);
          } else {
            reject(new Error('Upload failed'));
          }
        };
        xhr.onerror = () => reject(new Error('Upload failed'));
      });

      // Start upload
      xhr.open('POST', '/api/files/upload');
      xhr.withCredentials = true;
      xhr.send(formData);

      await uploadPromise;

      // Update status to completed
      setUploadingFiles(prev => prev.map(f => 
        f.id === uploadId
          ? { ...f, progress: 100, status: 'completed' }
          : f
      ));

      toast({
        title: 'Success',
        description: `${file.name} uploaded successfully`,
      });
      loadFiles();

      // Remove completed file after delay
      setTimeout(() => {
        setUploadingFiles(prev => prev.filter(f => f.id !== uploadId));
      }, 3000);

    } catch (error) {
      console.error('Upload error:', error);
      setUploadingFiles(prev => prev.map(f => 
        f.id === uploadId
          ? { ...f, status: 'failed' }
          : f
      ));
      
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Upload failed',
        variant: 'destructive',
      });
    }
  };

  const handleCreateFolder = async (name: string) => {
    if (!user?.id) {
      toast({
        title: 'Error',
        description: 'User not authenticated. Cannot create folder.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch('/api/files/create-folder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name,
          parentId: currentFolderPath, // Use currentFolderPath as parentId
          userId: user.id,
        }),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Folder created successfully',
        });
        loadFiles();
        setShowCreateFolder(false);
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create folder');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create folder',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteItem = async (item: FileItem) => {
    if (!user?.id) {
      toast({
        title: 'Error',
        description: 'User not authenticated. Cannot delete item.',
        variant: 'destructive',
      });
      return;
    }

    if (!item.path) {
      toast({
        title: 'Error',
        description: 'Item path is missing. Cannot delete.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const params = new URLSearchParams();
      params.append('userId', user.id);
      params.append('filePath', item.path); // Use item.path for deletion

      const response = await fetch(`/api/files/delete?${params.toString()}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: `${item.name} deleted successfully`,
        });
        loadFiles();
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete',
        variant: 'destructive',
      });
    }
  };

  // Handle move item
  const handleMoveItem = async (sourcePath: string, targetPath: string) => {
    if (!user?.id) {
      toast({
        title: 'Error',
        description: 'User not authenticated. Cannot move item.',
        variant: 'destructive',
      });
      return;
    }

    // Prevent moving to the current folder (unless it's a rename, which isn't implemented here)
    // Also prevent moving an item into itself or its subfolder (server-side check is primary)
    if (sourcePath === targetPath || sourcePath.startsWith(targetPath + '/')) {
      // This check is also done server-side, but good to have client-side feedback
      toast({
        title: 'Info',
        description: 'Item is already in this location or cannot be moved into itself.',
        variant: 'default', // Use default or info variant
      });
      return;
    }

    try {
      const response = await fetch('/api/files/move', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          userId: user.id,
          sourcePath,
          targetPath,
        }),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Item moved successfully',
        });
        loadFiles(); // Reload files after move
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Failed to move item');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to move item',
        variant: 'destructive',
      });
    }
  };

  // Handle rename item (called from dialog)
  const handleRenameItem = async (item: FileItem, newName: string) => {
    if (!user?.id) {
      toast({
        title: 'Error',
        description: 'User not authenticated. Cannot rename item.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch('/api/files/rename', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          userId: user.id,
          filePath: item.path, // Current path of the item
          newName: newName,
        }),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: `${item.name} renamed to ${newName} successfully`,
        });
        loadFiles(); // Reload files after rename
        setShowRenameDialog(false); // Close dialog on success
        setItemToRename(null); // Clear item
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Failed to rename item');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to rename item',
        variant: 'destructive',
      });
      // Keep dialog open on error to allow user to retry
    }
  };

  // Function to open the rename dialog
  const openRenameDialog = (item: FileItem) => {
    setItemToRename(item);
    setShowRenameDialog(true);
  };

  const handleFolderOpen = (folder: FileItem) => {
    // Use folder.path for navigation
    setCurrentFolderPath(folder.path);
    // Add the new breadcrumb item with path and name
    setBreadcrumbs(prev => [
      ...prev,
      { path: folder.path, name: folder.name }
    ]);
  };

  const handleBreadcrumbClick = (index: number) => {
    const newBreadcrumbs = breadcrumbs.slice(0, index + 1);
    setBreadcrumbs(newBreadcrumbs);
    // Use the path from the clicked breadcrumb
    setCurrentFolderPath(newBreadcrumbs[newBreadcrumbs.length - 1].path);
  };

  const filteredItems = files.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Separate folders and files for display
  const folders = filteredItems.filter(item => item.type === 'folder');
  const filesOnly = filteredItems.filter(item => item.type === 'file');

  // สร้าง publicUrl สำหรับแต่ละไฟล์ (ใช้ path แบบใหม่)
  const userId = user?.id || '';
  const filesWithPublicUrl = files.map(item => {
    if (item.type === 'file') {
      // path อาจเป็น '' (root) หรือ 'folder1/file.png'
      const cleanPath = item.path.replace(/\\/g, '/'); // แก้ \ เป็น /
      return {
        ...item,
        publicUrl: `/${userId}${cleanPath ? '/' + cleanPath : ''}`,
      };
    }
    return item;
  });

  const handleLogout = async () => {
    await logout();
  };

  const handleClearCompleted = () => {
    setUploadingFiles(prev => prev.filter(f => 
      f.status !== 'completed'
    ));
  };

  useEffect(() => {
    // Prevent scrolling when modal is open
    if (showAccountSettings || showAdminPanel) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showAccountSettings, showAdminPanel]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Upload className="h-6 w-6 text-primary" />
                <h1 className="text-xl font-bold">Lamar CDN v2.1</h1>
              </div>
              <div className="hidden md:flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">{t('welcome')},</span>
                <span className="text-sm font-medium">{user?.username}</span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {user?.isAdmin && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAdminPanel(true)}
                >
                  <Shield className="h-4 w-4 mr-2" />
                  {t('admin')}
                </Button>
              )}
              <Button
                variant="outline"
                size="icon"
                onClick={toggleTheme}
              >
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              {/* Remove the condition so admin can see account settings */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAccountSettings(true)}
              >
                <Settings className="h-4 w-4 mr-2" />
                {t('account_settings')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowLogoutConfirm(true)}
              >
                <LogOut className="h-4 w-4 mr-2" />
                {t('logout')}
              </Button>
            </div>
          </div>
        </div>
      </header>


      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Breadcrumb */}
        {/* Pass the breadcrumbs array and onMoveItem */}
        <Breadcrumb
          items={breadcrumbs}
          onItemClick={handleBreadcrumbClick}
          onMoveItem={handleMoveItem} // Pass move handler
        />

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => setShowCreateFolder(true)}
              size="sm"
            >
              <FolderPlus className="h-4 w-4 mr-2" />
              {t('new_folder')}
            </Button>
            <div className="flex items-center border rounded-md">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-r-none"
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-l-none"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('search_files')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </div>


        {/* Upload Zone */}
        <FileUploadZone key={uploadKey} onFileUpload={handleFileUpload} />

        {/* File Grid */}
        {/* Pass separated folders and files */}
        <FileGrid
          folders={folders}
          files={filesWithPublicUrl.filter(item => item.type === 'file')}
          loading={loading}
          viewMode={viewMode}
          onFolderOpen={handleFolderOpen}
          onDeleteItem={handleDeleteItem}
          onMoveItem={handleMoveItem}
          currentFolderPath={currentFolderPath}
          // Pass the open rename dialog function
          onRenameItem={openRenameDialog}
        />
      </div>

      {/* Dialogs */}
      <CreateFolderDialog
        open={showCreateFolder}
        onOpenChange={setShowCreateFolder}
        onCreateFolder={handleCreateFolder}
      />

      {user?.isAdmin && (
        <AdminPanel
          open={showAdminPanel}
          onOpenChange={setShowAdminPanel}
        />
      )}

      {/* Render the Rename Dialog */}
      <RenameDialog
        open={showRenameDialog}
        onOpenChange={setShowRenameDialog}
        item={itemToRename}
        onRename={handleRenameItem} // Pass the rename handler
      />

      {/* Account Settings Modal */}
      <Dialog open={showAccountSettings} onOpenChange={setShowAccountSettings}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>{t('account_settings')}</span>
            </DialogTitle>
            <DialogDescription>
              {t('manage_account_settings')}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t('account_information')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <AccountSettings />
                </CardContent>
              </Card>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('confirm_logout') || 'ยืนยันการออกจากระบบ'}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('are_you_sure_logout') || 'คุณแน่ใจหรือไม่ว่าต้องการออกจากระบบ?'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowLogoutConfirm(false)}>
              {t('cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                setShowLogoutConfirm(false);
                await handleLogout();
              }}
            >
              {t('logout')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add UploadProgressPanel before closing div */}
      <UploadProgressPanel 
        uploadingFiles={uploadingFiles}
        onClearCompleted={handleClearCompleted}
      />
    </div>
  );
}