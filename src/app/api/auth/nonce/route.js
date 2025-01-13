// app/api/auth/nonce/route.js
import { generateNonce } from 'siwe'
import { cookies } from 'next/headers'
import Session from '@/lib/siwe/session';

export async function GET(request) {
  try {
    const nonce = generateNonce();
    const session = await Session.fromRequest(request);
        if (!session?.nonce) session.nonce = nonce;
    
    cookies().set('siwe_nonce', nonce, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 5 * 60
    })


    return Response.json(session.nonce)
  } catch (error) {
    return Response.json({ error: 'Failed to generate nonce' }, { status: 500 })
  }
}