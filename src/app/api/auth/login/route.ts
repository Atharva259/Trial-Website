import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const AUTHORIZED_EMAILS = [
  'admin@biteflow.in',
  'chef@biteflow.in',
  'cashier@biteflow.in'
];
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'security-first-2026';
const JWT_SECRET = process.env.JWT_SECRET || 'secret-jwt-key-2026-restaurant-pos';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    // Check if the provided email is in the authorized list
    if (email && AUTHORIZED_EMAILS.includes(email.toLowerCase()) && password === ADMIN_PASSWORD) {
      // Determine role from email address
      let role = 'staff';
      if (email.toLowerCase() === 'admin@biteflow.in') role = 'admin';
      else if (email.toLowerCase() === 'chef@biteflow.in') role = 'chef';
      else if (email.toLowerCase() === 'cashier@biteflow.in') role = 'cashier';

      // Issue a JWT token
      const token = jwt.sign({ role, id: email }, JWT_SECRET, {
        expiresIn: '8h',
      });

      const response = NextResponse.json({ success: true, role });

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
      { success: false, error: 'Unauthorized email or invalid password' },
      { status: 401 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'An error occurred during authentication' },
      { status: 500 }
    );
  }
}
