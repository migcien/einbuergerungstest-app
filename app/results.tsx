import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { QUESTION_BANK, QUESTION_COUNT } from '@/lib/question-bank';
import { getQuestionImageSource } from '@/lib/question-images';
import { LatestExamResult, getLatestExamResult } from '@/lib/storage';
import { Question } from '@/types/question';

export default function ResultsScreen() {
  const router = useRouter();
  const [result, setResult] = useState<LatestExamResult | null>(null);

  const loadResult = useCallback(async () => {
    setResult(await getLatestExamResult());
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadResult();
    }, [loadResult]),
  );

  const questionById = useMemo(() => {
    const map = new Map<string, Question>();
    QUESTION_BANK.forEach((question) => {
      map.set(question.id, question);
    });
    return map;
  }, []);

  const wrongQuestions = useMemo(() => {
    if (!result) {
      return [];
    }

    return result.wrongIds
      .map((id) => questionById.get(id))
      .filter((question): question is Question => Boolean(question));
  }, [questionById, result]);

  if (!result) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>No exam results yet.</Text>
        <Pressable style={styles.primaryButton} onPress={() => router.replace('/exam')}>
          <Text style={styles.primaryButtonText}>Start Exam</Text>
        </Pressable>
      </View>
    );
  }

  const passScore = result.passScore ?? 17;
  const isPassed = result.score >= passScore;
  const percentage = Math.round((result.score / result.total) * 100);
  const retryMode =
    typeof result.examMode === 'string'
      ? result.examMode
      : result.examCount === 33
        ? 'standard33'
        : result.examCount === QUESTION_COUNT
          ? 'all'
          : String(result.examCount);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Result: {percentage}%</Text>
      <Text style={styles.summary}>
        Score {result.score} / {result.total}
      </Text>
      <Text style={[styles.passStatus, isPassed ? styles.pass : styles.fail]}>
        {isPassed ? `Passed (>= ${passScore})` : `Failed (< ${passScore})`}
      </Text>

      <View style={styles.actionBlock}>
        <Pressable
          style={styles.secondaryButton}
          onPress={() =>
            router.replace({
              pathname: '/exam',
              params: { retry: '1', mode: retryMode },
            })
          }>
          <Text style={styles.secondaryButtonText}>Retry</Text>
        </Pressable>

        <Pressable
          style={styles.secondaryButton}
          onPress={() =>
            router.push({
              pathname: '/learn',
              params: { source: 'mistakes' },
            })
          }>
          <Text style={styles.secondaryButtonText}>Review mistakes</Text>
        </Pressable>

        <Pressable style={styles.primaryButton} onPress={() => router.replace('/')}>
          <Text style={styles.primaryButtonText}>Back Home</Text>
        </Pressable>
      </View>

      <View style={styles.wrongList}>
        <Text style={styles.wrongHeading}>Wrong Questions ({wrongQuestions.length})</Text>
        {wrongQuestions.length === 0 ? (
          <Text style={styles.perfectText}>Perfect score. No mistakes.</Text>
        ) : (
          wrongQuestions.map((question, index) => {
            const selected = result.selectedById[question.id];
            const questionImage = getQuestionImageSource(question.id);
            return (
              <View key={question.id} style={styles.wrongCard}>
                <Text style={styles.wrongIndex}>
                  {index + 1}. {question.question}
                </Text>
                {questionImage && (
                  <Image source={questionImage} style={styles.questionImage} resizeMode="contain" />
                )}
                <Text style={styles.answerLine}>
                  Your answer:{' '}
                  {selected !== null && selected !== undefined ? question.options[selected] : 'No answer'}
                </Text>
                <Text style={styles.answerLine}>
                  Correct answer: {question.options[result.correctById[question.id]]}
                </Text>
              </View>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 18,
    gap: 14,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: '#111',
  },
  summary: {
    fontSize: 16,
    color: '#333',
  },
  passStatus: {
    fontWeight: '700',
  },
  pass: {
    color: '#1b7f2a',
  },
  fail: {
    color: '#a23c00',
  },
  actionBlock: {
    gap: 10,
  },
  wrongList: {
    gap: 10,
  },
  wrongHeading: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111',
  },
  wrongCard: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    gap: 4,
    backgroundColor: '#fff',
  },
  wrongIndex: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  answerLine: {
    color: '#333',
  },
  questionImage: {
    width: '100%',
    height: 180,
    borderRadius: 8,
    backgroundColor: '#f2f2f2',
  },
  perfectText: {
    color: '#2b7d32',
    fontWeight: '600',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  secondaryButtonText: {
    color: '#222',
    fontWeight: '600',
  },
  primaryButton: {
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#0b5fff',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  emptyContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#fff',
  },
  emptyTitle: {
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
    color: '#111',
  },
});
