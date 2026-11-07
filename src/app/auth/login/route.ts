import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { CLIENT_ID, OAUTH_SERVER, REDIRECT_URI, TENANT_ID } from "@/lib/auth";

function computeS256(verifier: string) {
  return crypto.createHash('sha256').update(verifier).digest('base64url');
}

const GET = (request: NextRequest) => {

  const hasError = request.nextUrl.searchParams.get('error');

  if (hasError) {
    return NextResponse.redirect(new URL("/not-found", request.url));
  }

  console.log('login - continue');

  const codeVerifier = crypto.randomBytes(32).toString('base64url');
  const codeChallenge = computeS256(codeVerifier);
  const state = crypto.randomBytes(16).toString('hex');
  const nonce = crypto.randomBytes(16).toString('hex');

  const authUrl = new URL(`${OAUTH_SERVER}/authorize`);
  authUrl.searchParams.set('tenant_id', TENANT_ID);
  authUrl.searchParams.set('client_id', CLIENT_ID);
  authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('code_challenge', codeChallenge);
  authUrl.searchParams.set('code_challenge_method', 'S256');
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('scope', 'openid email profile roles');
  authUrl.searchParams.set('nonce', nonce);

  console.log('login - values', {
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    state: state,
    scope: 'openid email profile roles',
    nonce: nonce,
    codeVerifier
  });

  const response = NextResponse.redirect(authUrl.toString());

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 10, // 10 minutos
  };

  response.cookies.set("oauth_code_verifier", codeVerifier, cookieOptions);
  response.cookies.set("oauth_state", state, cookieOptions);

  return response;
}

export { GET };