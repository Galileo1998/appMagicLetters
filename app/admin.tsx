import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { initDb } from "../src/db";
import { getMe, logout } from "../src/repos/auth_repo";
import { createTech, listTechs } from "../src/repos/users_repo";

export default function AdminScreen() {
  const router = useRouter();
  const [meName, setMeName] = useState("Administrador");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [techs, setTechs] = useState<any[]>([]);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    await initDb();
    const me = await getMe();
    if (!me || me.role !== "ADMIN") {
      router.replace("/login");
      return;
    }
    setMeName(me.name);
    const rows = await listTechs();
    setTechs(rows);
  }

  useEffect(() => { load(); }, []);

  async function onCreate() {
    try {
      setErr(null);
      if (!name.trim()) return setErr("Escribe el nombre del técnico.");
      if (!phone.trim()) return setErr("Escribe el teléfono.");

      await createTech(name, phone);
      setName("");
      setPhone("");
      await load();
    } catch (e: any) {
      // UNIQUE(phone) suele lanzar constraint
      setErr("No se pudo crear. Revisa si el teléfono ya existe.");
    }
  }

  async function onLogout() {
    await logout();
    router.replace("/login");
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Panel Admin</Text>
        <Pressable onPress={onLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Salir</Text>
        </Pressable>
      </View>

      <Text style={styles.sub}>Sesión: {meName}</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Crear técnico</Text>

        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Nombre del técnico"
        />
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          placeholder="Teléfono"
        />

        {err ? <Text style={styles.err}>{err}</Text> : null}

        <Pressable style={styles.btn} onPress={onCreate}>
          <Text style={styles.btnText}>Guardar técnico</Text>
        </Pressable>
      </View>

      <Text style={styles.listTitle}>Técnicos ({techs.length})</Text>

      <FlatList
        data={techs}
        keyExtractor={(x) => x.id}
        renderItem={({ item }) => (
          <View style={styles.techRow}>
            <Text style={styles.techName}>{item.name}</Text>
            <Text style={styles.techPhone}>{item.phone}</Text>
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 14 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: 20, fontWeight: "900" },
  sub: { marginTop: 6, color: "#666" },

  logoutBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: "#eee" },
  logoutText: { fontWeight: "900" },

  card: { marginTop: 14, backgroundColor: "white", borderRadius: 16, padding: 14, elevation: 2 },
  cardTitle: { fontSize: 16, fontWeight: "900", marginBottom: 8 },
  input: { backgroundColor: "#f2f2f2", padding: 12, borderRadius: 12, marginTop: 10 },
  btn: { backgroundColor: "#2b7", padding: 12, borderRadius: 12, marginTop: 12, alignItems: "center" },
  btnText: { color: "white", fontWeight: "900" },
  err: { color: "#b91c1c", marginTop: 10, fontWeight: "800" },

  listTitle: { marginTop: 16, fontSize: 16, fontWeight: "900" },
  techRow: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#eee" },
  techName: { fontWeight: "900", fontSize: 15 },
  techPhone: { color: "#666", marginTop: 2 },
});
