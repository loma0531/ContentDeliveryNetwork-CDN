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
// Import the Checkbox component from your UI library
import { Checkbox } from '@/components/ui/Checkbox';
import { Loader2, Trash2 } from 'lucide-react'; // Import icons
import { useTranslation } from '@/hooks/useTranslation';

interface User {
  id: string;
  email: string;
  username: string;
  isAdmin: boolean;
  createdAt: string;
  quota?: number;
}

interface EditUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null; // The user being edited
  users: User[]; // Add users array prop
  onUpdate: (userId: string, data: { username?: string; password?: string; isAdmin?: boolean }) => Promise<void>;
  onRequestDelete: (userId: string) => void; // <--- เพิ่ม prop นี้
}

export function EditUserDialog({ open, onOpenChange, user, users, onUpdate, onRequestDelete }: EditUserDialogProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingUpdate, setLoadingUpdate] = useState(false);
  const { t } = useTranslation();

  // Effect to update state when the user prop changes (dialog opens with a new user)
  useEffect(() => {
    if (user) {
      setUsername(user.username);
      setIsAdmin(user.isAdmin);
      setPassword(''); // Clear password field when opening for security
    } else {
      // Reset when dialog is closed or user is null
      setUsername('');
      setIsAdmin(false);
      setPassword('');
    }
  }, [user]);

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !username.trim()) return;

    setLoadingUpdate(true);
    try {
      const updateData: { username?: string; password?: string; isAdmin?: boolean } = {};
      if (username.trim() !== user.username) {
          updateData.username = username.trim();
      }
      if (password !== '') {
          if (password.length < 6) {
              alert('Password must be at least 6 characters long.');
              setLoadingUpdate(false);
              return;
          }
          updateData.password = password;
      }
      if (isAdmin !== user.isAdmin) {
          // Check if trying to remove admin from the last admin
          if (user.isAdmin && !isAdmin && users.filter(u => u.isAdmin).length === 1) {
              alert('Cannot remove admin privileges from the last admin user.');
              setLoadingUpdate(false);
              return;
          }
          updateData.isAdmin = isAdmin;
      }

      // Only call update if there are changes
      if (Object.keys(updateData).length > 0) {
         await onUpdate(user.id, updateData);
         // Parent handles closing dialog on success
      } else {
         // No changes, just close the dialog
         handleOpenChange(false);
      }

    } catch (error) {
      console.error('Update user error:', error);
      // Error toast is handled in the parent component (AdminPanel)
    } finally {
      setLoadingUpdate(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    // Prevent closing while loading
    if (!loadingUpdate) {
      // Reset state only when closing
      if (!newOpen) {
         setUsername('');
         setIsAdmin(false);
         setPassword('');
      }
      onOpenChange(newOpen);
    }
  };

  // Disable update button if no changes are made or username is empty
  const isUpdateDisabled = !username.trim() || loadingUpdate ||
                           (username.trim() === user?.username && password === '' && isAdmin === user?.isAdmin);

  // Check if the current user is the last admin
  const isLastAdmin = user?.isAdmin && users.filter(u => u.isAdmin).length === 1;


  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleUpdateSubmit}>
          <DialogHeader>
            <DialogTitle>{t('edit_user')}</DialogTitle>
            <DialogDescription>
              {t('update_user_details')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
              <Label htmlFor="edit-email">{t('email')}</Label>
              {/* Email is typically not editable via this panel */}
              <Input
                id="edit-email"
                value={user?.email || ''}
                disabled // Email is disabled
              />
            </div>

          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-username">{t('username')}</Label>
              <Input
                id="edit-username"
                placeholder={t('username')}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loadingUpdate}
                required
              />
            </div>


            <div className="space-y-2">
              <Label htmlFor="edit-password">{t('new_password_optional')}</Label>
              <Input
                id="edit-password"
                type="password"
                placeholder={t('leave_blank_to_keep_current_password')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loadingUpdate}
                minLength={6} // Add minLength validation
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="edit-isAdmin"
                checked={isAdmin}
                onCheckedChange={(checked) => setIsAdmin(Boolean(checked))}
                disabled={loadingUpdate || isLastAdmin}
              />
              <Label htmlFor="edit-isAdmin">{t('grant_admin_privileges')}</Label>
            </div>
             {isLastAdmin && ( // Show message if last admin
                 <p className="text-xs text-muted-foreground">{t('cannot_remove_last_admin')}</p>
             )}
          </div>

          <DialogFooter className="flex flex-col sm:flex-row sm:justify-between gap-2">
             {/* Delete Button */}
             <Button
                type="button"
                variant="destructive"
                onClick={() => user && onRequestDelete(user.id)}
                disabled={loadingUpdate || isLastAdmin}
                className="w-full sm:w-auto"
             >
                <Trash2 className="h-4 w-4 mr-2" />
                {t('delete_user')}
             </Button>

             {/* Cancel and Save Buttons */}
             <div className="flex gap-2 w-full sm:w-auto justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                  disabled={loadingUpdate}
                >
                  {t('cancel')}
                </Button>
                <Button
                  type="submit"
                  disabled={isUpdateDisabled}
                >
                  {loadingUpdate ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : t('save_changes')}
                </Button>
             </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
    );
  }
