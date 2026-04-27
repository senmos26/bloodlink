import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  TextInputProps,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { cn } from "@/lib/utils";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export default function Input({
  label,
  error,
  icon,
  secureTextEntry,
  className,
  ...props
}: InputProps) {
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = secureTextEntry;

  return (
    <View className={className}>
      {label && (
        <Text className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">
          {label}
        </Text>
      )}
      <View
        className={cn(
          "flex-row items-center bg-surface-container-lowest rounded-xl border-2 px-4 py-3.5",
          focused ? "border-primary" : "border-surface-container-high",
          error ? "border-error" : ""
        )}
      >
        {icon && <View className="mr-3">{icon}</View>}
        <TextInput
          className="flex-1 text-base text-on-surface font-medium"
          placeholderTextColor="#906f70"
          secureTextEntry={isPassword && !showPassword}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...props}
        />
        {isPassword && (
          <Pressable onPress={() => setShowPassword(!showPassword)} className="ml-2">
            <MaterialIcons
              name={showPassword ? "visibility" : "visibility-off"}
              size={20}
              color="#906f70"
            />
          </Pressable>
        )}
      </View>
      {error && <Text className="text-error text-xs mt-1">{error}</Text>}
    </View>
  );
}
