import { Modal, Pressable, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Avatar } from "@rneui/themed";
import Button from "@/components/ui/Button";

type ProfileAvatarModalProps = {
  visible: boolean;
  imageUrl: string | null;
  uploading?: boolean;
  onClose: () => void;
  onChangePhoto: () => void;
  onRemovePhoto: () => void;
};

export default function ProfileAvatarModal({
  visible,
  imageUrl,
  uploading = false,
  onClose,
  onChangePhoto,
  onRemovePhoto,
}: ProfileAvatarModalProps) {
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View className="flex-1 bg-black/90">
        <View className="flex-row items-center justify-between px-5 pt-14 pb-4">
          <Pressable
            onPress={onClose}
            className="h-11 w-11 items-center justify-center rounded-full bg-white/12 active:opacity-80"
          >
            <MaterialIcons name="close" size={24} color="#ffffff" />
          </Pressable>
          <Text className="text-sm font-bold uppercase tracking-widest text-white/80">Photo de profil</Text>
          <View className="h-11 w-11" />
        </View>

        <View className="flex-1 items-center justify-center px-6">
          <Avatar
            size={280}
            rounded
            source={imageUrl ? { uri: imageUrl } : undefined}
            title={imageUrl ? undefined : ""}
            containerStyle={{
              backgroundColor: "#111111",
              borderWidth: imageUrl ? 4 : 0,
              borderColor: "#f4cfd7",
            }}
            titleStyle={{ color: "transparent", fontWeight: "800", fontSize: 48 }}
            icon={!imageUrl ? { name: "person", type: "material", color: "#5f5f5f", size: 120 } : undefined}
          />
        </View>

        <View className="px-5 pb-8 pt-2 gap-3">
          <Button onPress={onChangePhoto} loading={uploading} className="w-full">
            Changer la photo
          </Button>
          <Button onPress={onRemovePhoto} variant="outline" className="w-full bg-white" disabled={uploading || !imageUrl}>
            Supprimer
          </Button>
        </View>
      </View>
    </Modal>
  );
}
