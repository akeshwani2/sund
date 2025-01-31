import { db } from "../../../../../firebaseConfig"; // Client-side for regular operations
import { adminDb } from "../../../../../src/lib/firebase-admin"; // Admin for secure writes
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state'); // Get Firebase UID from state param

  if (!code || !state) {
    return NextResponse.redirect('/');
  }

  try {
    // Exchange code for tokens
    console.log('Using Client ID:', process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.substring(0, 8)); // Log first 8 chars
    console.log('Using Client Secret:', process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET?.substring(0, 8));

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        code,
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
        client_secret: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET!,
        redirect_uri: `${process.env.NEXT_PUBLIC_BASE_URL}/api/gmail/callback`,
        grant_type: 'authorization_code',
      }),
    });

    const tokens = await tokenResponse.json();
    
    // Store raw tokens in Firestore (for development only)
    await adminDb.doc(`users/${state}/integrations/gmail`).set({
      accessToken: tokens.access_token || '',
      refreshToken: tokens.refresh_token || '',
      expiresAt: Date.now() + (tokens.expires_in * 1000)
    });

    console.log('Received state (UID):', state);
    console.log('OAuth tokens received:', tokens);

    console.log(`Successfully stored tokens for user ${state}`);

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL}/`
    );
  } catch (error) {
    console.error('Gmail connection failed:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL}/`
    );
  }
}