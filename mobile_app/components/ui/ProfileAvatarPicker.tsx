import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Avatar } from "@rneui/themed";

type ProfileAvatarPickerProps = {
  imageUrl: string | null;
  initials: string;
  uploading?: boolean;
  onPress?: () => void;
};

export default function ProfileAvatarPicker({
  imageUrl,
  initials,
  uploading = false,
  onPress,
}: ProfileAvatarPickerProps) {
  return (
    <View className="items-center">
      <Pressable onPress={onPress} className="items-center active:opacity-85">
        <View className="relative mb-2">
          <Avatar
            size={92}
            rounded
            source={imageUrl ? { uri: imageUrl } : undefined}
            title={initials}
            containerStyle={{
              backgroundColor: "#eddfe0",
              borderWidth: 3,
              borderColor: "#f3d8dd",
            }}
            titleStyle={{ color: "#7b5b5e", fontWeight: "800" }}
            icon={!imageUrl ? { name: "person", type: "material", color: "#7b5b5e", size: 42 } : undefined}
          />

          <View className="absolute bottom-0 right-0 bg-tertiary p-1.5 rounded-full shadow-lg">
            {uploading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <MaterialIcons name="photo-camera" size={14} color="#ffffff" />
            )}
          </View>
        </View>
        <Text className="text-[11px] font-bold uppercase tracking-wide text-on-surface-variant">
          Gérer la photo
        </Text>
      </Pressable>
    </View>
  );
}
