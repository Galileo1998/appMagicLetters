import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

// Importamos la lógica desde el archivo .ts (repo)
import { addPhoto, deletePhoto, listPhotos, PhotoRow } from '../../../src/repos/photos_repo';

export default function PhotoScreen() {
  const { letterId } = useLocalSearchParams<{ letterId: string }>();
  const router = useRouter();
  const [photos, setPhotos] = useState<PhotoRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPhotos();
  }, []);

  const loadPhotos = async () => {
    if (!letterId) return;
    const data = await listPhotos(letterId);
    setPhotos(data);
  };

  // CÁMARA
  const handleCamera = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permiso denegado", "Necesitamos acceso a la cámara.");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.5, 
        allowsEditing: false, 
      });

      if (!result.canceled && result.assets[0].uri && letterId) {
        setLoading(true);
        await addPhoto(letterId, result.assets[0].uri);
        await loadPhotos();
        setLoading(false);
      }
    } catch (e: any) {
      console.error(e);
      setLoading(false);
      Alert.alert("Atención", e.message || "No se pudo guardar la foto.");
    }
  };

  // GALERÍA
  const handleGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.5,
        allowsMultipleSelection: false, 
      });

      if (!result.canceled && result.assets[0].uri && letterId) {
        setLoading(true);
        await addPhoto(letterId, result.assets[0].uri);
        await loadPhotos();
        setLoading(false);
      }
    } catch (e: any) {
      console.error(e);
      setLoading(false);
      Alert.alert("Atención", e.message || "Error al seleccionar de galería.");
    }
  };

  const handleDelete = (letterId: string, slot: 1 | 2 | 3) => {
    Alert.alert("Borrar Foto", "¿Estás seguro?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Borrar", style: 'destructive', onPress: async () => {
          await deletePhoto(letterId, slot);
          loadPhotos();
      }}
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Fotografías ({photos.length}/3)</Text>
        <View style={{width:40}} />
      </View>

      <View style={styles.content}>
        <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.btnAction} onPress={handleCamera}>
                <View style={[styles.iconCircle, { backgroundColor: '#e3f2fd' }]}>
                    <Ionicons name="camera" size={28} color="#1e62d0" />
                </View>
                <Text style={styles.btnText}>Cámara</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.btnAction} onPress={handleGallery}>
                <View style={[styles.iconCircle, { backgroundColor: '#e8f5e9' }]}>
                    <Ionicons name="images" size={28} color="#28a745" />
                </View>
                <Text style={styles.btnText}>Galería</Text>
            </TouchableOpacity>
        </View>

        {loading && <ActivityIndicator size="large" color="#1e62d0" style={{marginTop:20}} />}

        <FlatList
          data={photos}
          keyExtractor={(item) => item.slot.toString()}
          numColumns={2}
          contentContainerStyle={{ paddingBottom: 50, paddingTop: 20 }}
          renderItem={({ item }) => (
            <View style={styles.photoCard}>
              <Image source={{ uri: item.file_path }} style={styles.image} />
              <View style={styles.slotBadge}>
                  <Text style={styles.slotText}>#{item.slot}</Text>
              </View>
              <TouchableOpacity 
                style={styles.deleteBtn} 
                onPress={() => handleDelete(item.letter_id, item.slot)}
              >
                <Ionicons name="trash" size={16} color="white" />
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
                <Text style={{color:'#888'}}>No hay fotos (Máximo 3).</Text>
            </View>
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6f8' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 15, backgroundColor: 'white', elevation: 2 },
  backBtn: { padding: 5 },
  title: { fontSize: 18, fontWeight: '800', color: '#333' },
  content: { flex: 1, padding: 15 },
  actionsRow: { flexDirection: 'row', justifyContent: 'center', gap: 30, marginTop: 10, marginBottom: 10 },
  btnAction: { alignItems: 'center' },
  iconCircle: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginBottom: 8, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  btnText: { fontWeight: '600', color: '#555' },
  photoCard: { flex: 1, margin: 8, borderRadius: 12, overflow: 'hidden', backgroundColor: '#fff', elevation: 3, aspectRatio: 1, position: 'relative' },
  image: { width: '100%', height: '100%', resizeMode: 'cover' },
  slotBadge: { position: 'absolute', top: 5, left: 5, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  slotText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
  deleteBtn: { position: 'absolute', top: 5, right: 5, backgroundColor: 'rgba(220, 53, 69, 0.9)', width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  empty: { alignItems: 'center', marginTop: 50 }
});