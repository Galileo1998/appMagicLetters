import { AppIcon as Ionicons } from "../../components/AppIcon";
import { ChildBackground } from "../../components/ChildBackground";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { listQuestionsForLetter, QuestionRow, saveQuestionAndMessage } from "../../../src/repos/questions_repo";

import { getLetter } from '../../../src/repos/letters_repo';
import { canEditLetter } from '../../../src/drawing/model';

export default function MessageScreen() {
  const { letterId } = useLocalSearchParams<{ letterId: string }>();
  const router = useRouter();
  const [questions, setQuestions] = useState<QuestionRow[]>([]);
  const [message, setMessage] = useState('');
  const [sponsor, setSponsor] = useState('');
  const [editable, setEditable] = useState(false);
  const [stage, setStage] = useState<'questions' | 'message'>('questions');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  const load = useCallback(async () => {
    if (!letterId) return;
    setLoading(true);
    try {
    const [rows, letter] = await Promise.all([listQuestionsForLetter(letterId), getLetter(letterId)]);
    setMessage(letter?.message_content ?? '');
    setSponsor(letter?.contact_name ?? '');
    setEditable(canEditLetter(letter?.status));
    setQuestions(rows);
    const chosen = rows.find(q => q.answer_in_message === 1) ?? rows.find(q => (q.answer_text ?? '').trim());
    setSelectedId(chosen?.id ?? null);
    setStage(chosen ? 'message' : 'questions');
    } catch { Alert.alert('Error', 'No se pudo cargar el mensaje.'); }
    finally { setLoading(false); }
  }, [letterId]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  async function saveContent() {
    if (!letterId || saving || !editable) return;
    if (message.trim().length <= 5) { Alert.alert('Mensaje incompleto', 'Redacta el contenido de la carta antes de guardar.'); return; }
    setSaving(true);
    try {
      await saveQuestionAndMessage(letterId, message, selected);
      Alert.alert('Guardado', 'Pregunta seleccionada y mensaje guardados correctamente.');
      router.back();
    } catch { Alert.alert('No se pudo guardar', 'Comprueba que la carta aún permite cambios e intenta nuevamente.'); }
    finally { setSaving(false); }
  }

  const selected = questions.find((question) => question.id === selectedId) ?? null;

  return (
    <View style={styles.container}>
      <ChildBackground />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={25} /></TouchableOpacity>
        <Text style={styles.title}>{stage === 'questions' ? '1. Seleccionar pregunta' : '2. Redactar mensaje'}</Text>
        <View style={{ width: 25 }} />
      </View>
      <KeyboardAvoidingView
        style={styles.keyboardArea}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        automaticallyAdjustKeyboardInsets
      >
        {loading ? <Text>Cargando...</Text> : <>
        {!editable && <Text style={styles.help}>Carta preparada para envío. Solo consulta.</Text>}
        {stage === 'questions' ? <>
        <Text style={styles.intro}>
          Selecciona una pregunta para guiar la carta. Responde al redactar el mensaje completo.
        </Text>

        {questions.length === 0 ? (
          <Text style={styles.empty}>No hay preguntas descargadas. Sincroniza cuando tengas señal.</Text>
        ) : questions.map((question) => {
          const selectedQuestion = selectedId === question.id;
          return (
            <TouchableOpacity
              key={question.id}
              style={[styles.questionRow, selectedQuestion && styles.questionSelected]}
              onPress={() => {
                setSelectedId(question.id);
                setStage('message');
                scrollRef.current?.scrollTo({ y: 0, animated: true });
              }}
              disabled={!editable || saving}
              activeOpacity={0.8}
            >
              <View style={[styles.radio, selectedQuestion && styles.radioSelected]}>
                {selectedQuestion ? <View style={styles.radioDot} /> : null}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.question}>
                  {question.question_text}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}

        </> : <>
          <Text style={styles.intro}>Escribe a tu patrocinador: {sponsor || 'Sin nombre registrado'}</Text>
          {selected && <View style={styles.answerCard}>
            <Text style={styles.answerLabel}>Pregunta seleccionada</Text>
            <Text style={styles.question}>{selected.question_text}</Text>
            {selected.help_text ? <Text style={styles.help}>{selected.help_text}</Text> : null}
          </View>}
          <Text style={[styles.answerLabel, { marginTop: 20 }]}>Redacta el contenido de la carta</Text>
          <TextInput editable={editable && !saving} multiline style={[styles.input, { minHeight: 240 }]} value={message} onChangeText={setMessage} placeholder="Escribe el mensaje completo..." textAlignVertical="top" />
          {editable && <TouchableOpacity disabled={saving} style={styles.answerCard} onPress={() => setStage('questions')}><Text>Cambiar pregunta</Text></TouchableOpacity>}
          {editable && <TouchableOpacity disabled={saving} style={styles.continueButton} onPress={saveContent}><Text style={styles.continueText}>{saving ? 'GUARDANDO...' : 'GUARDAR MENSAJE'}</Text></TouchableOpacity>}
        </>}
        </>}
      </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f6f8" },
  keyboardArea: { flex: 1 },
  header: { paddingTop: 52, paddingHorizontal: 18, paddingBottom: 15, backgroundColor: "rgba(255,255,255,0.94)", flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { fontSize: 18, fontWeight: "800" },
  content: { padding: 16, paddingBottom: 180 },
  intro: { color: "#556", lineHeight: 20, marginBottom: 14 },
  questionRow: { backgroundColor: "white", borderRadius: 11, padding: 13, marginBottom: 9, flexDirection: "row", alignItems: "flex-start", borderWidth: 1, borderColor: "#e8eaed" },
  questionSelected: { borderColor: "#79b82a", backgroundColor: "#fbfff4" },
  radio: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: "#a5abb2", marginRight: 12, marginTop: 1, alignItems: "center", justifyContent: "center" },
  radioSelected: { borderColor: "#8acb31" },
  radioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: "#aee754" },
  question: { fontSize: 15, lineHeight: 20, color: "#223" },
  answered: { color: "#3f8b23", fontSize: 11, fontWeight: "700", marginTop: 5 },
  answerCard: { backgroundColor: "white", borderRadius: 13, padding: 15, marginTop: 10 },
  answerLabel: { fontWeight: "900", color: "#34859B" },
  help: { color: "#667", fontSize: 12, marginTop: 4 },
  input: { minHeight: 120, backgroundColor: "#f5f6f8", borderRadius: 9, padding: 12, marginTop: 10 },
  continueButton: { backgroundColor: "#46B094", borderRadius: 12, padding: 15, marginTop: 18, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8 },
  continueText: { color: "white", fontWeight: "900" },
  empty: { color: "#667", textAlign: "center", marginVertical: 50 },
});
