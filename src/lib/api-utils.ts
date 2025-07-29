import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

/**
 * Common API response utilities and middleware
 */

// Standard error responses
export const ApiErrors = {
  UNAUTHORIZED: { error: "Unauthorized" },
  NOT_FOUND: { error: "Not found" },
  BAD_REQUEST: { error: "Bad request" },
  INTERNAL_ERROR: { error: "Internal server error" },
  FORBIDDEN: { error: "Forbidden" }
} as const

// Standard status codes
export const StatusCodes = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_ERROR: 500
} as const

/**
 * Check if user is authenticated and has admin role
 */
export async function requireAdminAuth() {
  const session = await getServerSession(authOptions)
  
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json(ApiErrors.UNAUTHORIZED, { status: StatusCodes.UNAUTHORIZED })
  }
  
  return { session, user: session.user }
}

/**
 * Standardized error response handler
 */
export function handleApiError(error: unknown, context: string) {
  console.error(`Error in ${context}:`, error)
  return NextResponse.json(
    ApiErrors.INTERNAL_ERROR,
    { status: StatusCodes.INTERNAL_ERROR }
  )
}

/**
 * Validate required fields in request data
 */
export function validateRequiredFields<T extends Record<string, unknown>>(
  data: T,
  requiredFields: (keyof T)[]
): string | null {
  for (const field of requiredFields) {
    if (!data[field] && data[field] !== 0 && data[field] !== false) {
      return `Missing required field: ${String(field)}`
    }
  }
  return null
}

/**
 * Parse pagination parameters from URL search params
 */
export function parsePaginationParams(searchParams: URLSearchParams) {
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "10")))
  const skip = (page - 1) * limit
  
  return { page, limit, skip }
}

/**
 * Create standardized pagination response
 */
export function createPaginationResponse<T>(
  items: T[],
  total: number,
  page: number,
  limit: number
) {
  return {
    items,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  }
}
