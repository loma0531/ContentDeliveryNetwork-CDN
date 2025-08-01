import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import type { NextRequest } from 'next/server';
import User, { type IUser } from '@/models/User';
import dbConnect from '@/lib/mongoose';

const JWT_SECRET = process.env.JWT_SECRET!;

if (!JWT_SECRET) {
  throw new Error('Please define the JWT_SECRET environment variable');
}

export interface JWTPayload {
  userId: string;
  email: string;
  username: string;
  isAdmin: boolean;
}

export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return await bcrypt.compare(password, hashedPassword);
};

export const generateToken = (user: IUser): string => {
  const payload: JWTPayload = {
    userId: user._id,
    email: user.email,
    username: user.username,
    isAdmin: user.isAdmin,
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
};

export const verifyToken = (token: string): JWTPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    return null;
  }
};

export const getTokenFromRequest = (request: NextRequest): string | null => {
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Also check for token in cookies
  const token = request.cookies.get('token')?.value;
  return token || null;
};

export const getCurrentUser = async (request: NextRequest): Promise<IUser | null> => {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return null;

    const payload = verifyToken(token);
    if (!payload) return null;

    await dbConnect();
    const user = await User.findById(payload.userId);
    return user;
  } catch (error) {
    return null;
  }
};

export const requireAuth = async (request: NextRequest): Promise<IUser> => {
  const user = await getCurrentUser(request);
  if (!user) {
    throw new Error('Authentication required');
  }
  return user;
};

export const requireAdmin = async (request: NextRequest): Promise<IUser> => {
  const user = await requireAuth(request);
  if (!user.isAdmin) {
    throw new Error('Admin access required');
  }
  return user;
};
