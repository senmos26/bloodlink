import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Alert,
  Share,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Linking from "expo-linking";
import Button from "@/components/ui/Button";
import Toast, { type ToastType } from "@/components/ui/Toast";
import { 
  createShareLink, 
  trackShareClick, 
  type AlertShareData 
} from "@/services/alert-sharing";
import { useAuth } from "@/hooks/useAuth";

const MOCK_ALERT: AlertShareData = {
  bloodType: "B+",
  centerId: "center-123",
  centerName: "Hôpital Général",
  urgency: "critical",
  description: "Pénurie aiguë suite à un accident",
  radiusKm: 50,
  deadline: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
};

function getUrgencyColor(urgency: AlertShareData["urgency"]) {
  switch (urgency) {
    case "low":
      return "#006847";
    case "medium":
      return "#f59e0b";
    case "high":
      return "#dc2626";
    case "critical":
      return "#b80035";
    default:
      return "#006847";
  }
}

function getUrgencyLabel(urgency: AlertShareData["urgency"]) {
  switch (urgency) {
    case "low":
      return "Faible";
    case "medium":
      return "Moyenne";
    case "high":
      return "Élevée";
    case "critical":
      return "Critique";
    default:
      return "Faible";
  }
}

function generateShareLink(alertData: AlertShareData, userId?: string): string {
  const baseUrl = "https://bloodlink.app/alert";
  const params = new URLSearchParams({
    bloodType: alertData.bloodType,
    centerId: alertData.centerId,
    centerName: alertData.centerName,
    urgency: alertData.urgency,
    description: alertData.description,
    ...(userId && { ref: userId }),
    ...(alertData.radiusKm && { radiusKm: alertData.radiusKm.toString() }),
    ...(alertData.deadline && { deadline: alertData.deadline }),
  });
  
  return `${baseUrl}?${params.toString()}`;
}

function generateShareMessage(alertData: AlertShareData, shareLink: string): string {
  const urgencyEmoji = alertData.urgency === "critical" ? "???" : alertData.urgency === "high" ? "??" : "?";
  
  return `${urgencyEmoji} URGENCE SANGUINE ${urgencyEmoji}

URGENT: Donneurs de groupe ${alertData.bloodType} recherchés à ${alertData.centerName}

${alertData.description}

? Si vous êtes du groupe ${alertData.bloodType} et disponible, votre don peut sauver des vies !

? Réservez votre don directement: ${shareLink}

? Partagez ce message autour de vous - chaque donneur compte !

#DonDeSang #BloodLink #SauverDesVies`;
}

