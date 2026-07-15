import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'secret-jwt-key-2026-restaurant-pos';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('admin_session')?.value;

    if (!sessionToken) {
      return NextResponse.json({ authenticated: false });
    }

    // Verify token
    const decoded = jwt.verify(sessionToken, JWT_SECRET) as { role: string; id: string };
    return NextResponse.json({ authenticated: true, role: decoded.role, id: decoded.id });
  } catch (error) {
    return NextResponse.json({ authenticated: false });
  }
}
