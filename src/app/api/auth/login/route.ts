import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const ADMIN_ID = process.env.ADMIN_ID || 'admin-trial';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'security-first-2026';
const JWT_SECRET = process.env.JWT_SECRET || 'secret-jwt-key-2026-restaurant-pos';

export async function POST(request: Request) {
  try {
    const { personalId, password } = await request.json();

    if (personalId === ADMIN_ID && password === ADMIN_PASSWORD) {
      // Issue a JWT token
      const token = jwt.sign({ role: 'admin', id: personalId }, JWT_SECRET, {
        expiresIn: '8h',
      });

      const response = NextResponse.json({ success: true, role: 'admin' });

      // Set cookie securely
      response.cookies.set({
        name: 'admin_session',
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 60 * 60 * 8, // 8 hours
      });

      return response;
    }

    return NextResponse.json(
      { success: false, error: 'Invalid Admin ID or Password' },
      { status: 401 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'An error occurred during authentication' },
      { status: 500 }
    );
  }
}
