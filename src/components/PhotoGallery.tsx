// src/components/PhotoGallery.tsx
import React, { useCallback, useEffect, useState } from "react";
import { Image, Pressable, Text, View } from "react-native";
import { deletePhoto, listPhotos, PhotoRow } from "../repos/photos_repo";

export function PhotoGallery({ letterLocalId }: { letterLocalId: string }) {
  const [photos, setPhotos] = useState<PhotoRow[]>([]);

  const reload = useCallback(async () => {
    const rows = await listPhotos(letterLocalId);
    setPhotos(rows ?? []);
  }, [letterLocalId]);

  useEffect(() => {
    reload();
  }, [reload]);

  return (
    <View style={{ gap: 8 }}>
      {photos.map((p) => (
        <View key={String(p.id)} style={{ gap: 6 }}>
          <Image
            source={{ uri: p.file_path }}
            style={{ width: "100%", height: 200, borderRadius: 12 }}
            resizeMode="cover"
          />
          <Pressable
            onPress={async () => {
              await deletePhoto(letterLocalId, p.slot);
              await reload();
            }}
            style={{ padding: 10, borderWidth: 1, borderRadius: 10 }}
          >
            <Text>Eliminar</Text>
          </Pressable>
        </View>
      ))}
      {photos.length === 0 ? <Text>No hay fotos aún.</Text> : null}
    </View>
  );
}
