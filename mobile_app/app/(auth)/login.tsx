import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link, router } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import SocialAuthButton from "@/components/ui/SocialAuthButton";
import Toast, { type ToastType } from "@/components/ui/Toast";
import { supabase } from "@/services/supabase";

const SUCCESS_REDIRECT_DELAY_MS = 1600;

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

  const handleSocialLogin = (provider: "google" | "apple") => {
    const providerName = provider === "google" ? "Google" : "Apple";
    showToast(`${providerName} login sera branché juste après la config OAuth Supabase.`, "info");
  };

  const handleLogin = async () => {
    if (!email || !password) {
      showToast("Veuillez remplir tous les champs", "error");
      return;
    }

    setLoading(true);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (authError) {
      showToast(authError.message === "Invalid login credentials"
        ? "Email ou mot de passe incorrect"
        : authError.message, "error");
      return;
    }

    showToast("Connexion réussie !", "success");
    setTimeout(() => {
      router.replace("/(tabs)");
    }, SUCCESS_REDIRECT_DELAY_MS);
  };

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onDismiss={hideToast}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          className="flex-1 px-6"
          contentContainerStyle={{ paddingVertical: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View className="items-center mb-10">
            <View className="w-20 h-20 bg-primary/10 rounded-full items-center justify-center mb-6">
              <MaterialIcons name="bloodtype" size={40} color="#b80035" />
            </View>
            <Text className="text-2xl font-extrabold text-on-surface text-center">
              Blood<Text className="text-primary">Link</Text>
            </Text>
            <Text className="text-sm text-on-surface-variant text-center mt-2 max-w-[260px]">
              Connectez-vous pour sauver des vies
            </Text>
          </View>

          {/* Form */}
          <View className="gap-4 mb-6">
            <Input
              label="Adresse email"
              placeholder="exemple@email.com"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              icon={<MaterialIcons name="email" size={20} color="#906f70" />}
            />
            <Input
              label="Mot de passe"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              icon={<MaterialIcons name="lock" size={20} color="#906f70" />}
            />
          </View>

          <Button
            onPress={handleLogin}
            loading={loading}
            className="mb-4"
          >
            Se connecter
          </Button>

          <View className="mb-6 gap-3">
            <View className="flex-row items-center gap-3">
              <View className="flex-1 h-px bg-surface-container-high" />
              <Text className="text-xs font-medium uppercase tracking-[1.8px] text-on-surface-variant">
                ou continuer avec
              </Text>
              <View className="flex-1 h-px bg-surface-container-high" />
            </View>
            <SocialAuthButton provider="google" onPress={() => handleSocialLogin("google")} />
            <SocialAuthButton provider="apple" onPress={() => handleSocialLogin("apple")} />
          </View>

          <Link href="/(auth)/register" asChild>
            <Pressable className="items-center py-3">
              <Text className="text-sm text-on-surface-variant">
                Pas encore de compte ?{" "}
                <Text className="text-primary font-bold">S'inscrire</Text>
              </Text>
            </Pressable>
          </Link>

          {/* Footer */}
          <View className="items-center mt-10 gap-2">
            <View className="flex-row items-center gap-2">
              <MaterialIcons name="verified-user" size={16} color="#906f70" />
              <Text className="text-[10px] text-on-surface-variant">
                Données sécurisées et confidentielles
              </Text>
            </View>
            <Text className="text-[10px] text-on-surface-variant">
              BloodLink v1.0
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
