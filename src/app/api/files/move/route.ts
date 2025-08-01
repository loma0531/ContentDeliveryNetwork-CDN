import { type NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const { userId, sourcePath, targetPath } = await request.json();

    console.log('MOVE request received:');
    console.log('  userId:', userId);
    console.log('  sourcePath:', sourcePath);
    console.log('  targetPath:', targetPath);

    if (!userId || !sourcePath || targetPath === undefined) { // targetPath can be '' for root
      return NextResponse.json(
        { error: 'userId, sourcePath, and targetPath are required' },
        { status: 400 }
      );
    }

    const userUploadDir = path.join(process.cwd(), 'src', 'uploads', userId);

    const absoluteSourcePath = path.join(userUploadDir, sourcePath);
    const absoluteTargetPath = path.join(userUploadDir, targetPath); // targetPath is the folder path

    // Construct the final destination path (target folder + source item name)
    const sourceItemName = path.basename(absoluteSourcePath);
    const absoluteDestinationPath = path.join(absoluteTargetPath, sourceItemName);


    // Security checks: Ensure both source and destination are within the user's directory
    const relativeSourcePath = path.relative(userUploadDir, absoluteSourcePath);
    const relativeDestinationPath = path.relative(userUploadDir, absoluteDestinationPath);

    if (
      relativeSourcePath.startsWith('..') || path.isAbsolute(relativeSourcePath) ||
      relativeDestinationPath.startsWith('..') || path.isAbsolute(relativeDestinationPath)
    ) {
         console.error('Directory traversal attempt detected in move API:', { userId, sourcePath, targetPath, absoluteSourcePath, absoluteDestinationPath });
         return NextResponse.json(
            { error: 'Invalid source or target path' },
            { status: 400 }
         );
    }

    // Prevent moving an item into itself or a subfolder of itself
    if (relativeDestinationPath.startsWith(relativeSourcePath + path.sep) || relativeDestinationPath === relativeSourcePath) {
         return NextResponse.json(
            { error: 'Cannot move an item into itself or its subfolder' },
            { status: 400 }
         );
    }

    // Prevent moving to the exact same location (optional, but good practice)
    if (absoluteSourcePath === absoluteDestinationPath) {
         return NextResponse.json(
            { message: 'Item is already in the target location' },
            { status: 200 } // Or 400, depending on desired behavior
         );
    }


    try {
      // Check if source exists
      await fs.access(absoluteSourcePath);

      // Check if target exists and is a directory (unless target is user's root)
      if (targetPath !== '') {
          const targetStat = await fs.stat(absoluteTargetPath);
          if (!targetStat.isDirectory()) {
              return NextResponse.json(
                 { error: 'Target path is not a directory' },
                 { status: 400 }
              );
          }
      }


      // Check if an item with the same name already exists in the target
      try {
          await fs.access(absoluteDestinationPath);
          // Item exists, return conflict
          return NextResponse.json(
             { error: `An item named "${sourceItemName}" already exists in the target location` },
             { status: 409 }
          );
      } catch (err: unknown) {
          if (!(err && typeof err === 'object' && 'code' in err && typeof (err as { code?: string }).code === 'string' && (err as { code?: string }).code === 'ENOENT')) {
              // Some other error occurred checking existence
              throw err;
          }
          // ENOENT means it doesn't exist, which is good - we can move it
      }


      // Perform the move operation
      await fs.rename(absoluteSourcePath, absoluteDestinationPath);

      return NextResponse.json(
        { message: 'Item moved successfully' },
        { status: 200 }
      );

    } catch (err: unknown) {
      if (
        err &&
        typeof err === 'object' &&
        'code' in err &&
        typeof (err as { code?: string }).code === 'string' &&
        (err as { code?: string }).code === 'ENOENT'
      ) {
        return NextResponse.json(
          { error: 'Source item or target directory not found' },
          { status: 404 }
        );
      }
      // Handle other potential errors like permissions
      console.error('Move item error:', err);
      return NextResponse.json(
        { error: 'Failed to move item' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Move request parsing error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
