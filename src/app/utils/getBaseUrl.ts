import { NextRequest } from "next/server";

export const getBaseUrl = (request: NextRequest): string => {
  const forwardedHost = request.headers.get("x-forwarded-host") || request.headers.get("host");
  const forwardedProto = request.headers.get("x-forwarded-proto") || "https";

  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  // Fallback si no hay proxy headers
  return request.nextUrl.origin;
}