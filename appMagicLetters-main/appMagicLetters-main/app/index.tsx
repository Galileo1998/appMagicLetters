import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { initDb } from '../src/db';
import { getMe, logout, UserRow } from '../src/repos/auth_repo';
import { LetterRow, listLetters } from '../src/repos/letters_repo';
import { syncService } from '../src/services/sync_service';

export default function HomeScreen() {
  const router = useRouter();
  const [letters, setLetters] = useState<LetterRow[]>([]);
  const [user, setUser] = useState<UserRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      await initDb();
      const data = await listLetters({ onlyDrafts: true });
      setLetters(data);
      const me = await getMe();
      setUser(me);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

// app/(tabs)/index.tsx

  // ... imports ...

  const handleSync = async () => {
    try {
      setSyncing(true);
      
      // 1. PRIMERO SUBIMOS (Push)
      const uploaded = await syncService.pushPendingLetters();
      
      // 2. LUEGO DESCARGAMOS (Pull)
      const downloaded = await syncService.pullAssignedLetters();

      let msg = "";
      if (uploaded > 0) msg += `Se enviaron ${uploaded} cartas. `;
      if (typeof downloaded === 'number') msg += `Se recibieron ${downloaded} cartas.`;
      
      if (!msg) msg = "Todo está actualizado.";

      Alert.alert("Sincronización", msg);
      await loadData(); // Recargar la lista visual

    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Fallo en la conexión. Revisa tu internet o la IP del servidor.");
    } finally {
      setSyncing(false);
    }
  };
// app/(tabs)/index.tsx

  const handleLogout = () => {
    Alert.alert(
      "Cerrar Sesión",
      "¿Seguro que quieres salir?",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Salir", 
          style: 'destructive',
          onPress: async () => {
            try {
             
              
              await logout(); // Solo borra la sesión de la DB (mantiene las cartas)
              
              if (router.canGoBack()) router.dismissAll();
              router.replace('/login');
            } catch (error) {
              console.error("Error al salir:", error);
              router.replace('/login');
            }
          }
        }
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return '#ffc107';      
      case 'ASSIGNED': return '#17a2b8';   
      case 'PENDING_SYNC': return '#fd7e14'; 
      case 'SYNCED': return '#28a745';     
      default: return '#6c757d';
    }
  };

  const renderItem = ({ item }: { item: LetterRow }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => router.push(`/letter/${item.local_id}`)}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.slipText}>
          {item.slip_id ? `#${item.slip_id}` : 'Borrador'}
        </Text>
        <View style={[styles.badge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.badgeText}>{item.status}</Text>
        </View>
      </View>

      <Text style={styles.childName}>
        {item.child_name || `Niño ${item.child_code}`}
      </Text>
      
      <Text style={styles.villageText}>
        📍 {item.village || 'Sin comunidad'}
      </Text>

      {item.due_date && (
        <Text style={styles.dateText}>📅 Límite: {item.due_date}</Text>
      )}

      {/* --- ICONOS DE PROGRESO (RECUPERADOS) --- */}
      <View style={styles.progressRow}>
        {/* Mensaje */}
        <View style={styles.progressItem}>
          <Ionicons name="chatbox-ellipses" size={16} color={item.has_message ? "#28a745" : "#ccc"} />
          <Text style={{ fontSize:10, color: item.has_message ? "#28a745" : "#999" }}>
             {item.has_message ? "Listo" : "Texto"}
          </Text>
        </View>

        {/* Fotos */}
        <View style={styles.progressItem}>
          <Ionicons name="images" size={16} color={(item.photos_count || 0) > 0 ? "#28a745" : "#ccc"} />
          <Text style={{ fontSize:10, color: (item.photos_count || 0) > 0 ? "#28a745" : "#999" }}>
             {item.photos_count || 0} Fotos
          </Text>
        </View>

        {/* Dibujo */}
        <View style={styles.progressItem}>
          <Ionicons name="brush" size={16} color={item.has_drawing ? "#28a745" : "#ccc"} />
          <Text style={{ fontSize:10, color: item.has_drawing ? "#28a745" : "#999" }}>
             {item.has_drawing ? "Listo" : "Dibujo"}
          </Text>
        </View>
      </View>
      {/* -------------------------------------- */}

    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeTitle}>
            Hola, {user?.name ? user.name.split(' ')[0] : 'Técnico'} 👋
          </Text>
          <Text style={styles.phoneSubtitle}>
            📞 {user?.phone || '...'}
          </Text>
        </View>
        <View style={styles.headerIcons}>
          <TouchableOpacity onPress={handleSync} disabled={syncing} style={styles.iconBtn}>
            {syncing ? <Text style={{fontSize:10}}>...</Text> : <Ionicons name="cloud-download-outline" size={26} color="#1e62d0" />}
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout} style={styles.iconBtn}>
            <Ionicons name="log-out-outline" size={26} color="#dc3545" />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={letters}
        keyExtractor={(item) => item.local_id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadData} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={{color:'#888'}}>No tienes cartas asignadas.</Text>
            <Text style={{color:'#ccc', fontSize:12}}>Pulsa la nube para descargar.</Text>
          </View>
        }
      />
      
      <TouchableOpacity style={styles.fab} onPress={() => router.push("/create")}>
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f7f6' },
  header: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
    paddingHorizontal: 20, paddingBottom: 15, paddingTop: 60, 
    backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#eee'
  },
  welcomeTitle: { fontSize: 20, fontWeight: '900', color: '#333' },
  phoneSubtitle: { fontSize: 13, color: '#666', marginTop: 2, fontWeight: '500' },
  headerIcons: { flexDirection: 'row', gap: 15 },
  iconBtn: { padding: 5 },
  listContent: { padding: 15 },
  card: { backgroundColor: 'white', padding: 15, borderRadius: 12, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  slipText: { fontWeight: 'bold', color: '#888', fontSize: 12 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  badgeText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
  childName: { fontSize: 18, fontWeight: 'bold', color: '#222', marginBottom: 2 },
  villageText: { color: '#555', fontSize: 14 },
  dateText: { color: '#d9534f', fontSize: 12, fontWeight: 'bold', marginTop: 5 },
  
  // Estilos Nuevos para la barra de iconos
  progressRow: { flexDirection: 'row', marginTop: 15, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f0f0f0', justifyContent: 'space-around' },
  progressItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },

  emptyState: { alignItems: 'center', marginTop: 50 },
  fab: { position: 'absolute', right: 20, bottom: 30, backgroundColor: '#1e62d0', width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', elevation: 5 }
});