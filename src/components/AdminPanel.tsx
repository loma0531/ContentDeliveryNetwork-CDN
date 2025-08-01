'use client';

import type React from 'react';
import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { UserPlus, Users, Shield, Calendar, MoreVertical, Edit2, Trash2 } from 'lucide-react'; // Import icons
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
// Import the EditUserDialog
import { EditUserDialog } from './EditUserDialog';
import { Checkbox } from '@/components/ui/Checkbox'; // แก้ไข path และ casing ให้ถูกต้อง
import { useTranslation } from '@/hooks/useTranslation';

interface User {
  id: string;
  email: string;
  username: string;
  isAdmin: boolean;
  createdAt: string;
  quota?: number;
  usedQuota?: number;
}

interface AdminPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AdminPanel({ open, onOpenChange }: AdminPanelProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    username: '',
    password: '',
    isAdmin: false,
  });
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userIdToDelete, setUserIdToDelete] = useState<string | null>(null);
  const { toast } = useToast();
  const { t } = useTranslation();

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/users/list', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Failed to load users');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load users',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]); // <--- เพิ่ม toast ใน dependency array

  useEffect(() => {
    if (open) {
      loadUsers();
    }
  }, [open, loadUsers]);

  // Filter out the main admin user from the users list
  const filteredUsers = users.filter(user => user.email !== 'admin@example.com');

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.email || !newUser.username || !newUser.password) return;

    setCreating(true);
    try {
      const response = await fetch('/api/users/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(newUser),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'User created successfully',
        });
        setNewUser({ email: '', username: '', password: '', isAdmin: false });
        loadUsers();
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create user');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create user',
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  };

  // Handle user update (called from EditUserDialog)
  const handleUpdateUser = async (userId: string, data: { username?: string; password?: string; isAdmin?: boolean; quota?: number }) => {
      try {
          const response = await fetch('/api/users/update', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ userId, ...data }),
          });

          if (response.ok) {
              toast({ title: 'Success', description: 'User updated successfully' });
              loadUsers(); // Reload users after update
              setShowEditDialog(false); // Close dialog on success
              setUserToEdit(null); // Clear user
          } else {
              const errorData = await response.json();
              throw new Error(errorData.error || 'Failed to update user');
          }
      } catch (error) {
          toast({
              title: 'Error',
              description: error instanceof Error ? error.message : 'Failed to update user',
              variant: 'destructive',
          });
          throw error; // Re-throw to allow dialog to handle loading state
      }
  };

  // Modified handleDeleteUser to use confirmation dialog
  const handleDeleteUser = async (userId: string) => {
      setUserIdToDelete(userId);
      setShowDeleteConfirm(true);
  };

  // Confirm delete action
  const confirmDeleteUser = async () => {
      if (!userIdToDelete) return;
      try {
          const response = await fetch(`/api/users/delete?userId=${userIdToDelete}`, {
              method: 'DELETE',
              credentials: 'include',
          });

          if (response.ok) {
              toast({ title: 'Success', description: 'User deleted successfully' });
              loadUsers(); // Reload users after delete
              setShowEditDialog(false); // Close dialog on success
              setUserToEdit(null); // Clear user
          } else {
              const errorData = await response.json();
              throw new Error(errorData.error || 'Failed to delete user');
          }
      } catch (error) {
          toast({
              title: 'Error',
              description: error instanceof Error ? error.message : 'Failed to delete user',
              variant: 'destructive',
          });
      } finally {
          setShowDeleteConfirm(false);
          setUserIdToDelete(null);
      }
  };

  // Function to open the edit dialog
  const openEditDialog = (user: User) => {
      setUserToEdit(user);
      setShowEditDialog(true);
  };

  // New function to handle delete request from EditUserDialog
  const handleRequestDelete = (userId: string) => {
    setUserIdToDelete(userId);
    setShowDeleteConfirm(true);
  };

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Format bytes to human readable (GB, MB)
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>{t('admin_panel')}</span>
          </DialogTitle>
          <DialogDescription>
            {t('manage_users_and_system_settings')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Create User Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <UserPlus className="h-4 w-4" />
                <span>{t('create_new_user')}</span>
              </CardTitle>
              <CardDescription>
                {t('add_new_user')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">{t('email')}</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="user@example.com"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    disabled={creating}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">{t('username')}</Label>
                  <Input
                    id="username"
                    placeholder={t('username')}
                    value={newUser.username}
                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                    disabled={creating}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">{t('password')}</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder={t('password_min_6')}
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    disabled={creating}
                    required
                    minLength={6}
                  />
                </div>

                <div className="space-y-2">
                    <Label className="flex items-center space-x-2">
                    <Checkbox
                      checked={newUser.isAdmin}
                      onCheckedChange={(checked) =>
                        setNewUser({ ...newUser, isAdmin: Boolean(checked) })
                      }
                      disabled={creating}
                      className="rounded"
                    />
                    <span>{t('admin')}</span>
                    </Label>
                </div>

                <div className="md:col-span-2">
                  <Button type="submit" disabled={creating} className="w-full md:w-auto">
                    {creating ? t('creating') : t('create_user')}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Users List Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>{t('system_users')}</span>
              </CardTitle>
              <CardDescription>
                {t('view_and_manage_all_users')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-sm text-muted-foreground">{t('loading_users')}</p>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">{t('no_users_found')}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium">{user.username}</h4>
                          {user.isAdmin && (
                            <Badge variant="secondary">
                              <Shield className="h-3 w-3 mr-1" />
                              {t('admin')}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>{t('joined')} {formatDate(user.createdAt)}</span>
                        </div>
                        {/* Remove quota display section */}
                        {/* Dropdown Menu for Actions */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditDialog(user)}>
                              <Edit2 className="h-4 w-4 mr-2" />
                              {t('edit')}
                            </DropdownMenuItem>
                            {/* Disable delete if it's the last admin */}
                            <DropdownMenuItem
                              onClick={() => handleDeleteUser(user.id)}
                              className="text-destructive"
                              disabled={user.isAdmin && users.filter(u => u.isAdmin).length === 1}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              {t('delete')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Render the Edit User Dialog */}
        <EditUserDialog
            open={showEditDialog}
            onOpenChange={setShowEditDialog}
            user={userToEdit}
            users={users}
            onUpdate={handleUpdateUser}
            onRequestDelete={handleRequestDelete}
        />

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('confirm_delete')}</DialogTitle>
              <DialogDescription>
                {t('are_you_sure_delete_user')}
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                {t('cancel')}
              </Button>
              <Button variant="destructive" onClick={confirmDeleteUser}>
                {t('delete')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}
