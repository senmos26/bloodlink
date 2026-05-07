/**
 * Activity Service - Vercel KV (Redis)
 * Gestion du stockage et récupération des activités utilisateur
 */

import { kv } from '@vercel/kv';
import type { Activity, ActivityInput } from '@/shared/types/activity';

// ============================================================================
// Configuration
// ============================================================================

const MAX_ACTIVITIES = 500; // Limite d'activités par utilisateur (~2 semaines d'historique)

// ============================================================================
// Helper: Generate Activity Key
// ============================================================================

function getActivityKey(userId: string): string {
  return `activities:${userId}`;
}

// ============================================================================
// Add Activity
// ============================================================================

/**
 * Ajoute une nouvelle activité pour un utilisateur
 * Stockée dans un Redis Sorted Set avec timestamp comme score
 * 
 * @param userId - ID de l'utilisateur
 * @param input - Données de l'activité
 * @returns L'activité créée avec ID et timestamp
 */
export async function addActivity(
  userId: string,
  input: ActivityInput
): Promise<Activity> {
  if (!userId?.trim()) {
    throw new Error('userId is required');
  }

  try {
    // Créer l'activité complète
    const activity: Activity = {
      id: crypto.randomUUID(),
      userId,
      ...input,
      timestamp: new Date().toISOString(),
    };

    const key = getActivityKey(userId);
    
    // Ajouter au sorted set (score = timestamp pour tri chronologique)
    await kv.zadd(key, {
      score: Date.now(),
      member: JSON.stringify(activity),
    });

    // Garder seulement les MAX_ACTIVITIES plus récentes
    // Supprimer les anciennes (rank 0 à -(MAX_ACTIVITIES + 1))
    await kv.zremrangebyrank(key, 0, -(MAX_ACTIVITIES + 1));

    return activity;
  } catch (error) {
    console.error('Failed to add activity:', error);
    throw error;
  }
}

// ============================================================================
// Get Recent Activities
// ============================================================================

/**
 * Récupère les activités récentes d'un utilisateur
 * Triées par date décroissante (plus récente en premier)
 * 
 * @param userId - ID de l'utilisateur
 * @param limit - Nombre d'activités à récupérer (défaut: 10)
 * @returns Liste des activités
 */
export async function getRecentActivities(
  userId: string,
  limit: number = 10
): Promise<Activity[]> {
  if (!userId?.trim()) {
    throw new Error('userId is required');
  }
  
  if (limit < 1 || limit > MAX_ACTIVITIES) {
    throw new Error(`limit must be between 1 and ${MAX_ACTIVITIES}`);
  }

  try {
    const key = getActivityKey(userId);
    
    // Récupérer du sorted set (rev: true = ordre décroissant)
    const activities = await kv.zrange(key, 0, limit - 1, {
      rev: true, // Plus récent en premier
    });

    // Vercel KV (Upstash) retourne déjà des objets JSON parsés
    // Pas besoin de JSON.parse manuel
    return activities.map((item) => {
      // Si c'est une string (shouldn't happen avec Upstash), parse-la
      if (typeof item === 'string') {
        return JSON.parse(item) as Activity;
      }
      // Sinon retourne directement l'objet
      return item as Activity;
    });
  } catch (error) {
    console.error('Failed to get recent activities:', error);
    throw error;
  }
}

// ============================================================================
// Get Activities by Type
// ============================================================================

/**
 * Récupère les activités d'un type spécifique
 * 
 * @param userId - ID de l'utilisateur
 * @param type - Type d'activité à filtrer
 * @param limit - Nombre d'activités à récupérer
 * @returns Liste des activités filtrées
 */
export async function getActivitiesByType(
  userId: string,
  type: string,
  limit: number = 10
): Promise<Activity[]> {
  if (!userId?.trim() || !type?.trim()) {
    throw new Error('userId and type are required');
  }

  // Fetch a reasonable upper bound instead of all MAX_ACTIVITIES
  // Optimized: fetch 10x the limit, max 100 activities
  const fetchLimit = Math.min(limit * 10, 100);
  const allActivities = await getRecentActivities(userId, fetchLimit);
  
  return allActivities
    .filter((activity) => activity.type === type)
    .slice(0, limit);
}

// ============================================================================
// Clear Activities
// ============================================================================

/**
 * Supprime toutes les activités d'un utilisateur
 * Utile pour tests ou reset
 * 
 * @param userId - ID de l'utilisateur
 */
export async function clearActivities(userId: string): Promise<void> {
  if (!userId?.trim()) {
    throw new Error('userId is required');
  }

  try {
    const key = getActivityKey(userId);
    await kv.del(key);
  } catch (error) {
    console.error('Failed to clear activities:', error);
    throw error;
  }
}

// ============================================================================
// Get Activity Count
// ============================================================================

/**
 * Compte le nombre total d'activités d'un utilisateur
 * 
 * @param userId - ID de l'utilisateur
 * @returns Nombre d'activités
 */
export async function getActivityCount(userId: string): Promise<number> {
  if (!userId?.trim()) {
    throw new Error('userId is required');
  }

  try {
    const key = getActivityKey(userId);
    return await kv.zcard(key) || 0;
  } catch (error) {
    console.error('Failed to get activity count:', error);
    throw error;
  }
}
