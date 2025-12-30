import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { getLetter, LetterRow, setLetterStatus } from "../../../src/repos/letters_repo"; // Importamos setLetterStatus

export default function LetterMenuScreen() {
  const { letterId } = useLocalSearchParams<{ letterId: string }>();
  const router = useRouter();
  const [letter, setLetter] = useState<LetterRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLetter();
  }, []);

  async function loadLetter() {
    if (!letterId) return;
    const data = await getLetter(letterId);
    setLetter(data);
    setLoading(false);
  }

  // Verificar si todo está completo
  const isReadyToSend = letter && 
    letter.has_message === 1 && 
    (letter.photos_count || 0) > 0 && 
    letter.has_drawing === 1;

  async function handleSend() {
    Alert.alert(
      "Enviar Carta",
      "¿Confirmas que has revisado todo y la carta está lista para enviarse?",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Sí, Enviar", 
          onPress: async () => {
            if (!letterId) return;
            // Cambiamos estado a 'PENDING_SYNC' para que la nube se la lleve
            await setLetterStatus(letterId, 'PENDING_SYNC');
            Alert.alert("¡Excelente!", "Carta marcada para envío. Sincroniza en el inicio para subirla.");
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
        
        {/* --- TARJETA DE DATOS --- */}
        <View style={styles.idCard}>
          <View style={styles.cardTopRow}>
            <View style={styles.tagContainer}>
              <View style={styles.iconBoxSmall}>
                <Ionicons name="qr-code" size={14} color="white" />
              </View>
              <Text style={styles.qrText}>
                {letter.slip_id ? `#${letter.slip_id}` : "SIN ID"}
              </Text>
            </View>
            <View style={styles.dateTag}>
              <Text style={styles.dateLabel}>Límite:</Text>
              <Text style={styles.dateText}>{letter.due_date || "--/--/--"}</Text>
            </View>
          </View>

          <View style={styles.mainInfo}>
            <Text style={styles.labelSmall}>NIÑO(A)</Text>
            <Text style={styles.childName} numberOfLines={2}>
              {letter.child_name || "Nombre no disponible"}
            </Text>
            <View style={styles.rowAligned}>
              <Ionicons name="location-sharp" size={16} color="#d9534f" style={{marginRight:4}} />
              <Text style={styles.villageText} numberOfLines={1}>
                {letter.village || "Comunidad no especificada"}
              </Text>
            </View>
          </View>

          <View style={styles.sponsorSection}>
            <View style={styles.sponsorHeader}>
              <Ionicons name="people" size={16} color="#1e62d0" />
              <Text style={styles.sponsorLabel}>PATROCINADOR / PADRINO</Text>
            </View>
            <Text style={styles.sponsorName} numberOfLines={2}>
              {letter.contact_name || "Sin nombre de padrino"}
            </Text>
          </View>

          <View style={styles.childIdSection}>
            <Text style={styles.labelSmall}>CHILD NBR:</Text>
            <Text style={styles.childIdText}>{letter.child_code}</Text>
          </View>

          <View style={styles.cardFooter}>
            <Text style={styles.footerLabel}>Estado:</Text>
            <View style={[
              styles.statusBadge, 
              { backgroundColor: letter.status === 'SYNCED' ? '#d4edda' : (letter.status === 'PENDING_SYNC' ? '#fff3cd' : '#e2e6ea') }
            ]}>
              <Text style={[
                styles.statusText,
                { color: letter.status === 'SYNCED' ? '#155724' : (letter.status === 'PENDING_SYNC' ? '#856404' : '#495057') }
              ]}>
                {letter.status === 'ASSIGNED' ? 'PENDIENTE' : letter.status}
              </Text>
            </View>
          </View>
        </View>
        
        {/* --- TAREAS --- */}
        <Text style={styles.sectionHeader}>TAREAS A REALIZAR</Text>

        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={() => router.push(`/letter/${letterId}/message`)}
        >
          <View style={[styles.iconCircle, letter.has_message ? styles.completedCircle : styles.pendingCircle]}>
            <Ionicons name={letter.has_message ? "checkmark" : "document-text"} size={24} color={letter.has_message ? "#fff" : "#555"} />
          </View>
          <View style={styles.actionTextContainer}>
            <Text style={styles.actionTitle}>Escribir Mensaje</Text>
            <Text style={styles.actionSubtitle} numberOfLines={1}>
              {letter.has_message ? "✅ Completado" : "Traducción / Texto"}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => router.push(`/letter/${letterId}/photo`)}
        >
          <View style={[styles.iconCircle, (letter.photos_count || 0) > 0 ? styles.completedCircle : styles.pendingCircle]}>
            <Ionicons name={(letter.photos_count || 0) > 0 ? "checkmark" : "camera"} size={24} color={(letter.photos_count || 0) > 0 ? "#fff" : "#555"} />
          </View>
          <View style={styles.actionTextContainer}>
            <Text style={styles.actionTitle}>Fotografías</Text>
            <Text style={styles.actionSubtitle}>
              {(letter.photos_count || 0) > 0 ? `✅ ${letter.photos_count} fotos listas` : "Tomar foto del niño/a"}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => router.push(`/draw/${letterId}`)}
        >
          <View style={[styles.iconCircle, letter.has_drawing ? styles.completedCircle : styles.pendingCircle]}>
            <Ionicons name={letter.has_drawing ? "checkmark" : "brush"} size={24} color={letter.has_drawing ? "#fff" : "#555"} />
          </View>
          <View style={styles.actionTextContainer}>
            <Text style={styles.actionTitle}>Dibujo Digital</Text>
            <Text style={styles.actionSubtitle}>
              {letter.has_drawing ? "✅ Dibujo guardado" : "Hacer dibujo"}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>

        {/* --- BOTÓN DE ENVIAR (CONDICIONAL) --- */}
        {isReadyToSend ? (
          <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
            <Ionicons name="paper-plane" size={24} color="white" style={{marginRight: 10}} />
            <Text style={styles.sendButtonText}>ENVIAR CARTA</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.lockedButton}>
            <Ionicons name="lock-closed-outline" size={20} color="#888" style={{marginRight: 8}} />
            <Text style={styles.lockedText}>Completa las tareas para enviar</Text>
          </View>
        )}

        <View style={{height: 40}} /> 

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6f8' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  header: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
    paddingHorizontal: 20, paddingTop: 50, paddingBottom: 15, 
    backgroundColor: 'white', elevation: 2, borderBottomWidth:1, borderBottomColor:'#eee'
  },
  backBtn: { padding: 5 },
  title: { fontSize: 18, fontWeight: '800', color: '#333' },

  content: { padding: 20 },

  // --- TARJETA ---
  idCard: {
    backgroundColor: 'white', borderRadius: 16, marginBottom: 25,
    elevation: 3, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8,
    overflow: 'hidden', borderWidth: 1, borderColor: '#eef'
  },
  cardTopRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#f8f9fa', paddingHorizontal: 15, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#eee'
  },
  tagContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBoxSmall: { backgroundColor: '#333', borderRadius: 6, padding: 4 },
  qrText: { fontWeight: 'bold', color: '#333', fontSize: 14 },
  dateTag: { flexDirection: 'row', alignItems: 'baseline', gap: 5 },
  dateLabel: { fontSize: 11, color: '#888' },
  dateText: { fontSize: 13, color: '#d9534f', fontWeight: 'bold' },

  mainInfo: { padding: 20, paddingBottom: 5 },
  labelSmall: { fontSize: 10, color: '#999', fontWeight: 'bold', marginBottom: 2, letterSpacing: 0.5 },
  childName: { fontSize: 20, fontWeight: '900', color: '#222', marginBottom: 6 },
  rowAligned: { flexDirection: 'row', alignItems: 'center' },
  villageText: { fontSize: 15, color: '#555', flex: 1 },

  sponsorSection: { 
    marginHorizontal: 20, marginTop: 10, padding: 12, 
    backgroundColor: '#eef6fc', borderRadius: 10, 
    borderLeftWidth: 4, borderLeftColor: '#1e62d0' 
  },
  sponsorHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  sponsorLabel: { fontSize: 11, fontWeight: 'bold', color: '#1e62d0' },
  sponsorName: { fontSize: 16, fontWeight: 'bold', color: '#333' },

  childIdSection: {
    marginHorizontal: 20, marginTop: 10, marginBottom: 10,
    padding: 10, backgroundColor: '#fff', borderRadius: 8,
    borderWidth: 1, borderColor: '#eee', 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'
  },
  childIdText: { fontSize: 18, fontWeight: '900', color: '#333', letterSpacing: 1 },

  cardFooter: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
    padding: 15, borderTopWidth: 1, borderTopColor: '#f0f0f0', backgroundColor: '#fafafa'
  },
  footerLabel: { fontSize: 12, color: '#999' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 11, fontWeight: 'bold' },

  // --- BOTONES ACCIONES ---
  sectionHeader: { fontSize: 13, fontWeight: 'bold', color: '#888', marginBottom: 10, marginLeft: 5, marginTop: 5 },
  
  actionButton: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'white', padding: 15, borderRadius: 16, marginBottom: 12,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.05,
    borderWidth: 1, borderColor: '#f0f0f0'
  },
  iconCircle: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  pendingCircle: { backgroundColor: '#f0f2f5' },
  completedCircle: { backgroundColor: '#28a745' },
  actionTextContainer: { flex: 1, paddingRight: 10 },
  actionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  actionSubtitle: { fontSize: 13, color: '#666', marginTop: 2 },

  // --- BOTÓN ENVIAR ---
  sendButton: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#1e62d0', padding: 18, borderRadius: 16,
    marginTop: 20, elevation: 4, shadowColor: "#1e62d0", shadowOpacity: 0.3, shadowOffset: {width:0, height:4}
  },
  sendButtonText: { color: 'white', fontSize: 16, fontWeight: '900', letterSpacing: 0.5 },
  
  lockedButton: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#f0f2f5', padding: 15, borderRadius: 16,
    marginTop: 20, borderWidth: 1, borderColor: '#ddd', borderStyle: 'dashed'
  },
  lockedText: { color: '#888', fontSize: 14, fontWeight: '600' }
});