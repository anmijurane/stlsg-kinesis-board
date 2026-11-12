export const OAUTH_SERVER = process.env.OAUTH_SERVER_URL || "";
export const CLIENT_ID = process.env.OAUTH_CLIENT_ID || "";
export const CLIENT_SECRET = process.env.OAUTH_CLIENT_SECRET || "";
export const REDIRECT_URI = process.env.OAUTH_REDIRECT_URI || "";
export const TENANT_ID = process.env.OAUTH_TENANT_ID || "";

export interface IntrospectResponse {
  active: boolean;
  sub?: string;
  tenant_id?: string;
  aud?: string;
  exp?: number;
  iat?: number;
  client_id?: string;
  scope?: string;
  iss?: string;
  token_type?: string;
  email?: string;
  name?: string;
  roles?: string[];
}

export async function validateAccessToken(token: string): Promise<boolean> {
  if (!token || typeof token !== "string") {
    return false;
  }

  try {
    const res = await fetch(`${OAUTH_SERVER}/oauth/introspect`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
      }),
      cache: "no-store",
    });

    if (!res.ok) {
      return false;
    }

    const data: IntrospectResponse = await res.json();
    return Boolean(data.active);
  } catch (error) {
    console.error("Error validando token con el servidor OAuth:", error);
    return false;
  }
}

