import { type NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const { name, parentId, userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Folder name is required' },
        { status: 400 }
      );
    }

    const folderName = name.trim();
    // Define the user's base upload directory
    const userBaseDir = path.join(process.cwd(), 'src', 'uploads', userId);

    // Construct the target parent directory path
    // Ensure parentId is treated as a relative path within the user's directory
    const targetParentDir = parentId
      ? path.join(userBaseDir, parentId)
      : userBaseDir;

    // Construct the full path for the new folder
    const newFolderPath = path.join(targetParentDir, folderName);

    // Security check: Ensure the resolved path is within the user's directory
    // This prevents directory traversal attacks like parentId = '../../../../'
    const relativeNewFolderPath = path.relative(userBaseDir, newFolderPath);
    if (
      relativeNewFolderPath.startsWith('..') ||
      path.isAbsolute(relativeNewFolderPath)
    ) {
      return NextResponse.json(
        { error: 'Invalid parent path or folder name' },
        { status: 400 }
      );
    }

    try {
      // Check if the parent directory exists and is a directory
      const parentStat = await fs.stat(targetParentDir);
      if (!parentStat.isDirectory()) {
        return NextResponse.json(
          { error: 'Parent path is not a directory' },
          { status: 400 }
        );
      }

      await fs.mkdir(newFolderPath, { recursive: false });
    } catch (err: unknown) {
      if (typeof err === 'object' && err !== null && 'code' in err) {
        const code = (err as { code?: string }).code;
        if (code === 'EEXIST') {
          return NextResponse.json(
            { error: 'Folder with this name already exists' },
            { status: 409 }
          );
        } else if (code === 'ENOENT') {
          return NextResponse.json(
            { error: 'Parent directory not found' },
            { status: 404 }
          );
        }
      }
      console.error('Create folder fs error:', err);
      throw err; // Re-throw other errors
    }

    // Return the path relative to the user's base directory
    const createdFolderPathRelativeToUser = path.relative(
      userBaseDir,
      newFolderPath
    );

    return NextResponse.json(
      {
        message: 'Folder created successfully',
        folder: {
          name: folderName,
          parentId: parentId || null, // Keep original parentId for client-side logic if needed
          path: createdFolderPathRelativeToUser, // Return the relative path
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create folder request error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
