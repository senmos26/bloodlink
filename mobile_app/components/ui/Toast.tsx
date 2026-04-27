import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Animated,
  Pressable,
  Dimensions,
  StyleSheet,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

export type ToastType = "success" | "error" | "info" | "warning";

interface ToastProps {
  visible: boolean;
  message: string;
  type?: ToastType;
  onDismiss?: () => void;
  duration?: number;
}

const toastConfig: Record<
  ToastType,
  { icon: string; bg: string; border: string; text: string; iconColor: string }
> = {
  success: {
    icon: "check-circle",
    bg: "bg-[#E8F5E9]",
    border: "border-[#4CAF50]",
    text: "text-[#2E7D32]",
    iconColor: "#4CAF50",
  },
  error: {
    icon: "error",
    bg: "bg-[#FFEBEE]",
    border: "border-[#EF5350]",
    text: "text-[#C62828]",
    iconColor: "#EF5350",
  },
  info: {
    icon: "info",
    bg: "bg-[#E3F2FD]",
    border: "border-[#42A5F5]",
    text: "text-[#1565C0]",
    iconColor: "#42A5F5",
  },
  warning: {
    icon: "warning",
    bg: "bg-[#FFF3E0]",
    border: "border-[#FF9800]",
    text: "text-[#EF6C00]",
    iconColor: "#FF9800",
  },
};

export default function Toast({
  visible,
  message,
  type = "info",
  onDismiss,
  duration = 4000,
}: ToastProps) {
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const [isMounted, setIsMounted] = useState(visible);

  useEffect(() => {
    if (visible) {
      setIsMounted(true);
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        handleDismiss();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsMounted(false);
      onDismiss?.();
    });
  };

  if (!isMounted) return null;

  const config = toastConfig[type];

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        },
      ]}
      className="absolute top-0 left-0 right-0 z-50 px-4 pt-12"
    >
      <View
        className={`flex-row items-center p-4 rounded-2xl border-l-4 shadow-lg ${config.bg} ${config.border}`}
        style={styles.toastCard}
      >
        <MaterialIcons
          name={config.icon as any}
          size={22}
          color={config.iconColor}
        />
        <Text className={`flex-1 ml-3 text-sm font-medium ${config.text}`}>
          {message}
        </Text>
        <Pressable onPress={handleDismiss} className="ml-2 p-1">
          <MaterialIcons name="close" size={18} color={config.iconColor} />
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width,
  },
  toastCard: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
});
