// app/api/auth/session/route.js
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import Session from '@/lib/siwe/session';

export async function GET(request) {

  try {
    const session = await Session.fromRequest(request);
  

    return NextResponse.json(session.toJSON());
  } catch (error) {
    console.error('Session error:', error)
    return NextResponse.json(
      { error: error.message || 'Session error' },
      { status: 500 }
    )
  }
}