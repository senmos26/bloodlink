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
import Toast, { type ToastType } from "@/components/ui/Toast";
import { supabase } from "@/services/supabase";

const SUCCESS_REDIRECT_DELAY_MS = 1600;

export default function RegisterScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
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

  const validate = () => {
    if (!email || !password || !confirmPassword || !fullName) {
      showToast("Veuillez remplir tous les champs", "error");
      return false;
    }
    if (password !== confirmPassword) {
      showToast("Les mots de passe ne correspondent pas", "error");
      return false;
    }
    if (password.length < 6) {
      showToast("Le mot de passe doit contenir au moins 6 caractères", "error");
      return false;
    }
    return true;
  };

  const handleRegister = async () => {
    hideToast();
    if (!validate()) return;

    setLoading(true);
    const { error: authError, data } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          phone: "",
          blood_type: null,
        },
      },
    });
    setLoading(false);
    if (authError) {
      showToast(authError.message, "error");
    } else if (data.user?.identities?.length === 0) {
      showToast("Cet email est déjà enregistré. Veuillez vous connecter.", "error");
    } else if (data.session) {
      showToast("Inscription réussie !", "success");
      setTimeout(() => {
        router.replace("/(tabs)");
      }, SUCCESS_REDIRECT_DELAY_MS);
    } else {
      showToast(
        "Compte créé, mais la confirmation email est encore active dans Supabase.",
        "warning"
      );
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
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          className="flex-1 px-6"
          contentContainerStyle={{ paddingVertical: 32 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View className="items-center mb-6">
            <View className="w-16 h-16 bg-primary/10 rounded-full items-center justify-center mb-4">
              <MaterialIcons name="person-add" size={28} color="#b80035" />
            </View>
            <Text className="text-xl font-extrabold text-on-surface text-center">
              Blood<Text className="text-primary">Link</Text>
            </Text>
            <Text className="text-sm text-on-surface-variant text-center mt-1">
              Créez votre compte en 30 secondes
            </Text>
          </View>

          <View className="gap-4">
            <Input
              label="Nom complet"
              placeholder="Jean Dupont"
              value={fullName}
              onChangeText={setFullName}
              icon={<MaterialIcons name="person" size={20} color="#906f70" />}
            />
            <Input
              label="Email"
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
            <Input
              label="Confirmer le mot de passe"
              placeholder="••••••••"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              icon={<MaterialIcons name="lock" size={20} color="#906f70" />}
            />
          </View>

          <Button
            onPress={handleRegister}
            loading={loading}
            className="mt-8"
          >
            S'inscrire
          </Button>

          <Link href="/(auth)/login" asChild>
            <Pressable className="items-center py-4 mt-4">
              <Text className="text-sm text-on-surface-variant">
                Déjà un compte ?{" "}
                <Text className="text-primary font-bold">Se connecter</Text>
              </Text>
            </Pressable>
          </Link>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
