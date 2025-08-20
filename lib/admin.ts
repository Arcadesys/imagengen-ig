import type { NextRequest } from "next/server"

/**
 * isAdminRequest
 *
 * Simple admin gate using a shared secret. Set ADMIN_SECRET in env,
 * and include header `x-admin-secret: <ADMIN_SECRET>` in requests.
 */
export function isAdminRequest(req: NextRequest): boolean {
  const secret = process.env.ADMIN_SECRET
  if (!secret) return false
  const hdr = req.headers.get("x-admin-secret")
  return !!hdr && hdr === secret
}
