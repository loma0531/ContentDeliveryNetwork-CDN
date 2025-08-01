// File/folder delete API removed. No longer needed after API refactor.

import { type NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const filePath = searchParams.get('filePath'); // Path relative to user's upload directory

    console.log('DELETE request received:');
    console.log('  userId:', userId);
    console.log('  filePath:', filePath);
    console.log('  searchParams:', searchParams.toString()); // Log the full query string

    if (!userId && !filePath) {
      return NextResponse.json(
        { error: 'userId and filePath are required' },
        { status: 400 }
      );
    } else if (!userId) {
       return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    } else if (!filePath) {
       return NextResponse.json(
        { error: 'filePath is required' },
        { status: 400 }
      );
    }

    const userUploadDir = path.join(process.cwd(), 'src', 'uploads', userId);
    const absoluteFilePath = path.join(userUploadDir, filePath);

    // Basic security check: ensure the resolved path is within the user's directory
    // and prevent deleting the user's root directory itself
    const relativeFilePath = path.relative(userUploadDir, absoluteFilePath);
    if (relativeFilePath.startsWith('..') || path.isAbsolute(relativeFilePath) || relativeFilePath === '') {
         return NextResponse.json(
            { error: 'Invalid file path or cannot delete root directory' },
            { status: 400 }
         );
    }


    try {
      // Use fs.rm for recursive deletion (works for both files and directories)
      await fs.rm(absoluteFilePath, { recursive: true, force: true });

      return NextResponse.json(
        { message: 'Item deleted successfully' }, // Changed message to be generic
        { status: 200 }
      );

    } catch (err: unknown) {
      if (typeof err === 'object' && err !== null && 'code' in err && (err as { code?: string }).code === 'ENOENT') {
        return NextResponse.json(
          { error: 'Item not found' },
          { status: 404 }
        );
      }
      // Handle other potential errors like permissions
      console.error('Delete item error:', err); // Changed log message
      return NextResponse.json(
        { error: 'Failed to delete item' }, // Changed message
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Delete request parsing error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
