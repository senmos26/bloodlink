import { View, Text, StyleSheet } from "react-native";

export default function DonationsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mes dons</Text>
      <Text>Historique des dons — à implémenter</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 16 },
});
