import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router"; // 👈 Importante: useFocusEffect
import React, { useCallback, useState } from "react";
import { ActivityIndicator, Alert, Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { getDrawing } from "../../../src/repos/drawings_repo";
import { getLetter, LetterRow, setLetterStatus } from "../../../src/repos/letters_repo";
import { listPhotos } from "../../../src/repos/photos_repo"; // Usamos el repo de fotos

const { width } = Dimensions.get('window');

export default function LetterMenuScreen() {
  const { letterId } = useLocalSearchParams<{ letterId: string }>();
  const router = useRouter();
  
  const [letter, setLetter] = useState<LetterRow | null>(null);
  const [photosCount, setPhotosCount] = useState(0);
  const [hasDrawing, setHasDrawing] = useState(false);
  const [loading, setLoading] = useState(true);

  // 👇 ESTO SOLUCIONA QUE NO SE ACTUALICE EL CHECK
  // Se ejecuta automáticamente cada vez que esta pantalla recibe el foco (vuelves atrás)
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [letterId])
  );

  async function loadData() {
    if (!letterId) return;
    try {
      // 1. Cargar Carta (Mensaje)
      const data = await getLetter(letterId);
      setLetter(data);

      // 2. Cargar Fotos (Contar cuántas hay)
      const photos = await listPhotos(letterId);
      setPhotosCount(photos.length);

      // 3. Cargar Dibujo (Verificar si existe)
      const drawing = await getDrawing(letterId);
      setHasDrawing(!!drawing); // true si hay ruta de archivo

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  // Verificamos si hay mensaje (más de 5 letras para considerar que escribió algo)
  const hasMessage = letter?.message_content && letter.message_content.length > 5;

  async function handleSend() {
    // Reglas: Necesita mensaje, dibujo y al menos 1 foto
    const isReady = hasMessage && photosCount > 0 && hasDrawing; 

    if (!isReady) {
        Alert.alert("Falta información", "Para finalizar necesitas:\n- Escribir el mensaje\n- Al menos 1 foto\n- El dibujo");
        return;
    }

    Alert.alert(
      "Enviar Carta",
      "¿Está todo listo para subir a la nube?",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Sí, Enviar", 
          onPress: async () => {
            if (!letterId) return;
            await setLetterStatus(letterId, 'PENDING_SYNC');
            Alert.alert("¡Listo!", "Carta marcada para envío. Sincroniza en el inicio.");
            router.back();
          }
        }
      ]
    );
  }

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#1e62d0" />;
  if (!letter) return <View style={styles.center}><Text>Carta no encontrada</Text></View>;

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Detalle de Carta</Text>
        <View style={{ width: 40 }} /> 
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        
        {/* INFO DEL NIÑO */}
        <View style={styles.idCard}>
            <View style={{flexDirection:'row', justifyContent:'space-between'}}>
                <Text style={styles.qrText}>#{letter.slip_id || "SIN ID"}</Text>
                <Text style={styles.dateText}>{letter.due_date || "--/--"}</Text>
            </View>
            <Text style={styles.childName}>{letter.child_name || "Nombre del Niño"}</Text>
            <Text style={styles.villageText}>📍 {letter.village || "Comunidad"}</Text>
        </View>
        
        {/* BOTONES DE ACCIÓN (Checks verdes si ya está listo) */}
        <View style={styles.actionsGrid}>
            
            {/* 1. MENSAJE */}
            <TouchableOpacity style={styles.actionCard} onPress={() => router.push(`/letter/${letterId}/message`)}>
                <View style={[styles.iconCircle, hasMessage ? styles.bgGreen : styles.bgGray]}>
                    <Ionicons name="document-text" size={28} color="white" />
                </View>
                <Text style={styles.actionLabel}>Mensaje</Text>
                {hasMessage && <Ionicons name="checkmark-circle" size={20} color="#28a745" style={styles.checkIcon} />}
            </TouchableOpacity>

            {/* 2. FOTOS */}
            <TouchableOpacity style={styles.actionCard} onPress={() => router.push(`/letter/${letterId}/photo`)}>
                <View style={[styles.iconCircle, photosCount >= 1 ? styles.bgGreen : styles.bgGray]}>
                    <Ionicons name="camera" size={28} color="white" />
                </View>
                <Text style={styles.actionLabel}>Fotos ({photosCount})</Text>
                {photosCount >= 1 && <Ionicons name="checkmark-circle" size={20} color="#28a745" style={styles.checkIcon} />}
            </TouchableOpacity>

            {/* 3. DIBUJO */}
            <TouchableOpacity style={styles.actionCard} onPress={() => router.push(`/draw/${letterId}`)}>
                <View style={[styles.iconCircle, hasDrawing ? styles.bgGreen : styles.bgGray]}>
                    <Ionicons name="brush" size={28} color="white" />
                </View>
                <Text style={styles.actionLabel}>Dibujo</Text>
                {hasDrawing && <Ionicons name="checkmark-circle" size={20} color="#28a745" style={styles.checkIcon} />}
            </TouchableOpacity>

        </View>

        {/* BOTÓN FINAL */}
        <TouchableOpacity style={[styles.sendBtn, (hasMessage && hasDrawing && photosCount > 0) ? {} : styles.disabledBtn]} onPress={handleSend}>
            <Text style={styles.sendBtnText}>FINALIZAR CARTA</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6f9' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, paddingTop: 50, backgroundColor: 'white' },
  backBtn: { padding: 5 },
  title: { fontSize: 18, fontWeight: 'bold' },
  content: { padding: 20 },
  idCard: { backgroundColor: 'white', padding: 20, borderRadius: 12, marginBottom: 20, elevation: 2 },
  qrText: { fontWeight: 'bold', color: '#666' },
  dateText: { color: '#999', fontSize: 12 },
  childName: { fontSize: 22, fontWeight: 'bold', color: '#1e62d0', marginVertical: 5 },
  villageText: { color: '#555' },
  actionsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  actionCard: { width: width * 0.28, backgroundColor: 'white', padding: 15, borderRadius: 12, alignItems: 'center', elevation: 2, position: 'relative' },
  iconCircle: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  bgGreen: { backgroundColor: '#28a745' },
  bgGray: { backgroundColor: '#ccc' },
  actionLabel: { fontSize: 12, fontWeight: 'bold', color: '#555' },
  checkIcon: { position: 'absolute', top: 5, right: 5 },
  sendBtn: { backgroundColor: '#1e62d0', padding: 18, borderRadius: 12, alignItems: 'center', elevation: 3 },
  disabledBtn: { backgroundColor: '#a0a0a0' },
  sendBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});