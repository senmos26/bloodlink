import { useMemo, useState } from "react";
import { Platform, Pressable, Text, View } from "react-native";
import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { MaterialIcons } from "@expo/vector-icons";
import KitInput from "@/components/ui/KitInput";

function parseDateValue(value: string) {
  if (!value) {
    return new Date(2000, 0, 1);
  }

  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

function formatDateValue(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

type ProfileDateInputProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  helperText?: string;
  maximumDate?: Date;
  minimumDate?: Date;
};

export default function ProfileDateInput({
  label,
  value,
  onChange,
  error,
  helperText,
  maximumDate,
  minimumDate,
}: ProfileDateInputProps) {
  const [open, setOpen] = useState(false);
  const selectedDate = useMemo(() => parseDateValue(value), [value]);

  const handleChange = (event: DateTimePickerEvent, nextDate?: Date) => {
    if (Platform.OS === "android") {
      setOpen(false);
    }

    if (event.type === "dismissed" || !nextDate) {
      return;
    }

    onChange(formatDateValue(nextDate));
  };

  return (
    <View>
      <Pressable onPress={() => setOpen((prev) => !prev)}>
        <View pointerEvents="none">
          <KitInput
            label={label}
            value={value ? selectedDate.toLocaleDateString("fr-FR") : ""}
            placeholder="Choisir une date"
            editable={false}
            error={error}
            helperText={helperText}
            iconName="calendar-month"
            rightAdornment={<MaterialIcons name={open ? "expand-less" : "expand-more"} size={20} color="#906f70" />}
          />
        </View>
      </Pressable>

      {open && (
        <View className="mt-[-4] rounded-2xl border border-surface-container-high bg-surface-container-lowest px-3 pb-2">
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={handleChange}
            maximumDate={maximumDate}
            minimumDate={minimumDate}
          />
          {Platform.OS === "ios" && (
            <Pressable onPress={() => setOpen(false)} className="self-end px-3 py-2">
              <Text className="text-sm font-bold text-primary">Terminer</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}
