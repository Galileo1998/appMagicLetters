import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { ChildBackground } from "./components/ChildBackground";

export default function CreateDisabledScreen() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <ChildBackground />
      <Text style={styles.title}>Cartas asignadas</Text>
      <Text style={styles.text}>
        Las cartas se crean y asignan desde Administración. Sincroniza con señal antes de salir a campo.
      </Text>
      <TouchableOpacity style={styles.button} onPress={() => router.replace("/")}>
        <Text style={styles.buttonText}>Volver</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 24, backgroundColor: "#F7FCFF" },
  title: { fontSize: 22, fontWeight: "900", marginBottom: 12 },
  text: { color: "#556", lineHeight: 22 },
  button: { backgroundColor: "#1e62d0", padding: 14, borderRadius: 10, marginTop: 22, alignItems: "center" },
  buttonText: { color: "white", fontWeight: "800" },
});
