import { AppIcon as Ionicons } from './components/AppIcon';
import { ChildBackground } from './components/ChildBackground';
import { useFocusEffect, useRouter } from 'expo-router'; // 👈 AGREGADO: useFocusEffect
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

import { initDb } from '../src/db';
import { getMe, logout, UserRow } from '../src/repos/auth_repo';
import { LetterRow, listLetters } from '../src/repos/letters_repo';
import { syncService } from '../src/services/sync_service';
import { subscribeToAutomaticSync } from '../src/services/automatic_sync';

export default function HomeScreen() {
  const router = useRouter();
  const [letters, setLetters] = useState<LetterRow[]>([]);
  const [user, setUser] = useState<UserRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // ✅ CARGA DE DATOS: Se ejecuta al entrar y al volver a la pantalla
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      await initDb();
      
      // 1. Obtenemos el usuario actual
      const me = await getMe(); 
      setUser(me);

      // 2. Si hay usuario, pedimos SUS cartas
      if (me && me.phone) {
        const data = await listLetters(me.phone, { onlyDrafts: true });
        setLetters(data);
      } else {
        setLetters([]);
      }

    } catch (error) {
      console.error("Error cargando Home:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ ESTO ES LO QUE ACTUALIZA LOS ICONOS AL VOLVER
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  useEffect(() => {
    return subscribeToAutomaticSync(() => {
      void loadData();
    });
  }, [loadData]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      let uploaded = 0;
      let failed = 0;
      let downloaded: number | null = null;
      let connectionError: string | null = null;

      try {
        const push = await syncService.pushPendingLetters();
        uploaded = push.uploaded;
        failed = push.failed;
      } catch (error: any) {
        connectionError = error?.message ?? "No se pudo conectar.";
      }
      try {
        downloaded = await syncService.pullAssignedLetters();
      } catch (error: any) {
        connectionError = error?.message ?? "No se pudo descargar.";
      }

      const authenticationExpired = Boolean(
        connectionError &&
        /autenticaci|token.+(?:inv[aá]lido|vencido)/i.test(connectionError)
      );
      if (authenticationExpired) {
        await logout();
        if (router.canGoBack()) router.dismissAll();
        router.replace("/login");
        Alert.alert(
          "Sesión vencida",
          "La seguridad de la aplicación fue actualizada. Inicia sesión nuevamente con tu teléfono y PIN. Tus cartas guardadas en la tablet se conservarán."
        );
        return;
      }

      const parts = [];
      if (uploaded) parts.push(`Enviadas: ${uploaded}.`);
      if (failed) parts.push(`Pendientes con error: ${failed}.`);
      if (downloaded !== null) parts.push(`Asignadas descargadas: ${downloaded}.`);
      if (connectionError) parts.push(`Sin conexión: ${connectionError}`);
      Alert.alert("Sincronización", parts.join(" ") || "Todo está actualizado.");
      await loadData();
    } finally {
      setSyncing(false);
    }
  };

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
              await logout(); 
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
      case 'RETURNED': return '#dc3545';
      case 'DRAFT': return '#ffc107';      
      case 'ASSIGNED': return '#17a2b8';   
      case 'PENDING_SYNC': return '#fd7e14'; 
      case 'SYNCED': return '#28a745';     
      default: return '#6c757d';
    }
  };

  const renderItem = ({ item }: { item: LetterRow }) => (
    <TouchableOpacity 
      style={[
        styles.card, 
        item.status === 'RETURNED' && styles.cardReturned
      ]}
      onPress={() => router.push(`/letter/${item.local_id}`)}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.slipText}>
          {item.slip_id ? `#${item.slip_id}` : 'Borrador'}
        </Text>
        <View style={[styles.badge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.badgeText}>
            {item.status === 'RETURNED' ? 'POR CORREGIR' : item.status}
          </Text>
        </View>
      </View>

      <Text style={styles.childName}>
        {item.child_name || `Niño ${item.child_code}`}
      </Text>
      
      <Text style={styles.villageText}>
        📍 {item.village || 'Sin comunidad'}
      </Text>

      {/* Muestra el motivo del rechazo si existe */}
      {item.status === 'RETURNED' && item.return_reason && (
        <View style={styles.reasonBox}>
          <Text style={styles.reasonText} numberOfLines={2}>
            ⚠️ {item.return_reason}
          </Text>
        </View>
      )}

      {item.sync_error ? (
        <View style={styles.reasonBox}>
          <Text style={styles.reasonText}>No se pudo enviar: {item.sync_error}</Text>
        </View>
      ) : null}

      {item.due_date && (
        <Text style={styles.dateText}>📅 Límite: {item.due_date}</Text>
      )}

      {/* ICONOS DE PROGRESO (Checkea si cambian de color) */}
      <View style={styles.progressRow}>
        <View style={styles.progressItem}>
          {/* Si tiene mensaje, color verde. Si no, gris */}
          <Ionicons name="chatbox-ellipses" size={16} color={item.has_message ? "#28a745" : "#ccc"} />
          <Text style={{ fontSize:10, color: item.has_message ? "#28a745" : "#999" }}>
             {item.has_message ? "Listo" : "Texto"}
          </Text>
        </View>

        <View style={styles.progressItem}>
          {/* Si tiene fotos, color verde */}
          <Ionicons name="images" size={16} color={(item.photos_count || 0) > 0 ? "#28a745" : "#ccc"} />
          <Text style={{ fontSize:10, color: (item.photos_count || 0) > 0 ? "#28a745" : "#999" }}>
             {item.photos_count || 0} Fotos
          </Text>
        </View>

        <View style={styles.progressItem}>
          {/* Si tiene dibujo, color verde */}
          <Ionicons name="brush" size={16} color={item.has_drawing ? "#28a745" : "#ccc"} />
          <Text style={{ fontSize:10, color: item.has_drawing ? "#28a745" : "#999" }}>
             {item.has_drawing ? "Listo" : "Dibujo"}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ChildBackground />
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
            {syncing ? <ActivityIndicator size="small" color="#1e62d0" /> : <Ionicons name="cloud-download-outline" size={26} color="#1e62d0" />}
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
      
      {/* Botón flotante para crear carta manual (si lo usas) */}
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
    backgroundColor: 'rgba(255,255,255,0.94)', borderBottomWidth: 1, borderBottomColor: '#eee'
  },
  welcomeTitle: { fontSize: 20, fontWeight: '900', color: '#333' },
  phoneSubtitle: { fontSize: 13, color: '#666', marginTop: 2, fontWeight: '500' },
  headerIcons: { flexDirection: 'row', gap: 15 },
  iconBtn: { padding: 5 },
  listContent: { padding: 15 },
  card: { backgroundColor: 'white', padding: 15, borderRadius: 12, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  cardReturned: { borderLeftWidth: 5, borderLeftColor: '#dc3545' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  slipText: { fontWeight: 'bold', color: '#888', fontSize: 12 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  badgeText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
  childName: { fontSize: 18, fontWeight: 'bold', color: '#222', marginBottom: 2 },
  villageText: { color: '#555', fontSize: 14 },
  dateText: { color: '#d9534f', fontSize: 12, fontWeight: 'bold', marginTop: 5 },
  reasonBox: { backgroundColor: '#fff5f5', padding: 8, borderRadius: 8, marginTop: 8, borderLeftWidth: 2, borderLeftColor: '#dc3545' },
  reasonText: { color: '#c53030', fontSize: 11, fontStyle: 'italic' },
  progressRow: { flexDirection: 'row', marginTop: 15, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f0f0f0', justifyContent: 'space-around' },
  progressItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  emptyState: { alignItems: 'center', marginTop: 50 },
  fab: { position: 'absolute', right: 20, bottom: 30, backgroundColor: '#1e62d0', width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', elevation: 5 }
});
