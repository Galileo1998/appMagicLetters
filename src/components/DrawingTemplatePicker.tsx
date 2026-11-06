import React, { useState } from 'react';
import { FlatList, Modal, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg from 'react-native-svg';
import { DRAWING_TEMPLATES, TEMPLATE_CATEGORIES, TemplateCategory } from '../drawing/templates';

type Props = {
  category: TemplateCategory | 'Todas';
  templates: typeof DRAWING_TEMPLATES;
  selectedTemplate: string | null;
  onClose: () => void;
  onCategoryChange: (category: TemplateCategory | 'Todas') => void;
  onSelect: (id: string) => void;
  onRandom: () => void;
  renderTemplate: (id: string) => React.ReactNode;
};

export function DrawingTemplatePicker({ category, templates, selectedTemplate, onClose, onCategoryChange, onSelect, onRandom, renderTemplate }: Props) {
  const { width, height, fontScale } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [gridWidth, setGridWidth] = useState(0);
  const gap = 12;
  const columns = Math.max(1, Math.min(5, Math.floor((gridWidth + gap) / (144 * Math.max(1, fontScale) + gap))));
  const cardWidth = gridWidth > 0 ? (gridWidth - gap * (columns - 1)) / columns : undefined;

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={[styles.overlay, {
        paddingLeft: Math.max(insets.left, width >= 600 ? 24 : 8),
        paddingRight: Math.max(insets.right, width >= 600 ? 24 : 8),
        paddingTop: Math.max(insets.top, 12),
        paddingBottom: Math.max(insets.bottom, 12),
      }]}>
        <View style={[styles.sheet, { height: height < 500 ? '100%' : '90%' }]}>
          <View style={styles.header}>
            <Text style={styles.title}>{DRAWING_TEMPLATES.length} plantillas para dibujar</Text>
            <TouchableOpacity accessibilityRole="button" accessibilityLabel="Cerrar plantillas" onPress={onClose} style={styles.close}>
              <Text allowFontScaling={false} style={styles.closeText}>×</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.grid} onLayout={event => setGridWidth(event.nativeEvent.layout.width)}>
            {/* One vertical scroller keeps all filters reachable on short screens and with large text. */}
            <FlatList
              key={columns}
              data={templates}
              numColumns={columns}
              keyExtractor={item => item.id}
              extraData={selectedTemplate}
              style={styles.list}
              contentContainerStyle={styles.listContent}
              columnWrapperStyle={columns > 1 ? styles.row : undefined}
              initialNumToRender={10}
              windowSize={3}
              ListHeaderComponent={<>
                <Text style={styles.subtitle}>Contornos definidos, offline; no aparecen en el dibujo guardado</Text>
                <TouchableOpacity accessibilityRole="button" onPress={onRandom} style={styles.random}>
                  <Text style={styles.randomText}>✨ Generar una guía al azar</Text>
                </TouchableOpacity>
                <View style={styles.categories}>
                  {TEMPLATE_CATEGORIES.map(item => (
                    <TouchableOpacity
                      key={item}
                      accessibilityRole="button"
                      accessibilityState={{ selected: category === item }}
                      onPress={() => onCategoryChange(item)}
                      style={[styles.chip, category === item && styles.activeChip]}
                    >
                      <Text style={[styles.chipText, category === item && styles.activeChipText]}>{item}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>}
              renderItem={({ item }) => (
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel={item.name}
                  accessibilityState={{ selected: selectedTemplate === item.id }}
                  onPress={() => onSelect(item.id)}
                  style={[styles.card, { width: cardWidth }, selectedTemplate === item.id && styles.activeCard]}
                >
                  <View style={[styles.preview, { height: Math.min(180, Math.max(120, (cardWidth ?? 144) * 0.8)) }]}>
                    <Svg width="100%" height="100%" viewBox="0 0 360 520">{renderTemplate(item.id)}</Svg>
                  </View>
                  <Text style={styles.emoji}>{item.emoji}</Text>
                  <Text style={styles.name}>{item.name}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(17,24,39,0.48)', justifyContent: 'center', alignItems: 'center' },
  sheet: { width: '100%', maxWidth: 1000, backgroundColor: '#fffdf7', borderRadius: 24, padding: 16 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8, flexShrink: 0 },
  title: { flex: 1, minWidth: 0, fontSize: 20, fontWeight: '800', color: '#342b4a' },
  close: { width: 44, height: 44, flexShrink: 0, borderRadius: 22, backgroundColor: '#f2f4f7', alignItems: 'center', justifyContent: 'center' },
  closeText: { fontSize: 28, color: '#475467' },
  grid: { flex: 1, minHeight: 0 },
  list: { flex: 1 },
  listContent: { paddingBottom: 12 },
  subtitle: { fontSize: 12, color: '#667085', marginBottom: 14 },
  random: { minHeight: 48, padding: 12, backgroundColor: '#7c3aed', borderRadius: 12, marginBottom: 14, alignItems: 'center', justifyContent: 'center' },
  randomText: { color: '#fff', fontWeight: '800', fontSize: 14, textAlign: 'center' },
  categories: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start', gap: 8, marginBottom: 16 },
  chip: { maxWidth: '100%', minHeight: 44, paddingHorizontal: 13, paddingVertical: 10, borderRadius: 22, backgroundColor: '#f2f4f7', borderWidth: 1, borderColor: '#e4e7ec', justifyContent: 'center' },
  activeChip: { backgroundColor: '#ede9fe', borderColor: '#8b5cf6' },
  chipText: { flexShrink: 1, fontSize: 14, fontWeight: '700', color: '#475467' },
  activeChipText: { color: '#6d28d9' },
  row: { gap: 12 },
  card: { marginBottom: 12, borderRadius: 14, backgroundColor: '#fff', borderWidth: 2, borderColor: '#e4e7ec', overflow: 'hidden', alignItems: 'center' },
  activeCard: { borderColor: '#7c3aed', backgroundColor: '#faf5ff' },
  preview: { width: '100%', padding: 8 },
  emoji: { position: 'absolute', right: 8, top: 7, fontSize: 20 },
  name: { alignSelf: 'stretch', paddingHorizontal: 8, paddingBottom: 12, fontSize: 14, fontWeight: '700', color: '#344054', textAlign: 'center' },
});
