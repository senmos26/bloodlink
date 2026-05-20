import { useEffect } from "react";
import { Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

export default function PremiumLaunchScreen() {
  const logoScale = useSharedValue(0.82);
  const logoOpacity = useSharedValue(0);
  const contentTranslateY = useSharedValue(18);
  const ringProgress = useSharedValue(0);
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    logoOpacity.value = withTiming(1, { duration: 520, easing: Easing.out(Easing.cubic) });
    logoScale.value = withSpring(1, { damping: 13, stiffness: 120 });
    contentTranslateY.value = withDelay(180, withTiming(0, { duration: 520, easing: Easing.out(Easing.cubic) }));
    ringProgress.value = withRepeat(withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.cubic) }), -1, false);
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 950, easing: Easing.inOut(Easing.cubic) }),
        withTiming(1, { duration: 950, easing: Easing.inOut(Easing.cubic) })
      ),
      -1,
      true
    );
  }, [contentTranslateY, logoOpacity, logoScale, pulseScale, ringProgress]);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ translateY: contentTranslateY.value }],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    opacity: 0.34 - ringProgress.value * 0.28,
    transform: [{ scale: 1 + ringProgress.value * 0.52 }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  return (
    <View className="flex-1 items-center justify-center bg-[#fff7f8] px-8">
      <StatusBar style="dark" />
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: -120,
          right: -90,
          width: 260,
          height: 260,
          borderRadius: 130,
          backgroundColor: "rgba(184,0,53,0.12)",
        }}
      />
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          bottom: -130,
          left: -110,
          width: 300,
          height: 300,
          borderRadius: 150,
          backgroundColor: "rgba(0,101,145,0.10)",
        }}
      />
      <Animated.View style={[ringStyle, { position: "absolute" }]}>
        <View className="h-44 w-44 rounded-full border border-primary/20" />
      </Animated.View>
      <Animated.View style={[logoStyle, pulseStyle]}>
        <View
          className="h-32 w-32 items-center justify-center rounded-[38px] bg-white"
          style={{
            shadowColor: "#b80035",
            shadowOffset: { width: 0, height: 22 },
            shadowOpacity: 0.2,
            shadowRadius: 35,
            elevation: 12,
          }}
        >
          <View className="h-20 w-20 items-center justify-center rounded-[28px] bg-primary">
            <MaterialIcons name="bloodtype" size={46} color="#ffffff" />
          </View>
        </View>
      </Animated.View>
      <Animated.View className="mt-8 items-center" style={contentStyle}>
        <Text className="text-4xl font-extrabold tracking-tight text-on-surface">
          Blood<Text className="text-primary">Link</Text>
        </Text>
        <Text className="mt-3 max-w-[270px] text-center text-base font-semibold leading-6 text-on-surface-variant">
          Une expérience simple, humaine et sécurisée pour connecter les donneurs aux besoins réels.
        </Text>
        <View className="mt-8 flex-row items-center rounded-full bg-white px-4 py-2">
          <View className="mr-2 h-2 w-2 rounded-full bg-tertiary" />
          <Text className="text-xs font-bold uppercase tracking-[1.6px] text-on-surface-variant">
            Préparation de votre espace
          </Text>
        </View>
      </Animated.View>
    </View>
  );
}
