export interface User {
  id: string;
  email: string;
  username: string;
  isAdmin: boolean;
  isSuperAdmin?: boolean; // New field
  createdAt: string;
  updatedAt: string;
}

export const SUPER_ADMIN_EMAIL = 'admin@example.com';

export function isSuperAdmin(email: string): boolean {
  return email === SUPER_ADMIN_EMAIL;
}
