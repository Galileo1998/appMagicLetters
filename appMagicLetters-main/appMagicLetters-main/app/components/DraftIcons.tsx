// app/components/DraftIcons.tsx
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { LetterRow } from "../../src/repos/letters_repo";

export function DraftIcons({ letter }: { letter: LetterRow }) {
  const icons: string[] = [];

  if ((letter.has_message ?? 0) > 0) icons.push("📝");
  if ((letter.photos_count ?? 0) > 0) icons.push("📷");
  if ((letter.has_drawing ?? 0) > 0) icons.push("🎨");

  if (!icons.length) return null;

  return (
    <View style={styles.row}>
      {icons.map((i, idx) => (
        <Text key={idx} style={styles.icon}>
          {i}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    marginTop: 6,
  },
  icon: {
    fontSize: 16,
    marginRight: 6,
  },
});
