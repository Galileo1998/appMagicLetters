import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
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
// 👇 Asegúrate de tener este archivo creado en src/utils/dateUtils.ts
import { getDaysRemaining } from '../src/utils/dateUtils';

export default function HomeScreen() {
  const router = useRouter();
  const [letters, setLetters] = useState<LetterRow[]>([]);
  const [user, setUser] = useState<UserRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // --- CARGA DE DATOS ---
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      await initDb();
      
      // 1. Obtener usuario
      const me = await getMe(); 
      setUser(me);

      // 2. Cargar cartas si hay usuario
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

  // Recargar al volver a la pantalla (para actualizar iconos de progreso)
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  // --- SINCRONIZACIÓN ---
  const handleSync = async () => {
    try {
      setSyncing(true);
      // 1. Subir pendientes
      const uploaded = await syncService.pushPendingLetters();
      // 2. Bajar asignadas (y datos de corrección si hay devoluciones)
      const downloaded = await syncService.pullAssignedLetters();

      let msg = "";
      if (uploaded > 0) msg += `Enviadas: ${uploaded}. `;
      if (typeof downloaded === 'number') msg += `Recibidas: ${downloaded}.`;
      
      if (!msg) msg = "Todo está actualizado.";

      Alert.alert("Sincronización", msg);
      await loadData(); // Recargar lista visual

    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Fallo en la conexión. Verifica tu internet o la IP del servidor.");
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

  // --- AYUDAS VISUALES ---

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

  // 🎨 Color según Tipo de Carta
  const getTypeColor = (type: string | null) => {
    if (!type) return '#6c757d';
    const t = type.toLowerCase();
    if (t.includes('welcome')) return '#17a2b8'; // Azul Cyan
    if (t.includes('reply')) return '#28a745';   // Verde
    if (t.includes('thank')) return '#6f42c1';   // Morado
    return '#6c757d'; // Gris
  };

  // --- RENDERIZADO DE CADA CARTA ---
  const renderItem = ({ item }: { item: LetterRow }) => {
    
    // 🗓️ CÁLCULO DE FECHAS
    const { text: daysText, color: daysColor } = getDaysRemaining(
       item.due_date, 
       item.days_remaining 
    );

    // 🏷️ ETIQUETA DE TIPO (Traducida)
    let typeLabel = item.letter_type || 'CARTA';
    if (typeLabel.toLowerCase().includes('welcome')) typeLabel = 'BIENVENIDA';
    else if (typeLabel.toLowerCase().includes('reply')) typeLabel = 'RESPUESTA';
    else if (typeLabel.toLowerCase().includes('thank')) typeLabel = 'AGRADECIM.';

    return (
      <TouchableOpacity 
        style={[
          styles.card, 
          item.status === 'RETURNED' && styles.cardReturned
        ]}
        onPress={() => router.push(`/letter/${item.local_id}`)}
      >
        {/* Cabecera: ID, Tipo y Estado */}
        <View style={styles.cardHeader}>
          <View style={{flexDirection:'row', alignItems:'center', gap: 6}}>
             {/* ID Slip */}
             <Text style={styles.slipText}>
                {item.slip_id ? `#${item.slip_id}` : 'Borrador'}
             </Text>
             
             {/* 🆕 BADGE TIPO DE CARTA */}
             <View style={{ backgroundColor: getTypeColor(item.letter_type), paddingHorizontal:6, paddingVertical:2, borderRadius:4 }}>
                <Text style={{ color:'white', fontSize:9, fontWeight:'bold', textTransform:'uppercase' }}>
                   {typeLabel}
                </Text>
             </View>
          </View>

          {/* Badge de Estado */}
          <View style={[styles.badge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.badgeText}>
              {item.status === 'RETURNED' ? 'CORREGIR' : item.status}
            </Text>
          </View>
        </View>

        {/* Datos Principales */}
        <Text style={styles.childName}>
          {item.child_name || `Niño ${item.child_code}`}
        </Text>
        
        <Text style={styles.villageText}>
          📍 {item.village || 'Sin comunidad'}
        </Text>

        {/* Motivo de rechazo (Solo si es RETURNED) */}
        {item.status === 'RETURNED' && item.return_reason && (
          <View style={styles.reasonBox}>
            <Text style={styles.reasonText} numberOfLines={2}>
              ⚠️ {item.return_reason}
            </Text>
          </View>
        )}

        {/* ⏱️ SECCIÓN DE TIEMPO RESTANTE (Badge Dinámico) */}
        <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginTop:10}}>
            <View style={{ flexDirection:'row', alignItems:'center', backgroundColor: daysColor + '20', paddingHorizontal:8, paddingVertical:4, borderRadius:12 }}>
                <Ionicons name="time-outline" size={14} color={daysColor} style={{marginRight:4}} />
                <Text style={{ color: daysColor, fontWeight:'bold', fontSize:12 }}>
                  {daysText}
                </Text>
            </View>
            
            {/* Fecha Límite (Texto pequeño) */}
            <Text style={{ fontSize:11, color:'#aaa' }}>
               Vence: {item.due_date || '?'}
            </Text>
        </View>

        {/* ICONOS DE PROGRESO */}
        <View style={styles.progressRow}>
          {/* Mensaje */}
          <View style={styles.progressItem}>
            <Ionicons name="chatbox-ellipses" size={16} color={item.has_message ? "#28a745" : "#ccc"} />
            <Text style={[styles.progText, { color: item.has_message ? "#28a745" : "#999" }]}>
               {item.has_message ? "Listo" : "Texto"}
            </Text>
          </View>

          {/* Fotos */}
          <View style={styles.progressItem}>
            <Ionicons name="images" size={16} color={(item.photos_count || 0) > 0 ? "#28a745" : "#ccc"} />
            <Text style={[styles.progText, { color: (item.photos_count || 0) > 0 ? "#28a745" : "#999" }]}>
               {item.photos_count || 0} Fotos
            </Text>
          </View>

          {/* Dibujo */}
          <View style={styles.progressItem}>
            <Ionicons name="brush" size={16} color={item.has_drawing ? "#28a745" : "#ccc"} />
            <Text style={[styles.progText, { color: item.has_drawing ? "#28a745" : "#999" }]}>
               {item.has_drawing ? "Listo" : "Dibujo"}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

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
            <Ionicons name="folder-open-outline" size={48} color="#ccc" />
            <Text style={{color:'#888', marginTop:10}}>No tienes cartas asignadas.</Text>
            <Text style={{color:'#ccc', fontSize:12}}>Pulsa la nube para descargar.</Text>
          </View>
        }
      />
      
      {/* Botón flotante (opcional) */}
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
  listContent: { padding: 15, paddingBottom: 80 },
  card: { backgroundColor: 'white', padding: 15, borderRadius: 12, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  cardReturned: { borderLeftWidth: 5, borderLeftColor: '#dc3545' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  slipText: { fontWeight: 'bold', color: '#888', fontSize: 12 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  badgeText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
  childName: { fontSize: 18, fontWeight: 'bold', color: '#222', marginBottom: 2 },
  villageText: { color: '#555', fontSize: 14 },
  reasonBox: { backgroundColor: '#fff5f5', padding: 8, borderRadius: 8, marginTop: 8, borderLeftWidth: 2, borderLeftColor: '#dc3545' },
  reasonText: { color: '#c53030', fontSize: 11, fontStyle: 'italic' },
  progressRow: { flexDirection: 'row', marginTop: 15, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f0f0f0', justifyContent: 'space-around' },
  progressItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  progText: { fontSize: 10 },
  emptyState: { alignItems: 'center', marginTop: 100 },
  fab: { position: 'absolute', right: 20, bottom: 30, backgroundColor: '#1e62d0', width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', elevation: 5 }
});