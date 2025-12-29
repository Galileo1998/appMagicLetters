import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
// 👇 IMPORTANTE: Usamos la función de UPDATE simple
import { getLetter, updateLetterMessage } from "../../../src/repos/letters_repo";

export default function MessageScreen() {
  const { letterId } = useLocalSearchParams<{ letterId: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    if (!letterId) return;
    const data = await getLetter(letterId);
    if (data) {
      // Cargamos el mensaje si ya existe
      setMessage(data.message_content || "");
    }
    setLoading(false);
  }

  const handleSave = async () => {
    if (!letterId) return;
    try {
        // 👇 Esta función hace: UPDATE local_letters SET message_content = ? ...
        // Ya no hace INSERT, así que no dará error de conflicto.
        await updateLetterMessage(letterId, message);
        
        Alert.alert("Guardado", "Mensaje registrado correctamente.", [
            { text: "OK", onPress: () => router.back() }
        ]);
    } catch (e) {
        console.error("Error al guardar mensaje:", e);
        Alert.alert("Error", "No se pudo guardar. Verifica la consola.");
    }
  };

  if (loading) return <ActivityIndicator style={{flex:1}} size="large" color="#1e62d0" />;

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Carta del Niño</Text>
        <TouchableOpacity onPress={handleSave} style={styles.saveBtn}>
          <Text style={styles.saveText}>GUARDAR</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.instructions}>
          Escribe aquí la traducción o el mensaje completo:
        </Text>

        <View style={styles.textAreaContainer}>
            <TextInput
                style={styles.textArea}
                multiline
                placeholder="Escribe el mensaje aquí..."
                value={message}
                onChangeText={setMessage}
                textAlignVertical="top"
            />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
    paddingHorizontal: 20, paddingTop: 50, paddingBottom: 15, 
    backgroundColor: 'white', elevation: 2, borderBottomWidth:1, borderBottomColor:'#eee'
  },
  backBtn: { padding: 5 },
  title: { fontSize: 18, fontWeight: '800', color: '#333' },
  saveBtn: { backgroundColor: '#1e62d0', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20 },
  saveText: { color: 'white', fontWeight: 'bold', fontSize: 12 },
  content: { flex: 1, padding: 20, backgroundColor: '#f4f6f8' },
  instructions: { color: '#666', marginBottom: 15 },
  textAreaContainer: {
    flex: 1, backgroundColor: 'white', borderRadius: 12, padding: 5,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, marginBottom: 20
  },
  textArea: { flex: 1, fontSize: 16, padding: 15, color: '#333' }
});