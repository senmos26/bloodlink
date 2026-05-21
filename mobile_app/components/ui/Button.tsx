import { Pressable, Text, ActivityIndicator, View } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from "react-native-reanimated";
import { cn } from "@/lib/utils";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type ButtonProps = {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  icon?: React.ReactNode;
};

export default function Button({
  children,
  onPress,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  className,
  icon,
}: ButtonProps) {
  const base =
    "flex-row items-center justify-center rounded-2xl font-semibold";

  const variants = {
    primary: "bg-primary",
    secondary: "bg-secondary",
    outline: "border-2 border-surface-container-high bg-transparent",
    ghost: "bg-transparent",
  };

  const sizes = {
    sm: "px-4 py-2.5",
    md: "px-5 py-3.5",
    lg: "px-6 py-4",
  };

  const textColors = {
    primary: "text-white",
    secondary: "text-white",
    outline: "text-on-surface",
    ghost: "text-primary",
  };

  const textSizes = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const handlePressIn = () => {
    if (!disabled && !loading) {
      scale.value = withSpring(0.96, { damping: 12, stiffness: 250 });
    }
  };

  const handlePressOut = () => {
    if (!disabled && !loading) {
      scale.value = withSpring(1, { damping: 12, stiffness: 250 });
    }
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      style={animatedStyle}
      className={cn(base, variants[variant], sizes[size], className)}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === "primary" || variant === "secondary" ? "#fff" : "#b80035"}
        />
      ) : (
        <>
          {icon && <View className="mr-2">{icon}</View>}
          <Text className={cn("font-bold", textColors[variant], textSizes[size])}>
            {children}
          </Text>
        </>
      )}
    </AnimatedPressable>
  );
}

