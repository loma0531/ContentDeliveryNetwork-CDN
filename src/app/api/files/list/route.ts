import { type NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import mime from 'mime-types'; // Import mime-types
import { getPublicFileUrl } from '@/utils/fileUtils'; // Import getPublicFileUrl
import dbConnect from '@/lib/mongoose';
import User from '@/models/User';
import { requireAuth } from '@/utils/auth';

export async function GET(request: NextRequest) {
  try {
    const authenticatedUser = await requireAuth(request);
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const parentPath = searchParams.get('parentPath') || ''; // parentPath is the relative path

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // Security check: A user can only list their own files, unless they are an admin.
    if (authenticatedUser.id !== userId && !authenticatedUser.isAdmin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const userBaseDir = path.join(process.cwd(), 'src', 'uploads', userId);
    const currentDir = path.join(userBaseDir, parentPath);

    // Security check: Ensure the resolved current directory is within the user's base directory
    const relativeCurrentDir = path.relative(userBaseDir, currentDir);
     if (relativeCurrentDir.startsWith('..') || path.isAbsolute(relativeCurrentDir)) {
         console.error('Directory traversal attempt detected in list API:', { userId, parentPath, resolvedCurrentDir: currentDir });
         return NextResponse.json(
            { error: 'Invalid parent path' },
            { status: 400 }
         );
    }


    let items: {
      id: string;
      name: string;
      type: 'file' | 'folder';
      size: number;
      mimeType?: string;
      publicUrl?: string | null;
      createdAt: string;
      path: string;
    }[] = [];
    try {
      const files = await fs.readdir(currentDir, { withFileTypes: true });
      items = await Promise.all(files.map(async (file) => {
        const filePath = path.join(currentDir, file.name);
        const stat = await fs.stat(filePath);
        const fullRelativePath = path.relative(userBaseDir, filePath);
        const mimeType = file.isFile() ? mime.lookup(file.name) || 'application/octet-stream' : undefined;
        return {
          id: fullRelativePath, // Use relative path as unique id
          name: file.name,
          type: file.isDirectory() ? 'folder' : 'file',
          size: stat.size,
          mimeType,
          publicUrl: file.isDirectory() ? undefined : getPublicFileUrl(userId, fullRelativePath),
          createdAt: stat.birthtime.toISOString(),
          path: fullRelativePath,
        };
      }));
    } catch (err: unknown) {
      if (typeof err === 'object' && err !== null && 'code' in err && (err as { code?: string }).code === 'ENOENT') {
        items = [];
      } else {
        console.error('List files fs error:', err);
        throw err;
      }
    }

    // Helper: Recursively sum file sizes in user's directory - kept but always returns 0
    async function getDirectorySize(dir: string): Promise<number> {
      return 0; // Return 0 since we're removing quota limits
    }

    // Set quota values to 0 to indicate no limits
    const usedQuota = 0;
    const quota = 0;

    return NextResponse.json({ items, total: items.length, parentPath, usedQuota, quota });
  } catch (error) {
    console.error('List files request error:', error);
    if (error instanceof Error) {
        if (error.message === 'Authentication required') {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}