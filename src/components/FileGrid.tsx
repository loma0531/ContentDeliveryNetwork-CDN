'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Folder,
  File,
  Image,
  Video,
  Music,
  FileText,
  Archive,
  Download,
  Trash2,
  ExternalLink,
  MoreVertical,
  Edit2 // Import Edit2 icon for rename
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
// Import FileItem from the shared types file
import { FileItem } from '@/types/file';
import { useTranslation } from '@/hooks/useTranslation';

interface FileGridProps {
  folders: FileItem[]; // Separate folders list
  files: FileItem[]; // Separate files list
  loading: boolean;
  viewMode: 'grid' | 'list';
  onFolderOpen: (folder: FileItem) => void;
  onDeleteItem: (item: FileItem) => void; // Change to pass the full item
  onMoveItem: (sourcePath: string, targetPath: string) => Promise<void>;
  currentFolderPath: string;
  // Add onRenameItem prop
  onRenameItem: (item: FileItem) => void; // Function to trigger rename dialog in parent
}

export function FileGrid({ folders, files, loading, viewMode, onFolderOpen, onDeleteItem, onMoveItem, currentFolderPath, onRenameItem }: FileGridProps) {
  // Add state for tracking drag hover
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);
  const { t } = useTranslation();

  const getFileIcon = (file: FileItem) => {
    if (file.type === 'folder') {
      return <Folder className="h-8 w-8 text-blue-500" />;
    }

    // Add fallback check for .mp4 extension if mimeType is not video
    if (file.mimeType?.startsWith('video/') || file.name.toLowerCase().endsWith('.mp4')) {
      return <Video className="h-8 w-8 text-red-500" />;
    }

    if (file.mimeType?.startsWith('image/')) {
      return <Image className="h-8 w-8 text-green-500" />;
    }

    if (file.mimeType?.startsWith('audio/')) {
      return <Music className="h-8 w-8 text-purple-500" />;
    }

    if (file.mimeType?.includes('text') || file.mimeType?.includes('document')) {
      return <FileText className="h-8 w-8 text-blue-500" />;
    }

    if (file.mimeType?.includes('zip') || file.mimeType?.includes('archive')) {
      return <Archive className="h-8 w-8 text-yellow-500" />;
    }

    // Fallback for unknown mime types or if mimeType is missing
    return <File className="h-8 w-8 text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 ' + t('bytes');
    const k = 1024;
    const sizes = [t('bytes'), 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleItemClick = (item: FileItem) => {
    if (item.type === 'folder') {
      onFolderOpen(item); // Call onFolderOpen for folders
    } else if (item.publicUrl) {
      // Open files in a new tab
      window.open(item.publicUrl, '_blank');
    }
  };

  const handleDownload = (event: React.MouseEvent, file: FileItem) => {
    event.stopPropagation(); // Stop event propagation
    if (file.publicUrl) {
      const link = document.createElement('a');
      link.href = file.publicUrl;
      link.download = file.originalName ?? file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleDelete = (event: React.MouseEvent, item: FileItem) => {
    event.stopPropagation(); // Stop event propagation
    if (confirm(`Are you sure you want to delete "${item.name}"?`)) {
      onDeleteItem(item); // Pass the full item
    }
  };

  // Add a handler for the "Open" menu item to stop propagation
  const handleOpen = (event: React.MouseEvent, url: string) => {
      event.stopPropagation(); // Stop event propagation
      window.open(url, '_blank');
  };

  // Handle rename click
  const handleRenameClick = (event: React.MouseEvent, item: FileItem) => {
      event.stopPropagation(); // Stop event propagation
      onRenameItem(item); // Call the parent function to open the dialog
  };


  // --- Drag and Drop Handlers ---

  const handleDragStart = (e: React.DragEvent, item: FileItem) => {
    // Set the data to be transferred (the item's path)
    e.dataTransfer.setData('text/plain', item.path);
    // Optionally set a drag image
    // e.dataTransfer.setDragImage(e.currentTarget, 0, 0);
  };

  // แก้ไข handler สำหรับ grid background
  const handleGridDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.add('ring-2', 'ring-primary/20');
  };

  const handleGridDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove('ring-2', 'ring-primary/20');
  };

  // แก้ไข handler สำหรับโฟลเดอร์
  const handleDragOver = (e: React.DragEvent, folderId: string) => {
    e.preventDefault();
    e.stopPropagation(); // ป้องกันการ trigger event ที่ background
    setDragOverFolderId(folderId);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation(); // ป้องกันการ trigger event ที่ background
    setDragOverFolderId(null);
  };

  // Handle drop onto a folder card
  const handleDrop = (e: React.DragEvent, targetFolder: FileItem) => {
    e.preventDefault();
    setDragOverFolderId(null);

    const sourcePath = e.dataTransfer.getData('text/plain');
    const targetPath = targetFolder.path;

    // Prevent dropping a folder into itself or its subfolder (basic check)
    if (sourcePath === targetPath || sourcePath.startsWith(targetPath + '/')) {
        console.log("Cannot drop item into itself or its subfolder");
        return;
    }

    // Prevent dropping an item into its current parent folder (unless it's the root)
    // This requires knowing the parent path of the source item, which isn't readily available here.
    // The server-side check is more robust.

    console.log(`Dropping ${sourcePath} into folder ${targetPath}`);
    onMoveItem(sourcePath, targetPath);
  };

  // Handle drop onto the main grid background (moves to current folder)
  const handleGridBackgroundDrop = (e: React.DragEvent) => {
    e.preventDefault();
     // Remove visual feedback (optional)
    // e.currentTarget.classList.remove('border-primary');

    const sourcePath = e.dataTransfer.getData('text/plain');
    // The target path is the current folder path
    const targetPath = currentFolderPath;

     // Prevent dropping an item into its current folder
     if (sourcePath.startsWith(targetPath + '/') || (targetPath === '' && sourcePath.indexOf('/') === -1)) {
         console.log("Item is already in this folder");
         return;
     }


    console.log(`Dropping ${sourcePath} into current folder ${targetPath}`);
    onMoveItem(sourcePath, targetPath);
  };


  if (loading) {
    return (
      <div className={viewMode === 'grid'
        ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4'
        : 'space-y-2'
      }>
        {Array.from({ length: 12 }).map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <CardContent className="p-4">
              <Skeleton className="h-8 w-8 mb-3" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-3 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (folders.length === 0 && files.length === 0) {
    return (
      <div className="text-center py-12">
        <Folder className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">{t('no_files_yet')}</h3>
        <p className="text-muted-foreground">
          {t('upload_files_or_create_folders')}
        </p>
      </div>
    );
  }

  if (viewMode === 'list') {
    return (
      <div className="space-y-2">
        <div className="grid grid-cols-12 gap-4 text-sm font-medium text-muted-foreground border-b pb-2">
          <div className="col-span-6">{t('name')}</div>
          <div className="col-span-2">{t('size')}</div>
          <div className="col-span-2">{t('downloads')}</div>
          <div className="col-span-2">{t('modified')}</div>
        </div>
        {/* Render Folders and Files in List View (Icon + Details) */}
        {/* Iterate over folders first */}
        {folders.map((item) => {
           console.log('List Item:', item); // Log item data in list view
           return (
          <Card
             key={item.path}
             className="overflow-hidden hover:bg-muted/50 transition-colors"
             draggable="true" // Make card draggable
             onDragStart={(e) => handleDragStart(e, item)}
             onDragOver={(e) => handleDragOver(e, item.path)} // Make folder a drop target
             onDragLeave={handleDragLeave}
             onDrop={(e) => handleDrop(e, item)} // Handle drop on folder
          >
            <CardContent className="p-3">
              <div className="grid grid-cols-12 gap-4 items-center">
                <div
                  className="col-span-6 flex items-center space-x-3 cursor-pointer"
                  onClick={() => handleItemClick(item)}
                >
                  {getFileIcon(item)} {/* Always show icon in list view */}
                  <div className="min-w-0">
                    <p className="font-medium truncate">{item.name}</p>
                    {item.type === 'file' && item.mimeType && (
                      <p className="text-xs text-muted-foreground">{item.mimeType}</p>
                    )}
                  </div>
                </div>
                <div className="col-span-2 text-sm text-muted-foreground">
                  {item.type === 'file' ? formatFileSize(item.size) : '—'}
                </div>
                <div className="col-span-2 text-sm text-muted-foreground">
                  {item.type === 'file' ? item.downloadCount : '—'}
                </div>
                <div className="col-span-1 text-sm text-muted-foreground">
                  {formatDate(item.createdAt)}
                </div>
                <div className="col-span-1 flex justify-end">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}> {/* Stop propagation */}
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                       {/* Add Rename option */}
                       <DropdownMenuItem onClick={(e) => handleRenameClick(e, item)}>
                           <Edit2 className="h-4 w-4 mr-2" />
                           {t('rename')}
                       </DropdownMenuItem>
                      {item.type === 'file' && item.publicUrl && (
                        <>
                          <DropdownMenuItem onClick={(e) => handleDownload(e, item)}>
                            <Download className="h-4 w-4 mr-2" />
                            {t('download')}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => handleOpen(e, item.publicUrl!)}>
                            <ExternalLink className="h-4 w-4 mr-2" />
                            {t('open')}
                          </DropdownMenuItem>
                        </>
                      )}
                      <DropdownMenuItem
                        onClick={(e) => handleDelete(e, item)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        {t('delete')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardContent>
          </Card>
        )})}
        {/* Iterate over files after folders */}
         {files.map((item) => {
           console.log('List Item:', item); // Log item data in list view
           return (
          <Card
             key={item.path}
             className="overflow-hidden hover:bg-muted/50 transition-colors"
             draggable="true" // Make card draggable
             onDragStart={(e) => handleDragStart(e, item)}
             // Files are not drop targets themselves
          >
            <CardContent className="p-3">
              <div className="grid grid-cols-12 gap-4 items-center">
                <div
                  className="col-span-6 flex items-center space-x-3 cursor-pointer"
                  onClick={() => handleItemClick(item)}
                >
                  {getFileIcon(item)} {/* Always show icon in list view */}
                  <div className="min-w-0">
                    <p className="font-medium truncate">{item.name}</p>
                    {item.type === 'file' && item.mimeType && (
                      <p className="text-xs text-muted-foreground">{item.mimeType}</p>
                    )}
                  </div>
                </div>
                <div className="col-span-2 text-sm text-muted-foreground">
                  {item.type === 'file' ? formatFileSize(item.size) : '—'}
                </div>
                <div className="col-span-2 text-sm text-muted-foreground">
                  {item.type === 'file' ? item.downloadCount : '—'}
                </div>
                <div className="col-span-1 text-sm text-muted-foreground">
                  {formatDate(item.createdAt)}
                </div>
                <div className="col-span-1 flex justify-end">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}> {/* Stop propagation */}
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                       {/* Add Rename option */}
                       <DropdownMenuItem onClick={(e) => handleRenameClick(e, item)}>
                           <Edit2 className="h-4 w-4 mr-2" />
                           {t('rename')}
                       </DropdownMenuItem>
                      {item.type === 'file' && item.publicUrl && (
                        <>
                          <DropdownMenuItem onClick={(e) => handleDownload(e, item)}>
                            <Download className="h-4 w-4 mr-2" />
                            {t('download')}
                          </DropdownMenuItem>
                           <DropdownMenuItem onClick={(e) => handleOpen(e, item.publicUrl!)}>
                            <ExternalLink className="h-4 w-4 mr-2" />
                            {t('open')}
                          </DropdownMenuItem>
                        </>
                      )}
                       <DropdownMenuItem
                        onClick={(e) => handleDelete(e, item)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        {t('delete')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardContent>
          </Card>
        )})}
      </div>
    );
  }

  // Grid View Rendering
  return (
    <div
      className="space-y-6 transition-all rounded-lg"
      onDragOver={handleGridDragOver}
      onDragLeave={handleGridDragLeave}
      onDrop={(e) => {
        e.currentTarget.classList.remove('ring-2', 'ring-primary/20');
        handleGridBackgroundDrop(e);
      }}
    >
      {/* Folders Section */}
      {folders.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">{t('folders')}</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {folders.map((item) => (
              <Card
                key={item.path}
                className={`
                  overflow-hidden transition-all duration-200 group flex flex-col
                  hover:shadow-md
                  ${dragOverFolderId === item.path 
                    ? 'ring-2 ring-primary scale-[1.02] shadow-lg bg-primary/5' 
                    : ''
                  }
                `}
                draggable="true"
                onDragStart={(e) => handleDragStart(e, item)}
                onDragOver={(e) => handleDragOver(e, item.path)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => {
                  setDragOverFolderId(null);
                  handleDrop(e, item);
                }}
              >
                {/* Preview/Icon Area */}
                <div
                  className="relative w-full flex-shrink-0 cursor-pointer" // Added flex-shrink-0
                  onClick={() => handleItemClick(item)}
                >
                  {/* Folder Icon */}
                  <div className="flex items-center justify-center h-32 bg-muted/50"> {/* Fixed height for consistency */}
                     {getFileIcon(item)}
                  </div>
                   {/* Dropdown Menu Trigger (positioned absolutely) */}
                   <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            // Stop propagation on the trigger itself
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                           {/* Add Rename option */}
                           <DropdownMenuItem onClick={(e) => handleRenameClick(e, item)}>
                               <Edit2 className="h-4 w-4 mr-2" />
                               {t('rename')}
                           </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => handleDelete(e, item)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            {t('delete')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                   </div>
                </div>

                {/* Details Area */}
                <CardContent className="p-4 flex-grow flex flex-col justify-between"> {/* Added flex-grow */}
                  <div
                    className="cursor-pointer"
                    onClick={() => handleItemClick(item)}
                  >
                    <h3 className="font-medium text-sm mb-1 truncate" title={item.name}>
                      {item.name}
                    </h3>
                    <div className="space-y-1">
                      <Badge variant="outline" className="text-xs">
                        {t('folder')}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}


      {/* Files Section */}
      {files.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">{t('files')}</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {files.map((item) => {
              console.log('Grid Item:', item); // Log item data in grid view
              return (
                <Card
                  key={item.path}
                  className="overflow-hidden hover:shadow-md transition-shadow group flex flex-col"
                  draggable="true" // Make card draggable
                  onDragStart={(e) => handleDragStart(e, item)}
                  // Files are not drop targets themselves
                >
                  {/* Preview/Icon Area */}
                  <div
                    className="relative w-full flex-shrink-0 cursor-pointer" // Added flex-shrink-0
                    onClick={() => handleItemClick(item)}
                  >
                    {/* File Preview/Icon */}
                    {item.type === 'file' && item.publicUrl && item.mimeType?.startsWith('image/') ? (
                      <img
                        src={item.publicUrl}
                        alt={item.name}
                        className="w-full h-32 object-contain" // Fixed height
                      />
                    ) : item.type === 'file' && item.publicUrl && (item.mimeType?.startsWith('video/') || item.name.toLowerCase().endsWith('.mp4')) ? ( // Add fallback check for .mp4
                       <video controls src={item.publicUrl} className="w-full h-32 object-contain" /> // Fixed height
                    ) : item.type === 'file' && item.publicUrl && item.mimeType?.startsWith('audio/') ? (
                       <div className="flex items-center justify-center h-32 bg-muted/50 p-2"> {/* Container for audio player */}
                         <audio controls src={item.publicUrl} className="w-full" />
                       </div>
                    ) : (
                      <div className="flex items-center justify-center h-32 bg-muted/50"> {/* Fixed height for consistency */}
                         {getFileIcon(item)} {/* Show icon for other file types */}
                      </div>
                    )}
                     {/* Dropdown Menu Trigger (positioned absolutely) */}
                     <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                               // Stop propagation on the trigger itself
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                             {/* Add Rename option */}
                             <DropdownMenuItem onClick={(e) => handleRenameClick(e, item)}>
                                 <Edit2 className="h-4 w-4 mr-2" />
                                 {t('rename')}
                             </DropdownMenuItem>
                            {item.type === 'file' && item.publicUrl && (
                              <>
                                <DropdownMenuItem onClick={(e) => handleDownload(e, item)}>
                                  <Download className="h-4 w-4 mr-2" />
                                  {t('download')}
                                </DropdownMenuItem>
                                 <DropdownMenuItem onClick={(e) => handleOpen(e, item.publicUrl!)}>
                                  <ExternalLink className="h-4 w-4 mr-2" />
                                  {t('open')}
                                </DropdownMenuItem>
                              </>
                            )}
                             <DropdownMenuItem
                              onClick={(e) => handleDelete(e, item)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              {t('delete')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                     </div>
                  </div>

                  {/* Details Area */}
                  <CardContent className="p-4 flex-grow flex flex-col justify-between"> {/* Added flex-grow */}
                    <div
                      className="cursor-pointer"
                      onClick={() => handleItemClick(item)}
                    >
                      <h3 className="font-medium text-sm mb-1 truncate" title={item.name}>
                        {item.name}
                      </h3>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(item.size)}
                        </p>
                        {/* Downloads badge removed as requested */}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}
    </div>
  );
}
