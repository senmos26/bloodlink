import { MaterialIcons } from "@expo/vector-icons";
import { useId } from "react";

const COLORS = {
  surface: "#fff8f8",
  border: "#d7c1c2",
  text: "#1f1a1b",
  muted: "#6f585a",
  error: "#ba1a1a",
  placeholder: "#906f70",
};

type ProfileDateInputProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  helperText?: string;
  maximumDate?: Date;
  minimumDate?: Date;
};

function toIsoBoundary(date?: Date) {
  if (!date) {
    return undefined;
  }

  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function ProfileDateInput({
  label,
  value,
  onChange,
  error,
  helperText,
  maximumDate,
  minimumDate,
}: ProfileDateInputProps) {
  const inputId = useId();

  return (
    <div style={{ marginBottom: 10 }}>
      <label
        htmlFor={inputId}
        style={{
          display: "block",
          marginBottom: 6,
          fontSize: 12,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: 0.8,
          color: COLORS.muted,
        }}
      >
        {label}
      </label>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          minHeight: 56,
          padding: "0 14px",
          borderRadius: 18,
          border: `1.5px solid ${error ? COLORS.error : COLORS.border}`,
          backgroundColor: COLORS.surface,
        }}
      >
        <MaterialIcons name="calendar-month" size={20} color={COLORS.placeholder} />
        <input
          id={inputId}
          type="date"
          value={value}
          min={toIsoBoundary(minimumDate)}
          max={toIsoBoundary(maximumDate)}
          onChange={(event) => onChange(event.target.value)}
          style={{
            flex: 1,
            border: "none",
            outline: "none",
            background: "transparent",
            color: COLORS.text,
            fontSize: 16,
            fontWeight: 600,
          }}
        />
      </div>
      {(error || helperText) && (
        <div
          style={{
            marginTop: 6,
            fontSize: 12,
            color: error ? COLORS.error : COLORS.muted,
          }}
        >
          {error ?? helperText}
        </div>
      )}
    </div>
  );
}
