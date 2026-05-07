/**
 * ==========================================
 * API PARAMETERS VALIDATION
 * ==========================================
 * Zod schemas for validating API route parameters
 */

import { z } from 'zod';

/**
 * Pagination parameters validation
 */
export const paginationParamsSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
});

/**
 * Team members GET parameters validation
 */
export const getTeamMembersParamsSchema = z.object({
  ...paginationParamsSchema.shape,
  role: z.string().optional(),
  status: z.enum(['active', 'inactive', 'all']).optional(),
  search: z.string().optional(),
});

/**
 * Generic ID parameter validation
 */
export const idParamSchema = z.object({
  id: z.string().uuid('Invalid ID format'),
});

/**
 * Search parameters validation
 */
export const searchParamsSchema = z.object({
  q: z.string().min(1).max(100).optional(),
  category: z.string().optional(),
  status: z.string().optional(),
});

/**
 * Utility function to validate and parse search params
 */
export function validateSearchParams<T>(
  searchParams: URLSearchParams,
  schema: z.ZodSchema<T>
): T {
  const params: Record<string, string> = {};
  
  for (const [key, value] of searchParams.entries()) {
    params[key] = value;
  }
  
  return schema.parse(params);
}

/**
 * Utility function to validate request body
 */
export function validateRequestBody<T>(
  body: unknown,
  schema: z.ZodSchema<T>
): T {
  return schema.parse(body);
}
