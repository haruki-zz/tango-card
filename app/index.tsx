import { StyleSheet, Text, View } from "react-native";

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tango Card</Text>
      <Text style={styles.subtitle}>日语单词记忆的基础环境已就绪。</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f7f7f7",
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#222222",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#444444",
    textAlign: "center",
  },
});
