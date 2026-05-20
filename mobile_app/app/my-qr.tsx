import { useEffect, useState } from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import QRCode from "react-native-qrcode-svg";
import { useAuth } from "@/hooks/useAuth";

interface QRData {
  donor_id: string;
  timestamp: number;
}

const { width } = Dimensions.get("window");
const QR_SIZE = Math.min(width * 0.7, 280);

export default function MyQRScreen() {
  const { user, loading } = useAuth();
  const [qrData, setQrData] = useState<QRData | null>(null);
  const [refreshInterval, setRefreshInterval] = useState<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (user?.id) {
      // Générer les données QR avec timestamp actuel
      const generateQRData = () => {
        const data: QRData = {
          donor_id: user.id,
          timestamp: Date.now(),
        };
        setQrData(data);
      };

      // Générer immédiatement
      generateQRData();

      // Rafraîchir toutes les 5 minutes (300000ms) pour éviter l'expiration
      const interval = setInterval(generateQRData, 300000);
      setRefreshInterval(interval);

      return () => {
        if (interval) {
          clearInterval(interval);
        }
      };
    }
  }, [user?.id]);

  useEffect(() => {
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [refreshInterval]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <MaterialIcons name="qr-code-scanner" size={48} color="#b80035" />
          <Text style={styles.title}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <MaterialIcons name="error" size={48} color="#ba1a1a" />
          <Text style={styles.title}>Erreur d'authentification</Text>
          <Text style={styles.subtitle}>
            Vous devez être connecté pour accéder à votre QR code
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <MaterialIcons name="qr-code-2" size={48} color="#b80035" />
          <Text style={styles.title}>Mon QR Code</Text>
          <Text style={styles.subtitle}>
            Présentez ce code à l'agent du centre de don
          </Text>
        </View>

        <View style={styles.qrContainer}>
          {qrData && (
            <View style={styles.qrWrapper}>
              <QRCode
                value={JSON.stringify(qrData)}
                size={QR_SIZE}
                color="#000000"
                backgroundColor="#FFFFFF"
                logoSize={60}
                logoBackgroundColor="transparent"
              />
            </View>
          )}
        </View>

        <View style={styles.infoContainer}>
          <View style={styles.infoItem}>
            <MaterialIcons name="person" size={20} color="#5c3f40" />
            <Text style={styles.infoText}>
              {user.user_metadata?.full_name || "Donneur"}
            </Text>
          </View>
          
          <View style={styles.infoItem}>
            <MaterialIcons name="schedule" size={20} color="#5c3f40" />
            <Text style={styles.infoText}>
              Valide 10 minutes • Regénéré automatiquement
            </Text>
          </View>

          <View style={styles.warningContainer}>
            <MaterialIcons name="info" size={16} color="#f59e0b" />
            <Text style={styles.warningText}>
              Ce code est personnel et ne doit pas être partagé
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1c1c1c",
    marginTop: 16,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#666666",
    marginTop: 8,
    textAlign: "center",
    lineHeight: 22,
  },
  qrContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  qrWrapper: {
    padding: 20,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  infoContainer: {
    gap: 16,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
  },
  infoText: {
    fontSize: 14,
    color: "#1c1c1c",
    flex: 1,
  },
  warningContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fef3c7",
    borderRadius: 12,
    marginTop: 8,
  },
  warningText: {
    fontSize: 12,
    color: "#92400e",
    flex: 1,
    lineHeight: 16,
  },
});
