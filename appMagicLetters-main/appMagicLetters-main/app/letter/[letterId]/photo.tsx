import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Button,
  Image,
  ScrollView,
  StyleSheet, Text, TouchableOpacity, View
} from 'react-native';
import { addPhoto, deletePhoto, listPhotos, PhotoRow } from '../../../src/repos/photos_repo';

export default function PhotoScreen() {
  const { letterId } = useLocalSearchParams<{ letterId: string }>();
  const router = useRouter();
  
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  
  const [photos, setPhotos] = useState<PhotoRow[]>([]);
  const [showCamera, setShowCamera] = useState(false); // 👈 Controla si vemos galería o cámara
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPhotos();
  }, []);

  async function loadPhotos() {
    if(!letterId) return;
    try {
        const list = await listPhotos(letterId);
        setPhotos(list);
    } catch(e) { console.error(e); }
  }

  // --- MODO: GALERÍA (Vista Principal) ---
  if (!showCamera) {
    return (
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.title}>Fotos ({photos.length}/3)</Text>
            <View style={{width:30}}/>
        </View>

        <ScrollView contentContainerStyle={styles.galleryContent}>
            {photos.length === 0 && (
                <View style={styles.emptyState}>
                    <Ionicons name="images-outline" size={60} color="#ccc" />
                    <Text style={{color:'#888', marginTop:10}}>No hay fotos aún</Text>
                </View>
            )}

            <View style={styles.grid}>
                {photos.map((p, index) => (
                    <View key={p.id} style={styles.photoCard}>
                        <Image source={{ uri: p.file_path }} style={styles.thumb} />
                        <View style={styles.photoBadge}><Text style={styles.badgeText}>{index + 1}</Text></View>
                        {/* Botón Borrar */}
                        <TouchableOpacity 
                            style={styles.deleteBtn}
                            onPress={() => {
                                Alert.alert("Borrar", "¿Eliminar esta foto?", [
                                    { text: "Cancelar", style: 'cancel'},
                                    { text: "Borrar", style: 'destructive', onPress: async () => {
                                        await deletePhoto(letterId!, p.slot);
                                        loadPhotos();
                                    }}
                                ]);
                            }}
                        >
                            <Ionicons name="trash" size={18} color="white" />
                        </TouchableOpacity>
                    </View>
                ))}
            </View>
        </ScrollView>

        {/* Botón Flotante para Abrir Cámara (Solo si hay espacio) */}
        {photos.length < 3 ? (
            <TouchableOpacity style={styles.fab} onPress={() => setShowCamera(true)}>
                <Ionicons name="camera" size={30} color="white" />
                <Text style={styles.fabText}>TOMAR FOTO</Text>
            </TouchableOpacity>
        ) : (
            <View style={styles.limitBanner}>
                <Text style={{color:'white', fontWeight:'bold'}}>Límite de 3 fotos alcanzado</Text>
            </View>
        )}
      </View>
    );
  }

  // --- MODO: CÁMARA (Solo si pulsan el botón) ---
  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: 'center', marginTop: 50 }}>Necesitamos permiso para usar la cámara</Text>
        <Button onPress={requestPermission} title="Dar permiso" />
      </View>
    );
  }

  async function takePicture() {
    if (cameraRef.current && letterId) {
        setLoading(true);
        try {
            const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
            if (photo) {
                await addPhoto(letterId, photo.uri);
                setShowCamera(false); // Volver a galería automáticamente
                loadPhotos(); 
            }
        } catch (e) {
            Alert.alert("Error", "No se pudo guardar la foto");
        } finally {
            setLoading(false);
        }
    }
  }

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} ref={cameraRef}>
        <View style={styles.cameraControls}>
            <TouchableOpacity style={styles.closeCamera} onPress={() => setShowCamera(false)}>
                <Text style={{color:'white', fontWeight:'bold'}}>CANCELAR</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.shutterBtn} onPress={takePicture} disabled={loading}>
                {loading ? <ActivityIndicator color="black"/> : <View style={styles.shutterInner} />}
            </TouchableOpacity>

            <View style={{width: 70}} />
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6f9' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems:'center', padding: 20, paddingTop: 50, backgroundColor: 'white', elevation:2 },
  backBtn: { padding: 5 },
  title: { fontSize: 18, fontWeight: 'bold' },
  
  galleryContent: { padding: 20 },
  emptyState: { alignItems: 'center', marginTop: 100 },
  
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  photoCard: { width: '48%', aspectRatio: 1, borderRadius: 10, overflow: 'hidden', position: 'relative', elevation: 3, backgroundColor:'white' },
  thumb: { width: '100%', height: '100%' },
  photoBadge: { position: 'absolute', top: 5, left: 5, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 10, width: 24, height: 24, justifyContent:'center', alignItems:'center' },
  badgeText: { color: 'white', fontWeight: 'bold', fontSize: 12 },
  deleteBtn: { position: 'absolute', bottom: 5, right: 5, backgroundColor: '#d32f2f', padding: 8, borderRadius: 20 },

  fab: { position: 'absolute', bottom: 30, alignSelf: 'center', backgroundColor: '#1e62d0', flexDirection: 'row', alignItems: 'center', paddingVertical: 15, paddingHorizontal: 30, borderRadius: 30, elevation: 5 },
  fabText: { color: 'white', fontWeight: 'bold', marginLeft: 10 },
  limitBanner: { position: 'absolute', bottom: 0, width: '100%', backgroundColor: '#28a745', padding: 15, alignItems: 'center' },

  camera: { flex: 1 },
  cameraControls: { position: 'absolute', bottom: 0, width: '100%', height: 120, backgroundColor: 'rgba(0,0,0,0.5)', flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  shutterBtn: { width: 70, height: 70, borderRadius: 35, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center' },
  shutterInner: { width: 60, height: 60, borderRadius: 30, borderWidth: 2, borderColor: 'black' },
  closeCamera: { padding: 10 }
});