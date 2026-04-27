import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import Button from "@/components/ui/Button";
import { supabase } from "@/services/supabase";

export default function VerifyOtpScreen() {
  const { email, mode } = useLocalSearchParams<{ email: string; mode: string }>();
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendTimer, setResendTimer] = useState(60);
  const inputs = useRef<(TextInput | null)[]>([]);

  // Resend timer
  useEffect(() => {
    const interval = setInterval(() => {
      setResendTimer((t) => (t > 0 ? t - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleChange = (text: string, index: number) => {
    if (text.length > 1) text = text[text.length - 1];
    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);
    setError("");

    if (text && index < 5) {
      inputs.current[index + 1]?.focus();
    }

    // Auto-submit when full
    if (index === 5 && text) {
      const fullCode = [...newCode.slice(0, 5), text].join("");
      if (fullCode.length === 6) {
        handleVerify(fullCode);
      }
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && !code[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (fullCode?: string) => {
    const otp = fullCode || code.join("");
    if (otp.length !== 6) {
      setError("Veuillez entrer le code complet");
      return;
    }

    setLoading(true);
    setError("");

    const { error: verifyError } = await supabase.auth.verifyOtp({
      email: email!,
      token: otp,
      type: "email",
    });

    setLoading(false);

    if (verifyError) {
      setError("Code invalide ou expiré");
      return;
    }

    // Success - go to app
    router.replace("/(tabs)");
  };

  const handleResend = async () => {
    setResendTimer(60);
    await supabase.auth.signInWithOtp({
      email: email!,
      options: { shouldCreateUser: mode === "signup" },
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 px-6 justify-center"
      >
        {/* Header */}
        <View className="items-center mb-8">
          <View className="w-16 h-16 bg-primary/10 rounded-full items-center justify-center mb-4">
            <MaterialIcons name="mark-email-read" size={28} color="#b80035" />
          </View>
          <Text className="text-xl font-extrabold text-on-surface text-center">
            Vérification
          </Text>
          <Text className="text-sm text-on-surface-variant text-center mt-2 max-w-[280px]">
            Entrez le code à 6 chiffres envoyé à{"\n"}
            <Text className="font-semibold text-on-surface">{email}</Text>
          </Text>
        </View>

        {/* OTP Inputs */}
        <View className="flex-row justify-center gap-3 mb-6">
          {code.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => {
                inputs.current[index] = ref;
              }}
              value={digit}
              onChangeText={(text) => handleChange(text, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              keyboardType="number-pad"
              maxLength={1}
              className={`w-12 h-14 rounded-xl border-2 text-center text-xl font-bold text-on-surface bg-surface-container-lowest ${
                digit ? "border-primary" : "border-surface-container-high"
              }`}
              autoFocus={index === 0}
              selectTextOnFocus
            />
          ))}
        </View>

        {error ? (
          <View className="mb-4 p-3 bg-error/10 rounded-xl">
            <Text className="text-error text-sm text-center">{error}</Text>
          </View>
        ) : null}

        <Button onPress={() => handleVerify()} loading={loading} className="mb-4">
          Vérifier
        </Button>

        {/* Resend */}
        <View className="items-center">
          {resendTimer > 0 ? (
            <Text className="text-sm text-on-surface-variant">
              Renvoyer dans{" "}
              <Text className="font-semibold text-primary">{resendTimer}s</Text>
            </Text>
          ) : (
            <Pressable onPress={handleResend}>
              <Text className="text-sm text-primary font-bold">
                Renvoyer le code
              </Text>
            </Pressable>
          )}
        </View>

        {/* Change email */}
        <Pressable
          onPress={() => router.back()}
          className="items-center mt-6"
        >
          <Text className="text-sm text-on-surface-variant">
            Mauvais email ?{" "}
            <Text className="text-primary font-bold">Modifier</Text>
          </Text>
        </Pressable>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
