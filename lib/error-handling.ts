/**
 * Production Error Handler Utility
 * Provides consistent error handling and logging for API routes
 */

export interface ApiError {
  message: string
  code?: string
  statusCode: number
  details?: any
}

export class ProductionError extends Error {
  statusCode: number
  code?: string
  details?: any

  constructor(message: string, statusCode: number = 500, code?: string, details?: any) {
    super(message)
    this.name = 'ProductionError'
    this.statusCode = statusCode
    this.code = code
    this.details = details
  }
}

/**
 * Enhanced error logger for production debugging
 */
export function logError(error: any, context: string, additionalInfo?: any) {
  const timestamp = new Date().toISOString()
  const errorInfo = {
    timestamp,
    context,
    message: error.message || 'Unknown error',
    stack: error.stack,
    statusCode: error.statusCode || 500,
    code: error.code,
    details: error.details,
    additionalInfo
  }

  // Always log to console in production for debugging
  console.error(`[${context}] Error at ${timestamp}:`, errorInfo)

  // In production, also try to log to external service if configured
  if (process.env.NODE_ENV === 'production') {
    // You can integrate with services like Sentry, LogRocket, etc.
    // Example: Sentry.captureException(error, { extra: errorInfo })
  }

  return errorInfo
}

/**
 * Standardized error response for API routes
 */
export function createErrorResponse(error: any, context: string, additionalInfo?: any) {
  const errorInfo = logError(error, context, additionalInfo)
  
  // Don't expose sensitive error details in production
  const isProduction = process.env.NODE_ENV === 'production'
  const response = {
    error: error.message || 'Internal server error',
    code: error.code,
    timestamp: errorInfo.timestamp,
    ...(isProduction ? {} : { 
      details: error.details,
      stack: error.stack 
    })
  }

  const statusCode = error.statusCode || 500
  return { response, statusCode }
}

/**
 * Common production environment checks
 */
export function validateEnvironment() {
  const required = [
    'DATABASE_URL',
    'AUTH_SECRET',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY'
  ]

  const missing = required.filter(key => !process.env[key])
  
  if (missing.length > 0) {
    throw new ProductionError(
      `Missing required environment variables: ${missing.join(', ')}`,
      500,
      'ENV_CONFIG_ERROR',
      { missingVars: missing }
    )
  }
}

/**
 * Safe database operation wrapper
 */
export async function safeDatabaseOperation<T>(
  operation: () => Promise<T>,
  context: string
): Promise<T> {
  try {
    validateEnvironment()
    return await operation()
  } catch (error: any) {
    if (error.code === 'P1001') {
      throw new ProductionError(
        'Database connection failed',
        500,
        'DB_CONNECTION_ERROR',
        { originalError: error.message }
      )
    }
    if (error.code?.startsWith('P')) {
      throw new ProductionError(
        'Database operation failed',
        500,
        'DB_OPERATION_ERROR',
        { prismaCode: error.code, originalError: error.message }
      )
    }
    throw error
  }
}

/**
 * Auth validation wrapper
 */
export async function validateAuth(authFunction: () => Promise<any>, context: string) {
  try {
    const session = await authFunction()
    
    if (!session?.user?.id) {
      throw new ProductionError(
        'Authentication required',
        401,
        'AUTH_REQUIRED'
      )
    }
    
    return session
  } catch (error: any) {
    if (error instanceof ProductionError) throw error
    
    logError(error, `${context}-auth`)
    throw new ProductionError(
      'Authentication failed',
      401,
      'AUTH_FAILED',
      { originalError: error.message }
    )
  }
}
