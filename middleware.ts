import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
 
function middleware(request: NextRequest) {
  // For now, allow all requests to pass through
  // Authentication will be handled at the component level
  return NextResponse.next()
}

export default middleware
 
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
