import { NextRequest, NextResponse } from "next/server";
import { CLIENT_ID, CLIENT_SECRET, OAUTH_SERVER, REDIRECT_URI, TENANT_ID } from "@/lib/auth";

export interface TokenEndpointResponse {
  access_token: string;
  token_type: 'Bearer';
  expires_in: number;
  refresh_token: string;
  scope: string;
  id_token?: string;
}

const GET = async (request: NextRequest) => {

  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error || !state || !code) {
    // TODO: Refactor common error and controlate on OAuth Server
    const errorUrl = new URL('/not-found', request.url);
    errorUrl.searchParams.set('error', 'not-state-or-code');
    return NextResponse.redirect(errorUrl.toString());
  }

  // 1. Learn cookies previosly saved
  const stateSaved = request.cookies.get('oauth_state')?.value;
  const codeVerifier = request.cookies.get('oauth_code_verifier')?.value;

  // 2. Get Cookie Validate state and code_verifier
  if (!stateSaved || !codeVerifier || stateSaved !== state) {
    // TODO: Refactor common error and controlate on OAuth Server
    const errorUrl = new URL('/auth/login', request.url);
    errorUrl.searchParams.set('error', 'auth_failed');
    return NextResponse.redirect(errorUrl);
  }

  // 3. Code -> token ([POST] Server to Server)
  try {

    const tokenPayload2 = new URLSearchParams({
      tenant_id: TENANT_ID,
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI,
      code_verifier: codeVerifier,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    });

    const tokenResponse = await fetch(`${OAUTH_SERVER}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json'
      },
      body: tokenPayload2.toString(),
    });

    console.log('callback-route', tokenResponse.status);

    if (!tokenResponse.ok) {
      // TODO: Refactor common error and controlate on OAuth Server
      const errorUrl = new URL('/auth/login', request.url);
      errorUrl.searchParams.set('error', 'auth_failed');
      return NextResponse.redirect(errorUrl);
    }

    const tokenData: TokenEndpointResponse = await tokenResponse.json();

    const response = NextResponse.redirect(new URL('/resumen', request.url));

    response.cookies.set('t', tokenData.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: tokenData.expires_in ?? 60 * 60 * 24,
    });

    if (tokenData.refresh_token) {
      response.cookies.set('refresh_token', tokenData.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/auth/token",
        maxAge: 60 * 60 * 24 * 30, // 30 días
      });
    }

    response.cookies.delete('oauth_state');
    response.cookies.delete('oauth_code_verifier');

    console.log('callback-route', response.cookies.getAll())

    return response;

  } catch (error) {
    console.error(error);
    return NextResponse.redirect(new URL("/auth/login?error=server_error", request.url));
  }

}

export { GET };
