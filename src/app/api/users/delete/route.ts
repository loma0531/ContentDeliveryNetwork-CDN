import { type NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import User from '@/models/User';
import { requireAdmin } from '@/utils/auth';
import fs from 'fs/promises';
import path from 'path';

export async function DELETE(request: NextRequest) {
  try {
    // Ensure the user is authenticated and is an admin
    const adminUser = await requireAdmin(request);

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const userIdToDelete = searchParams.get('userId');

    if (!userIdToDelete) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Prevent admin from deleting their own account
    if (adminUser._id.toString() === userIdToDelete) {
         return NextResponse.json(
            { error: 'Cannot delete your own admin account' },
            { status: 400 }
         );
    }

    // Find the user to delete
    const userToDelete = await User.findById(userIdToDelete);

    if (!userToDelete) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // --- Optional: Delete user's files ---
    // This is a potentially destructive operation. Implement carefully.
    // For this example, we will delete the user's upload directory.
    const userUploadDir = path.join(process.cwd(), 'src', 'uploads', userIdToDelete);
    try {
        await fs.rm(userUploadDir, { recursive: true, force: true });
        console.log(`Deleted upload directory for user ${userIdToDelete}`);
    } catch (dirErr) {
        console.error(`Failed to delete upload directory for user ${userIdToDelete}:`, dirErr);
        // Decide whether to proceed with user deletion if directory deletion fails
        // For now, we'll log the error and proceed.
    }
    // --- End Optional File Deletion ---


    await userToDelete.deleteOne(); // Use deleteOne() for Mongoose 6+

    return NextResponse.json({
      message: 'User deleted successfully',
      userId: userIdToDelete,
    });

  } catch (error: unknown) {
    console.error('Delete user error:', error);
    if (
      typeof error === 'object' &&
      error !== null &&
      'message' in error &&
      typeof (error as { message: unknown }).message === 'string' &&
      ((error as { message: string }).message === 'Authentication required' ||
        (error as { message: string }).message === 'Admin access required')
    ) {
      return NextResponse.json({ error: (error as { message: string }).message }, { status: 401 });
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}