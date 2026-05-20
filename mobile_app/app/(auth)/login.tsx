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
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import SocialAuthButton from "@/components/ui/SocialAuthButton";
import Toast, { type ToastType } from "@/components/ui/Toast";
import { getRedirectUrl, supabase } from "@/services/supabase";

WebBrowser.maybeCompleteAuthSession();

const SUCCESS_REDIRECT_DELAY_MS = 1600;

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<"google" | "apple" | null>(null);
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

  const verifyDonorAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, is_active")
      .eq("id", user.id)
      .single();

    if (!profile?.is_active) {
      await supabase.auth.signOut();
      showToast("Votre compte a été désactivé. Contactez le support.", "error");
      return false;
    }

    if (profile?.role !== "donor") {
      await supabase.auth.signOut();
      const platform = profile?.role === "center_admin" ? "le portail Centre" : "le portail Administrateur";
      showToast(`Ce compte est réservé aux centres de santé. Connectez-vous sur ${platform}.`, "error");
      return false;
    }

    return true;
  };

  const handleSocialLogin = async (provider: "google" | "apple") => {
    if (provider === "apple") {
      showToast("Apple login sera branché après la configuration Apple Developer.", "info");
      return;
    }

    hideToast();
    setSocialLoading(provider);

    const redirectTo = getRedirectUrl();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo,
        skipBrowserRedirect: true,
        queryParams: {
          access_type: "offline",
          prompt: "select_account",
        },
      },
    });

    if (error) {
      setSocialLoading(null);
      showToast(error.message, "error");
      return;
    }

    if (!data.url) {
      setSocialLoading(null);
      showToast("Impossible d'ouvrir la connexion Google.", "error");
      return;
    }

    const authResult = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

    if (authResult.type !== "success") {
      setSocialLoading(null);
      if (authResult.type === "cancel") {
        showToast("Connexion Google annulée.", "info");
      }
      return;
    }

    const parsedUrl = Linking.parse(authResult.url);
    const codeParam = parsedUrl.queryParams?.code;
    const code = Array.isArray(codeParam) ? codeParam[0] : codeParam;

    if (!code) {
      setSocialLoading(null);
      showToast("Google n'a pas retourné de code de connexion.", "error");
      return;
    }

    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      setSocialLoading(null);
      showToast(exchangeError.message, "error");
      return;
    }

    const isAllowed = await verifyDonorAccess();
    if (!isAllowed) {
      setSocialLoading(null);
      return;
    }

    setSocialLoading(null);
    showToast("Connexion Google réussie !", "success");
    setTimeout(() => {
      router.replace("/(tabs)");
    }, SUCCESS_REDIRECT_DELAY_MS);
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

    const isAllowed = await verifyDonorAccess();
    if (!isAllowed) return;

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
            <SocialAuthButton
              provider="google"
              onPress={() => handleSocialLogin("google")}
              loading={socialLoading === "google"}
            />
            <SocialAuthButton
              provider="apple"
              onPress={() => handleSocialLogin("apple")}
              loading={socialLoading === "apple"}
            />
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
