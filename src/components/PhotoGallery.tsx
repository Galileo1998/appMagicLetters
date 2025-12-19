// src/components/PhotoGallery.tsx
import React, { useEffect, useState } from "react";
import { Image, Pressable, Text, View } from "react-native";
import { deletePhoto, listPhotosByLetter } from "../repos/photos_repo";
import type { Photo } from "../types/models";

export function PhotoGallery({ letterLocalId }: { letterLocalId: string }) {
  const [photos, setPhotos] = useState<Photo[]>([]);

  async function reload() {
    const rows = await listPhotosByLetter(letterLocalId);
    setPhotos(rows ?? []);
  }

  useEffect(() => {
    reload();
  }, [letterLocalId]);

  return (
    <View style={{ gap: 8 }}>
      {photos.map((p) => (
        <View key={String(p.id)} style={{ gap: 6 }}>
          <Image
            source={{ uri: p.photo_uri }}
            style={{ width: "100%", height: 200, borderRadius: 12 }}
            resizeMode="cover"
          />
          <Pressable
            onPress={async () => {
              if (p.id) await deletePhoto(p.id);
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
