import { useRouter } from "expo-router";
import React, { useState } from "react";
// 1. IMPORTAR IMAGE
import { Image, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { initDb } from "../src/db";
import { saveAuthenticatedUser } from "../src/repos/auth_repo";
import { loginRemote } from "../src/services/api";
import { ChildBackground } from "./components/ChildBackground";

export default function Login() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [err, setErr] = useState<string | null>(null);

  async function onLogin() {
    try {
      setErr(null);
      await initDb();
      const p = phone.trim();
      
      const remoteUser = await loginRemote(p, pin);
      await saveAuthenticatedUser(remoteUser);
      router.replace("/");

    } catch (e: any) {
      setErr(e?.message || "Se necesita conexión para el primer inicio de sesión.");
    }
  }

  return (
    <View style={styles.container}>
      <ChildBackground />
      
      {/* 2. AQUÍ VA EL LOGO */}
      {/* Asegúrate que la ruta sea correcta, normalmente subiendo un nivel con ../ */}
      <Image 
        source={require('../assets/logo.png')} 
        style={styles.logo}
      />

      <Text style={styles.title}>Iniciar sesión</Text>

      <Text style={styles.label}>Teléfono</Text>
      <TextInput
        style={styles.input}
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        placeholder="Ej. 99998888"
      />

      <Text style={styles.label}>PIN</Text>
      <TextInput
        style={styles.input}
        value={pin}
        onChangeText={setPin}
        keyboardType="number-pad"
        secureTextEntry
        placeholder="PIN asignado por administración"
      />

      {err ? <Text style={styles.err}>{err}</Text> : null}

      <Pressable style={styles.btn} onPress={onLogin}>
        <Text style={styles.btnText}>Entrar</Text>
      </Pressable>

      <Text style={styles.hint}>El primer acceso requiere señal. Después podrás trabajar sin conexión.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, justifyContent: "center", backgroundColor: '#F7FCFF' },
  
  // 3. ESTILO DEL LOGO
  logo: {
    width: 150,           // Ajusta el tamaño según necesites
    height: 150,
    alignSelf: 'center',  // Centrado horizontalmente
    marginBottom: 20,     // Espacio antes del título
    resizeMode: 'contain' // Mantiene la proporción de la imagen
  },

  title: { fontSize: 24, fontWeight: "900", marginBottom: 20, textAlign: 'center' },
  label: { marginTop: 10, fontWeight: "800", color: '#444' },
  input: { backgroundColor: "#f2f2f2", padding: 15, borderRadius: 12, marginTop: 6, fontSize: 16 },
  btn: { backgroundColor: "#2b7", padding: 16, borderRadius: 14, marginTop: 24, alignItems: "center" },
  btnText: { color: "white", fontWeight: "900", fontSize: 16 },
  err: { color: "#b91c1c", marginTop: 12, fontWeight: "700", textAlign: 'center' },
  hint: { marginTop: 20, fontSize: 12, color: "#888", textAlign: 'center' },
});
