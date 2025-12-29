import AsyncStorage from '@react-native-async-storage/async-storage'; // <--- 1. Importante
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { initDb } from "../src/db";
import { loginByPhone } from "../src/repos/auth_repo";

export default function Login() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [err, setErr] = useState<string | null>(null);

  async function onLogin() {
    try {
      setErr(null);
      await initDb();
      const p = phone.trim();
      
      // Intentamos login (esto verifica si existe en la BD local o remota según tu repo)
      const user = await loginByPhone(p);

      // <--- 2. GUARDAR EL TELÉFONO PARA LA SINCRONIZACIÓN --->
      // Esto soluciona el error "No hay teléfono de usuario"
      await AsyncStorage.setItem('user_phone', p);

      // ADMIN -> pantalla admin, TECH -> home normal
      if (user.role === "ADMIN") {
        router.replace("/admin");
      } else {
        router.replace("/");
      }

    } catch (e: any) {
      if (String(e?.message) === "TEL_NO_REGISTRADO") {
        setErr("Teléfono no registrado. Pide al administrador que te cree.");
      } else {
        setErr("No se pudo iniciar sesión. Verifica tu conexión.");
        console.error(e);
      }
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Iniciar sesión</Text>

      <Text style={styles.label}>Teléfono</Text>
      <TextInput
        style={styles.input}
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        placeholder="Ej. 99998888"
      />

      {err ? <Text style={styles.err}>{err}</Text> : null}

      <Pressable style={styles.btn} onPress={onLogin}>
        <Text style={styles.btnText}>Entrar</Text>
      </Pressable>

      <Text style={styles.hint}>
        Admin fijo: accionhonduras.org / 08019005012310
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, justifyContent: "center" },
  title: { fontSize: 22, fontWeight: "900", marginBottom: 16 },
  label: { marginTop: 10, fontWeight: "800" },
  input: { backgroundColor: "#f2f2f2", padding: 12, borderRadius: 12, marginTop: 6 },
  btn: { backgroundColor: "#2b7", padding: 14, borderRadius: 14, marginTop: 18, alignItems: "center" },
  btnText: { color: "white", fontWeight: "900" },
  err: { color: "#b91c1c", marginTop: 10, fontWeight: "700" },
  hint: { marginTop: 16, fontSize: 12, color: "#666" },
});