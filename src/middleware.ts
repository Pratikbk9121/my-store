import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    // Check if user is trying to access admin routes
    if (req.nextUrl.pathname.startsWith("/admin")) {
      // Check if user has admin role
      if (req.nextauth.token?.role !== "ADMIN") {
        // Redirect to unauthorized page or home
        return NextResponse.redirect(new URL("/unauthorized", req.url))
      }
    }
    
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow access to admin routes only for authenticated users
        if (req.nextUrl.pathname.startsWith("/admin")) {
          return !!token && token.role === "ADMIN"
        }
        
        // For other protected routes, just check if user is authenticated
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/admin/:path*"
  ]
}
