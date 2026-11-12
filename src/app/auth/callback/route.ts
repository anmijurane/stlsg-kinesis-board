import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { CLIENT_ID, CLIENT_SECRET, OAUTH_SERVER, REDIRECT_URI, TENANT_ID } from "@/lib/auth";
import { getBaseUrl } from "@/app/utils/getBaseUrl";

export interface TokenEndpointResponse {
  access_token: string;
  token_type: 'Bearer';
  expires_in: number;
  refresh_token: string;
  scope: string;
  id_token?: string;
}

const GET = async (request: NextRequest) => {

  const baseUrl = getBaseUrl(request);

  console.log(`[ROUTE GET] auth/callback :: ${request.url}`);

  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error || !state || !code) {
    // TODO: Refactor common error and controlate on OAuth Server
    console.log('ENTRO AL ERROR', { error });
    const errorUrl = new URL('/not-found', request.url);
    errorUrl.searchParams.set('error', 'not-state-or-code');
    return NextResponse.redirect(errorUrl.toString());
  }

  // 1. Learn cookies previosly saved
  const stateSaved = request.cookies.get('oauth_state')?.value;
  const codeVerifier = request.cookies.get('oauth_code_verifier')?.value;

  console.log({ stateSaved, codeVerifier });

  // 2. Get Cookie Validate state and code_verifier
  if (!stateSaved || !codeVerifier || stateSaved !== state) {
    // TODO: Refactor common error and controlate on OAuth Server
    const errorUrl = new URL('/auth/login', baseUrl);
    errorUrl.searchParams.set('error', 'code-or-state-not-found');
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

    const traceId = crypto.randomBytes(16).toString('hex');

    const tokenResponse = await fetch(`${OAUTH_SERVER}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
        'x-trace': traceId,
      },
      body: tokenPayload2.toString(),
    });

    console.log('callback-route', tokenResponse.status, { traceId });

    if (!tokenResponse.ok) {
      // TODO: Refactor common error and controlate on OAuth Server
      const errorUrl = new URL('/auth/login', baseUrl);
      errorUrl.searchParams.set('error', 'auth_failed');
      return NextResponse.redirect(errorUrl);
    }

    const tokenData: TokenEndpointResponse = await tokenResponse.json();

    const response = NextResponse.redirect(new URL('/resumen', baseUrl));

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
    return NextResponse.redirect(new URL("/auth/login?error=internal_server_error", baseUrl));
  }

}

export { GET };
