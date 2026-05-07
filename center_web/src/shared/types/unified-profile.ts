/**
 * ==========================================
 * BLOODLINK UNIFIED PROFILE TYPES
 * ==========================================
 */

import { z } from 'zod';

export type UserRole = 'super_admin' | 'center_admin' | 'donor';

/**
 * Unified profile interface
 */
export interface UnifiedProfile {
  id: string;
  full_name: string | null;
  role: UserRole;
  avatar_url: string | null;
  center_id?: string | null;
  updated_at?: string | null;
}

/**
 * Zod schema for unified profile validation
 */
export const unifiedProfileSchema = z.object({
  id: z.string().uuid(),
  full_name: z.string().nullable(),
  role: z.enum(['super_admin', 'center_admin', 'donor']),
  avatar_url: z.string().nullable(),
  center_id: z.string().uuid().nullable().optional(),
  updated_at: z.string().datetime().nullable().optional(),
});

/**
 * Profile update input
 */
export interface UpdateProfileInput {
  full_name?: string;
  role?: UserRole;
  avatar_url?: string | null;
  center_id?: string | null;
}

/**
 * Zod schema for profile updates
 */
export const updateProfileSchema = z.object({
  full_name: z.string().min(1).optional(),
  role: z.enum(['super_admin', 'center_admin', 'donor']).optional(),
  avatar_url: z.string().nullable().optional(),
  center_id: z.string().uuid().nullable().optional(),
});
