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
import { supabase } from "@/services/supabase";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Veuillez remplir tous les champs");
      return;
    }
    setLoading(true);
    setError("");
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (authError) {
      setError(authError.message);
    } else {
      router.replace("/(tabs)");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-surface">
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

          {error ? (
            <Text className="text-error text-sm text-center mb-4">{error}</Text>
          ) : null}

          <Button
            onPress={handleLogin}
            loading={loading}
            className="mb-4"
          >
            Se connecter
          </Button>

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
