import { NextResponse } from 'next/server'
import type { ZodError } from 'zod'

// ── Error codes ───────────────────────────────────────────────────────────────

export const ErrorCode = {
  UNAUTHORIZED:      'UNAUTHORIZED',
  FORBIDDEN:         'FORBIDDEN',
  NOT_FOUND:         'NOT_FOUND',
  LIMIT_EXCEEDED:    'LIMIT_EXCEEDED',
  VALIDATION_ERROR:  'VALIDATION_ERROR',
  CONFLICT:          'CONFLICT',
  INTERNAL_ERROR:    'INTERNAL_ERROR',
} as const

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode]

// ── HTTP status map ───────────────────────────────────────────────────────────

const STATUS_MAP: Record<ErrorCode, number> = {
  UNAUTHORIZED:     401,
  FORBIDDEN:        403,
  NOT_FOUND:        404,
  LIMIT_EXCEEDED:   402,
  VALIDATION_ERROR: 400,
  CONFLICT:         409,
  INTERNAL_ERROR:   500,
}

// ── Response shape ────────────────────────────────────────────────────────────

export interface ApiErrorBody {
  error:    ErrorCode
  message:  string
  details?: unknown
}

// ── Helper ────────────────────────────────────────────────────────────────────

export function apiError(
  code:     ErrorCode,
  message:  string,
  details?: unknown
): NextResponse<ApiErrorBody> {
  return NextResponse.json(
    { error: code, message, ...(details !== undefined ? { details } : {}) },
    { status: STATUS_MAP[code] }
  )
}

// ── Convenience shorthands ────────────────────────────────────────────────────

export const unauthorized = (message = 'Authentication required') =>
  apiError(ErrorCode.UNAUTHORIZED, message)

export const forbidden = (message = 'You do not have permission to perform this action') =>
  apiError(ErrorCode.FORBIDDEN, message)

export const notFound = (resource = 'Resource') =>
  apiError(ErrorCode.NOT_FOUND, `${resource} not found`)

export const limitExceeded = (message = 'Plan limit reached. Please upgrade to continue.') =>
  apiError(ErrorCode.LIMIT_EXCEEDED, message)

export const validationError = (err: ZodError) =>
  apiError(ErrorCode.VALIDATION_ERROR, 'Validation failed', err.flatten())

export const conflict = (message = 'Resource already exists') =>
  apiError(ErrorCode.CONFLICT, message)

export const internalError = (message = 'An unexpected error occurred') =>
  apiError(ErrorCode.INTERNAL_ERROR, message)
