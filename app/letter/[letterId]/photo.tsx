import { AppIcon as Ionicons } from '../../components/AppIcon';
import { ChildBackground } from '../../components/ChildBackground';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Button,
  Image,
  ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View
} from 'react-native';
import { getLetter, LetterRow } from '../../../src/repos/letters_repo';
import { addPhoto, deletePhoto, listPhotos, PhotoRow, updatePhotoDescription } from '../../../src/repos/photos_repo';

export default function PhotoScreen() {
  const { letterId } = useLocalSearchParams<{ letterId: string }>();
  const router = useRouter();
  
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  
  const [photos, setPhotos] = useState<PhotoRow[]>([]);
  const [showCamera, setShowCamera] = useState(false); // 👈 Controla si vemos galería o cámara
  const [loading, setLoading] = useState(false);
  const [pendingUri, setPendingUri] = useState<string | null>(null);
  const [pendingDescription, setPendingDescription] = useState("");
  const [letterStatus, setLetterStatus] = useState<LetterRow["status"] | null>(null);
  const canEdit = letterStatus !== null &&
    ["DRAFT", "ASSIGNED", "RETURNED"].includes(letterStatus);

  const loadPhotos = useCallback(async () => {
    if(!letterId) return;
    try {
        const [list, letter] = await Promise.all([
          listPhotos(letterId),
          getLetter(letterId),
        ]);
        setPhotos(list);
        setLetterStatus(letter?.status ?? null);
    } catch(e) { console.error(e); }
  }, [letterId]);

  useEffect(() => { void loadPhotos(); }, [loadPhotos]);

  async function pickFromGallery() {
    if (!letterId || !canEdit || photos.length >= 3) return;
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert("Permiso requerido", "Permite el acceso a fotografías para elegir una imagen.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: false,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      setPendingUri(result.assets[0].uri);
      setPendingDescription("");
    }
  }

  // --- MODO: GALERÍA (Vista Principal) ---
  if (!showCamera) {
    return (
      <View style={styles.container}>
        <ChildBackground />
        {/* Header */}
        <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.title}>Fotos ({photos.length}/3)</Text>
            <View style={{width:30}}/>
        </View>

        <ScrollView contentContainerStyle={styles.galleryContent}>
            {pendingUri && canEdit ? (
              <View style={styles.descriptionCard}>
                <Image source={{ uri: pendingUri }} style={styles.preview} />
                <Text style={styles.descriptionTitle}>¿Qué representa esta fotografía?</Text>
                <TextInput
                  value={pendingDescription}
                  onChangeText={setPendingDescription}
                  style={styles.descriptionInput}
                  multiline
                  placeholder="Describe quién aparece, qué hace y dónde..."
                />
                <TouchableOpacity
                  style={[styles.saveDescription, !pendingDescription.trim() && { opacity: 0.5 }]}
                  disabled={!pendingDescription.trim()}
                  onPress={async () => {
                    await addPhoto(letterId!, pendingUri, pendingDescription);
                    setPendingUri(null);
                    setPendingDescription("");
                    await loadPhotos();
                  }}
                ><Text style={styles.fabText}>GUARDAR FOTO</Text></TouchableOpacity>
              </View>
            ) : null}
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
                        {canEdit ? <TouchableOpacity 
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
                        </TouchableOpacity> : null}
                        <TextInput
                          style={styles.photoDescription}
                          multiline
                          editable={canEdit}
                          value={p.description}
                          placeholder="Descripción obligatoria"
                          onChangeText={(text) => setPhotos((current) => current.map((x) => x.id === p.id ? { ...x, description: text } : x))}
                          onBlur={() => {
                            if (canEdit) void updatePhotoDescription(letterId!, p.slot, p.description);
                          }}
                        />
                    </View>
                ))}
            </View>
        </ScrollView>

        {canEdit ? (
          <View style={styles.actionsPanel}>
            {photos.length >= 3 ? (
              <Text style={styles.limitHint}>Elimina una fotografía para agregar otra</Text>
            ) : null}
            <View style={styles.actionsBar}>
            <TouchableOpacity
              style={[styles.photoAction, photos.length >= 3 && styles.disabledAction]}
              disabled={photos.length >= 3}
              onPress={() => setShowCamera(true)}
            >
                <Ionicons name="camera" size={30} color="white" />
                <Text style={styles.fabText}>TOMAR FOTO</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.photoAction, styles.galleryAction, photos.length >= 3 && styles.disabledAction]}
              disabled={photos.length >= 3}
              onPress={pickFromGallery}
            >
                <Ionicons name="images" size={28} color="white" />
                <Text style={styles.fabText}>GALERÍA</Text>
            </TouchableOpacity>
            </View>
          </View>
        ) : !canEdit ? (
            <View style={styles.lockedBanner}>
                <Text style={styles.bannerText}>Paquete preparado: las fotografías están bloqueadas</Text>
            </View>
        ) : null}
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
                setPendingUri(photo.uri);
                setPendingDescription("");
                setShowCamera(false); // Volver a galería automáticamente
            }
        } catch {
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
  container: { flex: 1, backgroundColor: '#F7FCFF' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems:'center', padding: 20, paddingTop: 50, backgroundColor: 'white', elevation:2 },
  backBtn: { padding: 5 },
  title: { fontSize: 18, fontWeight: 'bold' },
  
  galleryContent: { padding: 20, paddingBottom: 110 },
  emptyState: { alignItems: 'center', marginTop: 100 },
  
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  photoCard: { width: '48%', borderRadius: 10, overflow: 'hidden', position: 'relative', elevation: 3, backgroundColor:'white' },
  thumb: { width: '100%', aspectRatio: 1 },
  photoBadge: { position: 'absolute', top: 5, left: 5, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 10, width: 24, height: 24, justifyContent:'center', alignItems:'center' },
  badgeText: { color: 'white', fontWeight: 'bold', fontSize: 12 },
  deleteBtn: { position: 'absolute', top: 5, right: 5, zIndex: 20, elevation: 12, backgroundColor: '#d32f2f', padding: 8, borderRadius: 20 },

  actionsPanel: { position: 'absolute', bottom: 18, left: 18, right: 18 },
  actionsBar: { flexDirection: 'row', gap: 10 },
  photoAction: { flex: 1, minHeight: 54, backgroundColor: '#1e62d0', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 14, borderRadius: 28, elevation: 5 },
  galleryAction: { backgroundColor: '#46B094' },
  disabledAction: { opacity: 0.45 },
  limitHint: { color: '#6b4e00', backgroundColor: '#fff3cd', borderRadius: 9, padding: 8, marginBottom: 8, textAlign: 'center', fontWeight: '700' },
  fabText: { color: 'white', fontWeight: 'bold', marginLeft: 10 },
  limitBanner: { position: 'absolute', bottom: 0, width: '100%', backgroundColor: '#28a745', padding: 15, alignItems: 'center' },
  lockedBanner: { position: 'absolute', bottom: 0, width: '100%', backgroundColor: '#6c757d', padding: 15, alignItems: 'center' },
  bannerText: { color: 'white', fontWeight: 'bold', textAlign: 'center' },

  camera: { flex: 1 },
  cameraControls: { position: 'absolute', bottom: 0, width: '100%', height: 120, backgroundColor: 'rgba(0,0,0,0.5)', flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  shutterBtn: { width: 70, height: 70, borderRadius: 35, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center' },
  shutterInner: { width: 60, height: 60, borderRadius: 30, borderWidth: 2, borderColor: 'black' },
  closeCamera: { padding: 10 },
  descriptionCard: { backgroundColor: 'white', borderRadius: 12, padding: 12, marginBottom: 18 },
  preview: { width: '100%', height: 220, borderRadius: 9 },
  descriptionTitle: { fontWeight: '800', marginTop: 12 },
  descriptionInput: { minHeight: 80, backgroundColor: '#f1f3f5', borderRadius: 8, padding: 10, marginTop: 8 },
  saveDescription: { backgroundColor: '#1e62d0', padding: 12, borderRadius: 9, alignItems: 'center', marginTop: 9 },
  photoDescription: { minHeight: 70, padding: 9, backgroundColor: '#fff', textAlignVertical: 'top' }
});
