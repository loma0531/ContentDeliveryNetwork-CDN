'use client';

import type React from 'react';
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import path from 'path'; // Use path for extension handling
// Import FileItem from the shared types file
import { FileItem } from '@/types/file';
import { useTranslation } from '@/hooks/useTranslation';

interface RenameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: FileItem | null; // The item being renamed
  onRename: (item: FileItem, newName: string) => Promise<void>;
}

export function RenameDialog({ open, onOpenChange, item, onRename }: RenameDialogProps) {
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(false);
  const [fileExtension, setFileExtension] = useState('');
  const [baseName, setBaseName] = useState('');
  const { t } = useTranslation();

  // Effect to update state when the item prop changes (dialog opens with a new item)
  useEffect(() => {
    if (item) {
      if (item.type === 'file') {
        const ext = path.extname(item.name);
        const base = path.basename(item.name, ext);
        setBaseName(base);
        setFileExtension(ext);
        setNewName(base); // Initialize input with base name for files
      } else {
        setBaseName(item.name);
        setFileExtension('');
        setNewName(item.name); // Initialize input with full name for folders
      }
    } else {
      // Reset when dialog is closed or item is null
      setNewName('');
      setBaseName('');
      setFileExtension('');
    }
  }, [item]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item || !newName.trim()) return;

    setLoading(true);
    try {
      // Construct the final new name, preserving extension for files
      const finalNewName = item.type === 'file' && fileExtension
        ? newName.trim() + fileExtension
        : newName.trim();

      await onRename(item, finalNewName);
      // Dialog will be closed by onRename success handler in parent
    } catch (error) {
      console.error('Rename error:', error);
      // Error toast is handled in the parent component (FileDashboard)
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!loading) {
      // Reset state only when closing
      if (!newOpen) {
         setNewName('');
         setBaseName('');
         setFileExtension('');
      }
      onOpenChange(newOpen);
    }
  };

  // Handle input change, preventing extension modification for files
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      if (item?.type === 'file') {
          // For files, only update the base name part
          setNewName(value);
      } else {
          // For folders, update the full name
          setNewName(value);
      }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {item?.type === 'folder'
                ? t('rename_folder')
                : t('rename_file')}
            </DialogTitle>
            <DialogDescription>
              {t('enter_new_name_for')}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="space-y-2">
              <Label htmlFor="new-name">{t('new_name')}</Label>
              <div className="flex">
                <Input
                  id="new-name"
                  placeholder={item?.type === 'folder' ? t('new_folder_name') : t('new_file_name')}
                  value={newName}
                  onChange={handleInputChange}
                  disabled={loading}
                  autoFocus
                  className={fileExtension ? 'rounded-r-none' : ''}
                />
                {item?.type === 'file' && fileExtension && (
                    <span className="flex items-center px-3 text-muted-foreground border border-l-0 rounded-r-md bg-muted">
                        {fileExtension}
                    </span>
                )}
              </div>
               {item?.type === 'file' && fileExtension && (
                   <p className="text-xs text-muted-foreground">{t('file_extension_cannot_be_changed')}</p>
               )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={loading}
            >
              {t('cancel')}
            </Button>
            <Button
              type="submit"
              disabled={!newName.trim() || loading || (item?.type === 'file' && newName.trim() === baseName) || (item?.type === 'folder' && newName.trim() === item?.name)}
            >
              {loading ? t('renaming') : t('rename')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
