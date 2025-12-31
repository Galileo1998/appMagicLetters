import AsyncStorage from '@react-native-async-storage/async-storage';
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
      
      // 1. Intentamos login
      const user = await loginByPhone(p);

      // ✅ 2. GUARDAR DATOS PARA LA SINCRONIZACIÓN ✅
      // Guardamos el teléfono
      await AsyncStorage.setItem('user_phone', p);
      
      // Guardamos el ID (es indispensable para que el pull identifique al técnico)
      // Lo convertimos a String porque AsyncStorage solo acepta texto
      if (user && user.id) {
        await AsyncStorage.setItem('user_id', String(user.id));
      }

      // 3. Navegación según el rol
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
  container: { flex: 1, padding: 16, justifyContent: "center", backgroundColor: 'white' },
  title: { fontSize: 24, fontWeight: "900", marginBottom: 20, textAlign: 'center' },
  label: { marginTop: 10, fontWeight: "800", color: '#444' },
  input: { backgroundColor: "#f2f2f2", padding: 15, borderRadius: 12, marginTop: 6, fontSize: 16 },
  btn: { backgroundColor: "#2b7", padding: 16, borderRadius: 14, marginTop: 24, alignItems: "center" },
  btnText: { color: "white", fontWeight: "900", fontSize: 16 },
  err: { color: "#b91c1c", marginTop: 12, fontWeight: "700", textAlign: 'center' },
  hint: { marginTop: 20, fontSize: 12, color: "#888", textAlign: 'center' },
});