import { supabase } from "./supabase";

export interface AlertShareData {
  bloodType: string; // blood_type_required
  centerId: string; // center_id
  centerName: string; // depuis la vue alerts_with_center
  urgency: "low" | "medium" | "high" | "critical"; // urgency_level
  description: string; // message
  radiusKm?: number; // radius_km
  deadline?: string; // deadline
}

export interface ShareLink {
  id: string;
  shortCode: string;
  originalUrl: string;
  shareData: AlertShareData;
  userId: string;
  createdAt: string;
  expiresAt: string;
  clickCount: number;
  conversionCount: number;
}

export interface ShareAnalytics {
  totalShares: number;
  totalClicks: number;
  totalConversions: number;
  conversionRate: number;
  topPlatforms: Array<{
    platform: string;
    count: number;
  }>;
  recentActivity: Array<{
    type: "share" | "click" | "conversion";
    timestamp: string;
    platform?: string;
  }>;
}

// Créer un lien de partage parrainé via RPC
export async function createShareLink(
  shareData: AlertShareData,
  userId: string
): Promise<ShareLink> {
  try {
    // Appeler la fonction RPC pour créer le lien
    const { data, error } = await supabase.rpc("create_alert_share", {
      p_share_data: shareData,
      p_user_id: userId,
    });

    if (error) {
      console.error("RPC Error:", error);
      throw new Error("Impossible de créer le lien de partage");
    }

    if (!data || data.length === 0) {
      throw new Error("Aucune donnée retournée par la RPC");
    }

    const shareLinkData = data[0];
    return {
      id: shareLinkData.id,
      shortCode: shareLinkData.short_code,
      originalUrl: shareLinkData.original_url,
      shareData: shareLinkData.share_data,
      userId,
      createdAt: new Date().toISOString(),
      expiresAt: shareLinkData.expires_at,
      clickCount: 0,
      conversionCount: 0,
    };
  } catch (error) {
    console.error("Error creating share link:", error);
    throw error instanceof Error ? error : new Error("Impossible de créer le lien de partage");
  }
}

// Récupérer les données d'un lien de partage via la vue
export async function getShareLink(shortCode: string): Promise<ShareLink | null> {
  try {
    const { data, error } = await supabase
      .from("alert_shares")
      .select("*")
      .eq("short_code", shortCode)
      .single();

    if (error || !data) return null;

    // Vérifier si le lien n'est pas expiré
    if (new Date(data.expires_at) < new Date()) {
      return null;
    }

    return {
      id: data.id,
      shortCode: data.short_code,
      originalUrl: data.original_url,
      shareData: data.share_data,
      userId: data.user_id,
      createdAt: data.created_at,
      expiresAt: data.expires_at,
      clickCount: data.click_count || 0,
      conversionCount: data.conversion_count || 0,
    };
  } catch (error) {
    console.error("Error getting share link:", error);
    return null;
  }
}

// Tracker un clic sur un lien de partage via RPC
export async function trackShareClick(
  shortCode: string,
  platform?: string
): Promise<void> {
  try {
    // Appeler la fonction RPC pour tracker le clic
    const { error } = await supabase.rpc("track_share_click", {
      p_short_code: shortCode,
      p_platform: platform,
    });

    if (error) {
      console.error("RPC Error tracking click:", error);
      // Ne pas lancer d'erreur pour ne pas bloquer l'expérience utilisateur
    }
  } catch (error) {
    console.error("Error tracking share click:", error);
  }
}

// Tracker une conversion via RPC
export async function trackShareConversion(
  shortCode: string,
  platform?: string
): Promise<void> {
  try {
    // Appeler la fonction RPC pour tracker la conversion
    const { error } = await supabase.rpc("track_share_conversion", {
      p_short_code: shortCode,
      p_platform: platform,
    });

    if (error) {
      console.error("RPC Error tracking conversion:", error);
      // Ne pas lancer d'erreur pour ne pas bloquer l'expérience utilisateur
    }
  } catch (error) {
    console.error("Error tracking share conversion:", error);
  }
}

// Récupérer les analytics de partage via RPC
export async function getShareAnalytics(
  userId: string
): Promise<ShareAnalytics> {
  try {
    // Appeler la fonction RPC pour obtenir les analytics
    const { data, error } = await supabase.rpc("get_user_share_analytics");

    if (error) {
      console.error("RPC Error getting analytics:", error);
      throw new Error("Impossible de récupérer les analytics");
    }

    if (!data || data.length === 0) {
      // Retourner des analytics vides si aucune donnée
      return {
        totalShares: 0,
        totalClicks: 0,
        totalConversions: 0,
        conversionRate: 0,
        topPlatforms: [],
        recentActivity: [],
      };
    }

    const analyticsData = data[0];
    
    // Parser les données JSON des plateformes et activité
    const topPlatforms = Array.isArray(analyticsData.top_platforms) 
      ? analyticsData.top_platforms 
      : [];
    
    const recentActivity = Array.isArray(analyticsData.recent_activity)
      ? analyticsData.recent_activity
      : [];

    return {
      totalShares: analyticsData.total_shares || 0,
      totalClicks: analyticsData.total_clicks || 0,
      totalConversions: analyticsData.total_conversions || 0,
      conversionRate: analyticsData.conversion_rate || 0,
      topPlatforms,
      recentActivity,
    };
  } catch (error) {
    console.error("Error getting share analytics:", error);
    throw error instanceof Error ? error : new Error("Impossible de récupérer les analytics");
  }
}

// Générer le message de partage personnalisé
export function generateShareMessage(
  shareData: AlertShareData,
  shareLink: string,
  userName?: string
): string {
  const urgencyEmoji = shareData.urgency === "critical" ? "???" : shareData.urgency === "high" ? "??" : "?";
  const personalization = userName ? `\n\n${userName} vous partage cette alerte` : "";
  
  return `${urgencyEmoji} URGENCE SANGUINE ${urgencyEmoji}

URGENT: Donneurs de groupe ${shareData.bloodType} recherchés à ${shareData.centerName}

${shareData.description}

? Si vous êtes du groupe ${shareData.bloodType} et disponible, votre don peut sauver des vies !

? Réservez votre don directement: ${shareLink}${personalization}

? Partagez ce message autour de vous - chaque donneur compte !

#DonDeSang #BloodLink #SauverDesVies`;
}

// Valider les données de partage
export function validateShareData(data: Partial<AlertShareData>): string[] {
  const errors: string[] = [];

  if (!data.bloodType || !/^[ABO][+-]$/.test(data.bloodType)) {
    errors.push("Groupe sanguin invalide");
  }

  if (!data.centerName || data.centerName.trim().length < 2) {
    errors.push("Nom du centre requis");
  }

  if (!data.urgency || !["low", "medium", "high", "critical"].includes(data.urgency)) {
    errors.push("Niveau d'urgence invalide");
  }

  if (!data.description || data.description.trim().length < 10) {
    errors.push("Description trop courte (minimum 10 caractères)");
  }

  return errors;
}
