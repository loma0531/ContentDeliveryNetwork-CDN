import { type NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import User from '@/models/User';
import { requireAdmin } from '@/utils/auth';
import fs from 'fs/promises';
import path from 'path';
import { SUPER_ADMIN_EMAIL, isSuperAdmin } from '@/types/user';

// Read quota from env (in MB)
const USER_STORAGE_LIMIT_MB = parseInt(process.env.DEFAULT_USER_QUOTA_MB || '15360', 10); // 15GB default
const USER_STORAGE_LIMIT_BYTES = USER_STORAGE_LIMIT_MB * 1024 * 1024;

// Helper: Recursively sum file sizes in user's directory
async function getDirectorySize(dir: string): Promise<number> {
  let total = 0;
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const entryPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        total += await getDirectorySize(entryPath);
      } else if (entry.isFile()) {
        const statObj = await fs.stat(entryPath);
        total += statObj.size;
      }
    }
  } catch (e) {
    // Ignore ENOENT for missing folders
    if (!(e && typeof e === 'object' && 'code' in e && (e as { code?: string }).code === 'ENOENT')) {
      throw e;
    }
  }
  return total;
}

export async function GET(request: NextRequest) {
  try {
    // Check if user is admin
    const currentUser = await requireAdmin(request);
    
    // Only super admin can see all users including themselves
    const filterSuperAdmin = !isSuperAdmin(currentUser.email);

    await dbConnect();
    const { searchParams } = new URL(request.url);
    const page = Number.parseInt(searchParams.get('page') || '1');
    const limit = Number.parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Add filter to exclude super admin for regular admins
    const query = filterSuperAdmin ? { email: { $ne: SUPER_ADMIN_EMAIL } } : {};
    
    // Get users with pagination
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    const total = await User.countDocuments(query);
    // For each user, get their files from src/uploads/[userId] and calculate used quota
    const usersWithFiles = await Promise.all(
      users.map(async user => {
        const userId = user._id.toString();
        const userDir = path.join(process.cwd(), 'src', 'uploads', userId);
        let files: string[] = [];
        let usedQuota = 0;
        try {
          files = (await fs.readdir(userDir)).filter(f => !f.startsWith('.'));
          usedQuota = await getDirectorySize(userDir);
        } catch (err: unknown) {
          if (!(err && typeof err === 'object' && 'code' in err && (err as { code?: string }).code === 'ENOENT')) throw err;
        }
        return {
          id: user._id,
          email: user.email,
          username: user.username,
          isAdmin: user.isAdmin,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          files,
          usedQuota, // bytes
          quota: USER_STORAGE_LIMIT_BYTES, // bytes
        };
      })
    );
    return NextResponse.json({
      users: usersWithFiles,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('List users error:', error);
    if (error instanceof Error) {
      if (error.message === 'Admin access required') {
        return NextResponse.json(
          { error: 'Admin access required' },
          { status: 403 }
        );
      }
      if (error.message === 'Authentication required') {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
