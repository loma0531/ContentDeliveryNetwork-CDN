import { type NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import User from '@/models/User';
import { requireAdmin, hashPassword } from '@/utils/auth';
import { ensureUploadDir } from '@/utils/fileUtils';

export async function POST(request: NextRequest) {
  try {
    // Check if user is admin
    await requireAdmin(request);

    await dbConnect();

    const { email, username, password, isAdmin = false } = await request.json();

    if (!email || !username || !password) {
      return NextResponse.json(
        { error: 'Email, username, and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { email: email.toLowerCase() },
        { username: username }
      ]
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email or username already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create new user
    const newUser = new User({
      email: email.toLowerCase(),
      username,
      password: hashedPassword,
      isAdmin,
    });

    const savedUser = await newUser.save();

    // Create upload directory for the user
    await ensureUploadDir(savedUser._id.toString());

    return NextResponse.json({
      message: 'User created successfully',
      user: {
        id: savedUser._id,
        email: savedUser.email,
        username: savedUser.username,
        isAdmin: savedUser.isAdmin,
        createdAt: savedUser.createdAt,
      },
    }, { status: 201 });

  } catch (error) {
    console.error('Create user error:', error);

    const err = error as { message?: string };

    if (err.message === 'Admin access required') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    if (err.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
