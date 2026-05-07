/**
 * BloodLink Activity Helpers
 */

import type { ActivityType, ActivityIcon, ActivityTag } from '@/shared/types/activity';

/**
 * Returns the appropriate icon based on activity type
 */
export function getActivityIcon(type: ActivityType): ActivityIcon {
  if (type.startsWith('center_')) return 'Building2';
  if (type.startsWith('donor_')) return 'Users';
  if (type.startsWith('donation_')) return 'Droplet';
  if (type.startsWith('appointment_')) return 'Calendar';
  if (type.startsWith('alert_')) return 'Bell';
  
  return 'Droplet';
}

/**
 * Returns the appropriate tag based on activity type
 */
export function getActivityTag(type: ActivityType): ActivityTag {
  if (type.endsWith('_created')) return 'created';
  if (type.endsWith('_updated')) return 'updated';
  if (type.endsWith('_validated')) return 'validated';
  if (type.endsWith('_cancelled')) return 'cancelled';
  if (type.endsWith('_published')) return 'published';
  if (type.endsWith('_archived')) return 'archived';
  
  return 'created';
}

/**
 * Multilingual descriptions for each activity type
 */
const ACTIVITY_DESCRIPTIONS: Record<ActivityType, Record<string, string>> = {
  center_created: { fr: 'Centre créé', en: 'Center created' },
  center_updated: { fr: 'Centre mis à jour', en: 'Center updated' },
  
  donor_created: { fr: 'Nouveau donneur inscrit', en: 'New donor registered' },
  donor_updated: { fr: 'Profil donneur mis à jour', en: 'Donor profile updated' },
  donor_archived: { fr: 'Donneur archivé', en: 'Donor archived' },
  
  donation_created: { fr: 'Nouveau prélèvement enregistré', en: 'New donation recorded' },
  donation_updated: { fr: 'Don mis à jour', en: 'Donation updated' },
  donation_validated: { fr: 'Don validé avec succès', en: 'Donation successfully validated' },
  
  appointment_created: { fr: 'Rendez-vous pris', en: 'Appointment scheduled' },
  appointment_updated: { fr: 'Rendez-vous modifié', en: 'Appointment updated' },
  appointment_cancelled: { fr: 'Rendez-vous annulé', en: 'Appointment cancelled' },
  
  alert_created: { fr: 'Nouvelle alerte brouillon', en: 'New draft alert' },
  alert_published: { fr: 'Alerte lancée publiquement', en: 'Alert published' },
};

/**
 * Returns translated description
 */
export function getActivityDescription(
  type: ActivityType,
  locale: string = 'fr'
): string {
  const descriptions = ACTIVITY_DESCRIPTIONS[type];
  if (!descriptions) return type;
  return descriptions[locale] || descriptions['fr'] || type;
}

/**
 * Tailwind styles for each tag
 */
export const TAG_STYLES: Record<ActivityTag, string> = {
  created: 'bg-emerald-500 text-white',
  updated: 'bg-sky-500 text-white',
  validated: 'bg-rose-600 text-white',
  published: 'bg-orange-500 text-white',
  cancelled: 'bg-red-600 text-white',
  archived: 'bg-gray-400 text-white',
};

/**
 * Helper to build ActivityInput
 */
export function buildActivityInput(
  type: ActivityType,
  entityName: string,
  metadata: {
    entityId: string;
    entityType: 'center' | 'donor' | 'donation' | 'appointment' | 'alert';
    centerId?: string;
    donorId?: string;
    donationId?: string;
    [key: string]: unknown;
  },
  locale: string = 'fr'
) {
  return {
    type,
    icon: getActivityIcon(type),
    entityName,
    description: getActivityDescription(type, locale),
    tag: getActivityTag(type),
    metadata,
  };
}
