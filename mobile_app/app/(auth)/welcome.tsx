import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View, useWindowDimensions } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

interface WelcomeSlide {
  eyebrow: string;
  title: string;
  description: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  accent: string;
}

const SLIDES: WelcomeSlide[] = [
  {
    eyebrow: "Impact immédiat",
    title: "Un geste peut changer une journée, parfois une vie.",
    description: "Découvrez rapidement les besoins proches de vous et gardez une vision claire de votre contribution.",
    icon: "favorite",
    accent: "#b80035",
  },
  {
    eyebrow: "Centres proches",
    title: "Trouvez le bon centre sans friction.",
    description: "Carte, distance, horaires et informations essentielles sont réunis dans une interface calme et lisible.",
    icon: "map",
    accent: "#006591",
  },
  {
    eyebrow: "Alertes utiles",
    title: "Recevez les bonnes alertes, au bon moment.",
    description: "BloodLink vous aide à rester disponible quand votre profil peut réellement aider une urgence.",
    icon: "notifications-active",
    accent: "#006847",
  },
];

export default function WelcomeScreen() {
  const [index, setIndex] = useState(0);
  const progress = useSharedValue(1);
  const { height, width } = useWindowDimensions();
  const slide = SLIDES[index];

  const isLastSlide = index === SLIDES.length - 1;
  const heroHeight = height < 760 ? 220 : 288;
  const cardWidth = useMemo(() => Math.min(width - 48, 360), [width]);

  useEffect(() => {
    progress.value = 0;
    progress.value = withSpring(1, { damping: 16, stiffness: 140 });
  }, [index, progress]);

  const goToSlide = (nextIndex: number) => {
    if (nextIndex === index) return;

    progress.value = withTiming(0, { duration: 120, easing: Easing.out(Easing.quad) });
    setTimeout(() => {
      setIndex(nextIndex);
    }, 120);
  };

  const handlePrimaryPress = () => {
    if (isLastSlide) {
      router.push("/(auth)/register");
      return;
    }
    goToSlide(index + 1);
  };

  const cardStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0.72, 1]),
    transform: [
      { translateY: interpolate(progress.value, [0, 1], [14, 0]) },
      { scale: interpolate(progress.value, [0, 1], [0.985, 1]) },
    ],
  }));

  return (
    <SafeAreaView className="flex-1 bg-[#fff7f8]">
      <View className="flex-1 bg-[#fff7f8] px-6 pb-6 pt-4">
        <View className="absolute -right-24 -top-20 h-72 w-72 rounded-full bg-primary/10" />
        <View className="absolute -bottom-24 -left-28 h-80 w-80 rounded-full bg-secondary/10" />
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <View className="mr-3 h-11 w-11 items-center justify-center rounded-2xl bg-white">
              <MaterialIcons name="bloodtype" size={24} color="#b80035" />
            </View>
            <Text className="text-xl font-extrabold text-on-surface">
              Blood<Text className="text-primary">Link</Text>
            </Text>
          </View>
          <Pressable onPress={() => router.push("/(auth)/login")} className="rounded-full bg-white/80 px-4 py-2">
            <Text className="text-sm font-bold text-on-surface">Connexion</Text>
          </Pressable>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center", alignItems: "center", paddingVertical: 22 }}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={[
              cardStyle,
              {
                width: cardWidth,
                shadowColor: slide.accent,
                shadowOffset: { width: 0, height: 24 },
                shadowOpacity: 0.18,
                shadowRadius: 34,
                elevation: 14,
              },
            ]}
          >
            <View className="overflow-hidden rounded-[34px] bg-white p-5">
              <View className="mb-6 overflow-hidden rounded-[28px] bg-[#f9eef1]" style={{ height: heroHeight }}>
                <View
                  style={{ backgroundColor: `${slide.accent}18` }}
                  className="absolute -right-12 -top-16 h-44 w-44 rounded-full"
                />
                <View
                  style={{ backgroundColor: `${slide.accent}12` }}
                  className="absolute -bottom-16 -left-16 h-56 w-56 rounded-full"
                />
                <View className="flex-1 items-center justify-center">
                  <View
                    style={{ backgroundColor: slide.accent }}
                    className="h-28 w-28 items-center justify-center rounded-[34px]"
                  >
                    <MaterialIcons name={slide.icon} size={58} color="#ffffff" />
                  </View>
                  <View className="mt-8 w-full px-8">
                    <View className="mb-3 h-3 w-4/5 rounded-full bg-white/90" />
                    <View className="mb-3 h-3 w-3/5 rounded-full bg-white/70" />
                    <View className="h-3 w-2/5 rounded-full bg-white/50" />
                  </View>
                </View>
              </View>

              <Text className="text-xs font-extrabold uppercase tracking-[2px]" style={{ color: slide.accent }}>
                {slide.eyebrow}
              </Text>
              <Text className="mt-3 text-3xl font-extrabold leading-9 tracking-tight text-on-surface">
                {slide.title}
              </Text>
              <Text className="mt-4 text-base font-medium leading-7 text-on-surface-variant">
                {slide.description}
              </Text>
            </View>
          </Animated.View>
        </ScrollView>

        <View>
          <View className="mb-6 flex-row justify-center gap-2">
            {SLIDES.map((item, slideIndex) => (
              <Pressable
                key={item.title}
                onPress={() => goToSlide(slideIndex)}
                className="h-2 rounded-full"
                style={{
                  width: slideIndex === index ? 28 : 8,
                  backgroundColor: slideIndex === index ? slide.accent : "rgba(26,28,30,0.18)",
                }}
              />
            ))}
          </View>

          <Pressable
            onPress={handlePrimaryPress}
            className="h-16 flex-row items-center justify-center rounded-[24px] bg-primary"
            style={{
              shadowColor: "#b80035",
              shadowOffset: { width: 0, height: 16 },
              shadowOpacity: 0.28,
              shadowRadius: 24,
              elevation: 10,
            }}
          >
            <Text className="mr-2 text-base font-extrabold text-white">
              {isLastSlide ? "Créer mon compte" : "Continuer"}
            </Text>
            <MaterialIcons name="arrow-forward" size={21} color="#ffffff" />
          </Pressable>

          <Pressable onPress={() => router.push("/(auth)/login")} className="items-center py-5">
            <Text className="text-sm font-bold text-on-surface-variant">J'ai déjà un compte</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
