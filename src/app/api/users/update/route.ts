import { type NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import User from '@/models/User';
import { requireAdmin, hashPassword } from '@/utils/auth';

export async function POST(request: NextRequest) {
  try {
    // Ensure the user is authenticated and is an admin
    await requireAdmin(request);

    await dbConnect();

    const { userId, username, password, isAdmin, quota } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Find the user to update
    const userToUpdate = await User.findById(userId);

    if (!userToUpdate) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Update fields if provided
    if (username !== undefined) {
        // Check for username uniqueness if changing
        if (username.trim() !== userToUpdate.username) {
             const existingUser = await User.findOne({ username: username.trim() });
             if (existingUser) {
                 return NextResponse.json(
                    { error: 'Username already exists' },
                    { status: 409 }
                 );
             }
             userToUpdate.username = username.trim();
        }
    }

    if (password !== undefined && password !== '') {
      // Hash the new password if provided
      userToUpdate.password = await hashPassword(password);
    }

    if (isAdmin !== undefined) {
      userToUpdate.isAdmin = isAdmin;
    }

    if (quota !== undefined) {
      userToUpdate.quota = quota;
    }

    await userToUpdate.save();

    return NextResponse.json({
      message: 'User updated successfully',
      user: {
        id: userToUpdate._id,
        email: userToUpdate.email,
        username: userToUpdate.username,
        isAdmin: userToUpdate.isAdmin,
        createdAt: userToUpdate.createdAt,
        quota: userToUpdate.quota,
      },
    });

  } catch (error: unknown) {
    console.error('Update user error:', error);
    if ((error as Error).message === 'Authentication required' || (error as Error).message === 'Admin access required') {
        return NextResponse.json({ error: (error as Error).message }, { status: 401 });
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}