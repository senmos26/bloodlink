import { AntDesign, Ionicons } from "@expo/vector-icons";
import { Button } from "@rneui/themed";

interface SocialAuthButtonProps {
  provider: "google" | "apple";
  onPress: () => void;
  loading?: boolean;
}

const providerConfig = {
  google: {
    label: "Continuer avec Google",
    buttonColor: "#ffffff",
    textColor: "#111827",
    borderColor: "#E5E7EB",
    icon: <AntDesign name="google" size={18} color="#DB4437" />,
  },
  apple: {
    label: "Continuer avec Apple",
    buttonColor: "#111111",
    textColor: "#ffffff",
    borderColor: "#111111",
    icon: <Ionicons name="logo-apple" size={20} color="#ffffff" />,
  },
} as const;

export default function SocialAuthButton({ provider, onPress, loading = false }: SocialAuthButtonProps) {
  const config = providerConfig[provider];

  return (
    <Button
      type="solid"
      onPress={onPress}
      loading={loading}
      disabled={loading}
      title={config.label}
      icon={config.icon}
      buttonStyle={{
        backgroundColor: config.buttonColor,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: config.borderColor,
      }}
      containerStyle={{
        borderRadius: 18,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: provider === "apple" ? 0.2 : 0.08,
        shadowRadius: 18,
        elevation: provider === "apple" ? 8 : 4,
      }}
      titleStyle={{ fontSize: 15, fontWeight: "700", letterSpacing: 0.2, color: config.textColor }}
      iconContainerStyle={{ marginRight: 10 }}
    />
  );
}
