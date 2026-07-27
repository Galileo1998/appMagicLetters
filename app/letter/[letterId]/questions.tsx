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
import { listQuestionsForLetter, QuestionRow, saveAnswer } from "../../../src/repos/questions_repo";

export default function QuestionsScreen() {
  const { letterId } = useLocalSearchParams<{ letterId: string }>();
  const router = useRouter();
  const [questions, setQuestions] = useState<QuestionRow[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  const revealAnswer = useCallback(() => {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 250);
  }, []);

  const load = useCallback(async () => {
    if (!letterId) return;
    const rows = await listQuestionsForLetter(letterId);
    const initial = Object.fromEntries(rows.map((q) => [q.id, q.answer_text ?? ""]));
    setQuestions(rows);
    setAnswers(initial);
    const answered = rows.find((q) => (q.answer_text ?? "").trim() !== "");
    setSelectedId(answered?.id ?? rows[0]?.id ?? null);
  }, [letterId]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  async function saveAndContinue() {
    if (!letterId) return;
    const answered = questions.filter((question) => (answers[question.id] ?? "").trim() !== "");
    const missingRequired = questions.some(
      (question) => question.is_required === 1 && !(answers[question.id] ?? "").trim()
    );
    if (missingRequired) {
      Alert.alert("Faltan respuestas", "Completa las preguntas marcadas como obligatorias.");
      return;
    }
    if (questions.length > 0 && answered.length === 0) {
      Alert.alert("Selecciona una pregunta", "Responde al menos una pregunta para continuar.");
      return;
    }
    for (const question of questions) {
      await saveAnswer(letterId, question, answers[question.id] ?? "");
    }
    router.replace(`/letter/${letterId}`);
  }

  const selected = questions.find((question) => question.id === selectedId) ?? null;

  return (
    <View style={styles.container}>
      <ChildBackground />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={25} /></TouchableOpacity>
        <Text style={styles.title}>Preguntas para conversar</Text>
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
        <Text style={styles.intro}>
          Selecciona una pregunta, conversa con el niño o cuidador y escribe la respuesta. Puedes responder más de una.
        </Text>

        {questions.length === 0 ? (
          <Text style={styles.empty}>No hay preguntas descargadas. Sincroniza cuando tengas señal.</Text>
        ) : questions.map((question) => {
          const selectedQuestion = selectedId === question.id;
          const hasAnswer = (answers[question.id] ?? "").trim() !== "";
          return (
            <TouchableOpacity
              key={question.id}
              style={[styles.questionRow, selectedQuestion && styles.questionSelected]}
              onPress={() => {
                setSelectedId(question.id);
                revealAnswer();
              }}
              activeOpacity={0.8}
            >
              <View style={[styles.radio, selectedQuestion && styles.radioSelected]}>
                {selectedQuestion ? <View style={styles.radioDot} /> : null}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.question}>
                  {question.question_text}{question.is_required ? " *" : ""}
                </Text>
                {hasAnswer ? <Text style={styles.answered}>Respuesta guardada</Text> : null}
              </View>
            </TouchableOpacity>
          );
        })}

        {selected ? (
          <View style={styles.answerCard}>
            <Text style={styles.answerLabel}>Respuesta</Text>
            {selected.help_text ? <Text style={styles.help}>{selected.help_text}</Text> : null}
            <TextInput
              style={styles.input}
              multiline
              value={answers[selected.id] ?? ""}
              onChangeText={(text) => setAnswers((current) => ({ ...current, [selected.id]: text }))}
              placeholder="Escribe lo que respondió..."
              textAlignVertical="top"
              onFocus={revealAnswer}
            />
          </View>
        ) : null}

        <TouchableOpacity style={styles.continueButton} onPress={saveAndContinue}>
          <Text style={styles.continueText}>GUARDAR Y CONTINUAR</Text>
          <Ionicons name="arrow-forward" size={20} color="white" />
        </TouchableOpacity>
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
