import { headers } from "next/headers"

// Bepaalt de publieke URL van de app (nodig voor links in e-mails).
export async function getOrigin(): Promise<string> {
  const requestHeaders = await headers()
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host")
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host?.startsWith("localhost") ? "http" : "https")
  return host ? `${protocol}://${host}` : "http://localhost:3000"
}