export default function ShareAlertScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [alertData] = useState<AlertShareData>(MOCK_ALERT);
  const [shareLink, setShareLink] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: ToastType }>({
    visible: false,
    message: "",
    type: "info",
  });

  const showToast = (message: string, type: ToastType) => {
    setToast({ visible: true, message, type });
  };

  const hideToast = () => {
    setToast((prev) => ({ ...prev, visible: false }));
  };

  const generateLink = async () => {
    if (!user?.id) {
      showToast("Vous devez être connecté pour générer un lien", "error");
      return;
    }

    setLoading(true);
    try {
      const shareLinkData = await createShareLink(alertData, user.id);
      setShareLink(shareLinkData.originalUrl);
      showToast("Lien de partage généré avec succès !", "success");
    } catch (error) {
      showToast("Erreur lors de la génération du lien", "error");
    } finally {
      setLoading(false);
    }
  };

  const shareViaWhatsApp = async () => {
    if (!shareLink) {
      showToast("Veuillez d'abord générer un lien", "warning");
      return;
    }

    const message = generateShareMessage(alertData, shareLink);
    const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(message)}`;
    
    try {
      await Linking.openURL(whatsappUrl);
    } catch (error) {
      showToast("WhatsApp n'est pas installé sur votre appareil", "error");
    }
  };

  const shareViaSMS = async () => {
    if (!shareLink) {
      showToast("Veuillez d'abord générer un lien", "warning");
      return;
    }

    const message = generateShareMessage(alertData, shareLink);
    const smsUrl = Platform.OS === "ios" 
      ? `sms:&body=${encodeURIComponent(message)}`
      : `sms:?body=${encodeURIComponent(message)}`;
    
    try {
      await Linking.openURL(smsUrl);
    } catch (error) {
      showToast("Impossible d'ouvrir l'application SMS", "error");
    }
  };

  const shareViaEmail = async () => {
    if (!shareLink) {
      showToast("Veuillez d'abord générer un lien", "warning");
      return;
    }

    const subject = `URGENCE SANGUINE - Donneurs ${alertData.bloodType} recherchés à ${alertData.centerName}`;
    const body = generateShareMessage(alertData, shareLink);
    const mailUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    try {
      await Linking.openURL(mailUrl);
    } catch (error) {
      showToast("Impossible d'ouvrir l'application email", "error");
    }
  };

  const shareNative = async () => {
    if (!shareLink) {
      showToast("Veuillez d'abord générer un lien", "warning");
      return;
    }

    const message = generateShareMessage(alertData, shareLink);
    
    try {
      await Share.share({
        message,
        url: shareLink,
        title: "URGENCE SANGUINE - BloodLink",
      });
    } catch (error) {
      showToast("Erreur lors du partage", "error");
    }
  };

  const copyLink = async () => {
    if (!shareLink) {
      showToast("Veuillez d'abord générer un lien", "warning");
      return;
    }

    try {
      await Share.share({
        message: shareLink,
      });
      showToast("Lien copié dans le presse-papiers", "success");
    } catch (error) {
      showToast("Erreur lors de la copie du lien", "error");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onDismiss={hideToast}
      />
      
      {/* Header */}
      <View className="flex-row items-center gap-3 px-6 py-4 border-b border-black/5">
        <Pressable onPress={() => router.back()} className="p-2">
          <MaterialIcons name="arrow-back" size={24} color="#1a1c1e" />
        </Pressable>
        <View className="flex-1">
          <Text className="text-lg font-bold text-on-surface">Partager l'alerte</Text>
        </View>
      </View>

      <ScrollView
        className="flex-1 px-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        {/* Alert Summary */}
        <View className="bg-surface-container-lowest rounded-2xl p-5 mb-4 shadow-sm border border-black/5">
          <View className="flex-row items-center gap-1.5 mb-3">
            <View 
              className="flex-row items-center gap-1 px-3 py-1 rounded-full"
              style={{ backgroundColor: `${getUrgencyColor(alertData.urgency)}20` }}
            >
              <MaterialIcons 
                name="emergency" 
                size={12} 
                color={getUrgencyColor(alertData.urgency)} 
              />
              <Text 
                className="text-[10px] font-bold uppercase tracking-wider"
                style={{ color: getUrgencyColor(alertData.urgency) }}
              >
                URGENCE {getUrgencyLabel(alertData.urgency)}
              </Text>
            </View>
          </View>

          <Text className="text-xl font-extrabold text-on-surface leading-tight mb-2">
            URGENT: Donneurs {alertData.bloodType} recherchés
          </Text>
          
          <View className="flex-row items-center gap-2 mb-2">
            <MaterialIcons name="local-hospital" size={16} color="#006591" />
            <Text className="text-sm text-on-surface">{alertData.centerName}</Text>
          </View>
          
          {alertData.radiusKm && (
            <View className="flex-row items-center gap-2 mb-2">
              <MaterialIcons name="location-on" size={16} color="#b80035" />
              <Text className="text-sm text-on-surface-variant">Rayon: {alertData.radiusKm}km</Text>
            </View>
          )}
          
          <Text className="text-sm text-on-surface-variant mt-2">
            {alertData.description}
          </Text>
        </View>

        {/* Generate Link Section */}
        <View className="bg-surface-container-lowest rounded-2xl p-5 mb-4 border border-black/5">
          <Text className="text-sm font-bold text-on-surface mb-3">
            Lien de partage parrainé
          </Text>
          
          {shareLink ? (
            <View className="flex-1 bg-surface-container-highest p-3 rounded-xl">
              <Text className="text-[10px] text-on-surface-variant uppercase font-bold mb-1">
                Urgence
              </Text>
              <Text className="text-lg font-extrabold text-primary">{getUrgencyLabel(alertData.urgency)}</Text>
            </View>
          ) : (
            <Text className="text-sm text-on-surface-variant mb-3">
              Générez un lien unique pour suivre l'impact de votre partage
            </Text>
          )}
          
          <Button
            onPress={generateLink}
            loading={loading}
            className="w-full mt-3"
          >
            {shareLink ? "Regénérer le lien" : "Générer le lien de partage"}
          </Button>
        </View>

        {/* Share Options */}
        <View className="bg-surface-container-lowest rounded-2xl p-5 mb-4 border border-black/5">
          <Text className="text-sm font-bold text-on-surface mb-3">
            Options de partage
          </Text>
          
          <View className="space-y-2">
            <Pressable
              onPress={shareViaWhatsApp}
              className="flex-row items-center gap-3 p-3 bg-green-50 rounded-xl border border-green-100 active:bg-green-100"
              disabled={!shareLink}
            >
              <View className="w-10 h-10 bg-green-500 rounded-full items-center justify-center">
                <MaterialIcons name="chat" size={20} color="#ffffff" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-semibold text-on-surface">WhatsApp</Text>
                <Text className="text-xs text-on-surface-variant">Partager via WhatsApp</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color="#906f70" />
            </Pressable>

            <Pressable
              onPress={shareViaSMS}
              className="flex-row items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100 active:bg-blue-100"
              disabled={!shareLink}
            >
              <View className="w-10 h-10 bg-blue-500 rounded-full items-center justify-center">
                <MaterialIcons name="sms" size={20} color="#ffffff" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-semibold text-on-surface">SMS</Text>
                <Text className="text-xs text-on-surface-variant">Partager par message texte</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color="#906f70" />
            </Pressable>

            <Pressable
              onPress={shareViaEmail}
              className="flex-row items-center gap-3 p-3 bg-purple-50 rounded-xl border border-purple-100 active:bg-purple-100"
              disabled={!shareLink}
            >
              <View className="w-10 h-10 bg-purple-500 rounded-full items-center justify-center">
                <MaterialIcons name="email" size={20} color="#ffffff" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-semibold text-on-surface">Email</Text>
                <Text className="text-xs text-on-surface-variant">Partager par email</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color="#906f70" />
            </Pressable>

            <Pressable
              onPress={shareNative}
              className="flex-row items-center gap-3 p-3 bg-surface-container-highest rounded-xl border border-black/5 active:bg-surface-container-low"
              disabled={!shareLink}
            >
              <View className="w-10 h-10 bg-tertiary rounded-full items-center justify-center">
                <MaterialIcons name="share" size={20} color="#ffffff" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-semibold text-on-surface">Partage système</Text>
                <Text className="text-xs text-on-surface-variant">Partager avec les applications installées</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color="#906f70" />
            </Pressable>

            <Pressable
              onPress={copyLink}
              className="flex-row items-center gap-3 p-3 bg-surface-container-highest rounded-xl border border-black/5 active:bg-surface-container-low"
              disabled={!shareLink}
            >
              <View className="w-10 h-10 bg-secondary rounded-full items-center justify-center">
                <MaterialIcons name="content-copy" size={20} color="#ffffff" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-semibold text-on-surface">Copier le lien</Text>
                <Text className="text-xs text-on-surface-variant">Copier dans le presse-papiers</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color="#906f70" />
            </Pressable>
          </View>
        </View>

        {/* Impact Info */}
        <View className="bg-tertiary-container/10 rounded-2xl p-4 border border-tertiary/20">
          <View className="flex-row items-center gap-2 mb-2">
            <MaterialIcons name="info" size={16} color="#006847" />
            <Text className="text-sm font-semibold text-tertiary">
              Impact de votre partage
            </Text>
          </View>
          <Text className="text-xs text-on-surface-variant leading-relaxed">
            Chaque partage peut potentiellement atteindre des centaines de personnes. 
            Votre lien parrainé nous permet de suivre combien de donneurs ont été mobilisés 
            grâce à votre action et de vous remercier pour votre impact.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
