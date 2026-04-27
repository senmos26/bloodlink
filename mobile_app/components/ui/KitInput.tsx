import { useState, type ReactElement } from "react";
import { MaterialIcons } from "@expo/vector-icons";
import { Input as RNEInput } from "@rneui/themed";
import type { InputProps as RNEInputProps } from "@rneui/themed";

const COLORS = {
  surface: "#fff8f8",
  border: "#d7c1c2",
  borderFocused: "#b80035",
  borderError: "#ba1a1a",
  text: "#1f1a1b",
  muted: "#6f585a",
  placeholder: "#906f70",
};

type KitInputProps = Omit<RNEInputProps, "leftIcon" | "rightIcon"> & {
  label?: string;
  error?: string;
  helperText?: string;
  iconName?: keyof typeof MaterialIcons.glyphMap;
  rightAdornment?: ReactElement<{}, any>;
};

export default function KitInput({
  label,
  error,
  helperText,
  iconName,
  rightAdornment,
  onFocus,
  onBlur,
  ...props
}: KitInputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <RNEInput
      {...props}
      label={label}
      leftIcon={
        iconName ? <MaterialIcons name={iconName} size={20} color={focused ? COLORS.borderFocused : COLORS.placeholder} /> : undefined
      }
      rightIcon={rightAdornment}
      containerStyle={{ paddingHorizontal: 0 }}
      inputContainerStyle={{
        minHeight: 56,
        paddingHorizontal: 14,
        borderWidth: 1.5,
        borderBottomWidth: 1.5,
        borderRadius: 18,
        backgroundColor: COLORS.surface,
        borderColor: error ? COLORS.borderError : focused ? COLORS.borderFocused : COLORS.border,
      }}
      labelStyle={{
        marginBottom: 6,
        fontSize: 12,
        fontWeight: "700",
        textTransform: "uppercase",
        letterSpacing: 0.8,
        color: COLORS.muted,
      }}
      inputStyle={{
        color: COLORS.text,
        fontSize: 16,
        fontWeight: "600",
      }}
      placeholderTextColor={COLORS.placeholder}
      errorMessage={error ?? helperText ?? ""}
      errorStyle={{
        color: error ? COLORS.borderError : COLORS.muted,
        fontSize: 12,
        marginTop: 6,
      }}
      renderErrorMessage={Boolean(error || helperText)}
      onFocus={(event) => {
        setFocused(true);
        onFocus?.(event);
      }}
      onBlur={(event) => {
        setFocused(false);
        onBlur?.(event);
      }}
    />
  );
}
