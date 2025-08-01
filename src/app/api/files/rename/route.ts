import { type NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const { userId, filePath, newName } = await request.json();

    console.log('RENAME request received:');
    console.log('  userId:', userId);
    console.log('  filePath:', filePath);
    console.log('  newName:', newName);

    if (!userId || !filePath || !newName || !newName.trim()) {
      return NextResponse.json(
        { error: 'userId, filePath, and newName are required' },
        { status: 400 }
      );
    }

    const trimmedNewName = newName.trim();

    const userUploadDir = path.join(process.cwd(), 'src', 'uploads', userId);
    const absoluteFilePath = path.join(userUploadDir, filePath);

    // Security check: Ensure the resolved path is within the user's directory
    // and prevent renaming the user's root directory itself
    const relativeFilePath = path.relative(userUploadDir, absoluteFilePath);
    if (relativeFilePath.startsWith('..') || path.isAbsolute(relativeFilePath) || relativeFilePath === '') {
         return NextResponse.json(
            { error: 'Invalid file path or cannot rename root directory' },
            { status: 400 }
         );
    }

    // Determine the parent directory of the item being renamed
    const absoluteParentDir = path.dirname(absoluteFilePath);
    const oldName = path.basename(absoluteFilePath);
    const oldExt = path.extname(oldName);

    // Construct the new absolute path
    let absoluteNewPath = path.join(absoluteParentDir, trimmedNewName);

    try {
        // Check if the item exists and is a file or directory
        const itemStat = await fs.stat(absoluteFilePath);

        // If it's a file, ensure the extension is not changed
        if (itemStat.isFile()) {
            const newExt = path.extname(trimmedNewName);
            if (oldExt && newExt !== oldExt) {
                 return NextResponse.json(
                    { error: `Cannot change file extension from "${oldExt}" to "${newExt}"` },
                    { status: 400 }
                 );
            }
             // If the old name had no extension but the new one does, allow it.
             // If the old name had an extension, ensure the new name keeps it.
             if (oldExt && !trimmedNewName.endsWith(oldExt)) {
                 absoluteNewPath = path.join(absoluteParentDir, trimmedNewName + oldExt);
             } else if (!oldExt && trimmedNewName.endsWith(newExt) && newExt.length > 0) {
                 // New name has an extension, old didn't. Use the new name as is.
                 absoluteNewPath = path.join(absoluteParentDir, trimmedNewName);
             } else {
                 // Either both have no extension, or both have the same extension, or old had no ext and new has no ext.
                 // Use the trimmedNewName as is.
                 absoluteNewPath = path.join(absoluteParentDir, trimmedNewName);
             }
        } else if (!itemStat.isDirectory()) {
             // Should not happen based on FileItem type, but good check
             return NextResponse.json(
                { error: 'Item is not a file or directory' },
                { status: 400 }
             );
        }


        // Security check for the new path
        const relativeNewPath = path.relative(userUploadDir, absoluteNewPath);
        if (relativeNewPath.startsWith('..') || path.isAbsolute(relativeNewPath)) {
             console.error('Directory traversal attempt detected in rename API (new path):', { userId, filePath, newName, absoluteNewPath });
             return NextResponse.json(
                { error: 'Invalid new name' },
                { status: 400 }
             );
        }


        // Prevent renaming to the exact same name (case-sensitive check first)
        if (absoluteFilePath === absoluteNewPath) {
             return NextResponse.json(
                { message: 'New name is the same as the old name' },
                { status: 200 } // Or 400
             );
        }

        // Check for name conflict in the target directory (case-insensitive check might be needed depending on OS/filesystem)
        try {
            await fs.access(absoluteNewPath);
            // Item with the new name already exists
            return NextResponse.json(
               { error: `An item named "${trimmedNewName}" already exists in this location` },
               { status: 409 }
            );
        } catch (err: unknown) {
            if (!(err && typeof err === 'object' && 'code' in err && typeof (err as { code?: string }).code === 'string' && (err as { code?: string }).code === 'ENOENT')) {
                // Some other error occurred checking existence
                throw err;
            }
            // ENOENT means it doesn't exist, which is good - we can rename
        }


        // Perform the rename operation
        await fs.rename(absoluteFilePath, absoluteNewPath);

        // Calculate the new path relative to the user's base directory
        const newPathRelativeToUser = path.relative(userUploadDir, absoluteNewPath);


        return NextResponse.json(
          {
            message: 'Item renamed successfully',
            newName: path.basename(absoluteNewPath), // Return the final name used
            newPath: newPathRelativeToUser, // Return the new relative path
          },
          { status: 200 }
        );

    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'code' in err && typeof (err as { code?: string }).code === 'string' && (err as { code?: string }).code === 'ENOENT') {
        return NextResponse.json(
          { error: 'Item not found' },
          { status: 404 }
        );
      }
      // Handle other potential errors like permissions
      console.error('Rename item error:', err);
      return NextResponse.json(
        { error: 'Failed to rename item' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Rename request parsing error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
