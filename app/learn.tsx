import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { resolveBundesland } from '@/lib/bundesland';
import { getQuestionBank } from '@/lib/question-bank';
import { getQuestionImageSource } from '@/lib/question-images';
import {
  DEFAULT_PROGRESS,
  ProgressState,
  clearLearnCheckpoint,
  getLearnCheckpoint,
  getProgress,
  saveLearnCheckpoint,
  saveProgress,
} from '@/lib/storage';
import { Question } from '@/types/question';

function toggleItem(items: string[], id: string): string[] {
  return items.includes(id) ? items.filter((item) => item !== id) : [...items, id];
}

export default function LearnScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ source?: string; bundesland?: string }>();
  const [progress, setProgress] = useState<ProgressState>(DEFAULT_PROGRESS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedById, setSelectedById] = useState<Record<string, number>>({});
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [completionHandled, setCompletionHandled] = useState(false);

  const mistakesOnly = params.source === 'mistakes';
  const bundesland = resolveBundesland(params.bundesland);
  const questionBank = useMemo(() => getQuestionBank(bundesland), [bundesland]);

  const loadProgress = useCallback(async () => {
    const [nextProgress, checkpoint] = await Promise.all([
      getProgress(),
      mistakesOnly ? Promise.resolve(null) : getLearnCheckpoint(),
    ]);

    setProgress(nextProgress);

    if (mistakesOnly) {
      setCurrentIndex(0);
      setSelectedById({});
      setStatusMessage(null);
      return;
    }

    if (!mistakesOnly && checkpoint) {
      setCurrentIndex(checkpoint.currentIndex);
      setSelectedById(checkpoint.selectedById);
      setStatusMessage('Resumed from saved learn progress.');
      return;
    }

    setCurrentIndex(0);
    setSelectedById({});
    setStatusMessage(null);
  }, [mistakesOnly]);

  useFocusEffect(
    useCallback(() => {
      loadProgress();
    }, [loadProgress]),
  );

  const questions: Question[] = useMemo(() => {
    if (!mistakesOnly) {
      return questionBank;
    }

    const mistakes = new Set(progress.mistakeIds);
    return questionBank.filter((question) => mistakes.has(question.id));
  }, [mistakesOnly, progress.mistakeIds, questionBank]);

  const safeIndex = questions.length > 0 ? currentIndex % questions.length : 0;
  const question = questions[safeIndex];
  const questionImage = question ? getQuestionImageSource(question.id) : null;

  const selectedIndex = question ? selectedById[question.id] : undefined;
  const isCorrect = selectedIndex === question?.correctIndex;

  const knownSet = useMemo(() => new Set(progress.knownIds), [progress.knownIds]);
  const reviewSet = useMemo(() => new Set(progress.reviewLaterIds), [progress.reviewLaterIds]);
  const answeredIds = useMemo(
    () => questions.filter((item) => selectedById[item.id] !== undefined).map((item) => item.id),
    [questions, selectedById],
  );
  const answeredCount = answeredIds.length;

  const updateProgress = useCallback(async (nextProgress: ProgressState) => {
    setProgress(nextProgress);
    await saveProgress(nextProgress);
  }, []);

  const onSaveCheckpoint = async () => {
    if (mistakesOnly || questions.length === 0) {
      return;
    }

    await saveLearnCheckpoint({
      currentIndex: safeIndex,
      selectedById,
      answeredIds,
      updatedAt: Date.now(),
    });
    setStatusMessage('Learn progress saved.');
  };

  useEffect(() => {
    const isComplete = !mistakesOnly && questions.length > 0 && answeredCount >= questions.length;
    if (!isComplete || completionHandled) {
      if (!isComplete && completionHandled) {
        setCompletionHandled(false);
      }
      return;
    }

    setCompletionHandled(true);
    setStatusMessage('All learn questions answered. Saved checkpoint was reset.');
    void clearLearnCheckpoint();
  }, [answeredCount, completionHandled, mistakesOnly, questions.length]);

  const onToggleKnown = async () => {
    if (!question) {
      return;
    }
    await updateProgress({
      ...progress,
      knownIds: toggleItem(progress.knownIds, question.id),
    });
  };

  const onToggleReviewLater = async () => {
    if (!question) {
      return;
    }
    await updateProgress({
      ...progress,
      reviewLaterIds: toggleItem(progress.reviewLaterIds, question.id),
    });
  };

  const onNext = () => {
    if (questions.length === 0) {
      return;
    }
    setCurrentIndex((prev) => (prev + 1) % questions.length);
  };

  if (mistakesOnly && questions.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>No mistakes to review.</Text>
        <Pressable style={styles.primaryButton} onPress={() => router.replace('/')}>
          <Text style={styles.primaryButtonText}>Back Home</Text>
        </Pressable>
      </View>
    );
  }

  if (!question) {
    return null;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.counter}>
        Question {safeIndex + 1} / {questions.length} - Answered {answeredCount}/{questions.length}
      </Text>
      {statusMessage && <Text style={styles.statusMessage}>{statusMessage}</Text>}
      <Text style={styles.question}>{question.question}</Text>
      {questionImage && <Image source={questionImage} style={styles.questionImage} resizeMode="contain" />}

      <View style={styles.optionsContainer}>
        {question.options.map((option, index) => {
          const selected = selectedIndex === index;
          return (
            <Pressable
              key={`${question.id}-${index}`}
              style={[styles.option, selected && styles.optionSelected]}
              onPress={() => setSelectedById((prev) => ({ ...prev, [question.id]: index }))}>
              <Text style={styles.optionText}>
                {String.fromCharCode(65 + index)}. {option}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {selectedIndex !== undefined && (
        <View style={[styles.feedbackBox, isCorrect ? styles.correctBox : styles.wrongBox]}>
          <Text style={styles.feedbackText}>{isCorrect ? 'Correct.' : 'Incorrect.'}</Text>
          {!isCorrect && (
            <Text style={styles.feedbackDetail}>
              Correct answer: {question.options[question.correctIndex]}
            </Text>
          )}
          {!!question.explanation && <Text style={styles.feedbackDetail}>{question.explanation}</Text>}
        </View>
      )}

      <View style={styles.actionRow}>
        <Pressable style={styles.secondaryButton} onPress={onToggleKnown}>
          <Text style={styles.secondaryButtonText}>
            {knownSet.has(question.id) ? 'Unmark Known' : 'Mark Known'}
          </Text>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={onToggleReviewLater}>
          <Text style={styles.secondaryButtonText}>
            {reviewSet.has(question.id) ? 'Unmark Review Later' : 'Review Later'}
          </Text>
        </Pressable>
        {!mistakesOnly && (
          <Pressable style={styles.secondaryButton} onPress={onSaveCheckpoint}>
            <Text style={styles.secondaryButtonText}>Save Progress</Text>
          </Pressable>
        )}
      </View>

      <Pressable style={styles.primaryButton} onPress={onNext}>
        <Text style={styles.primaryButtonText}>Next</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 18,
    gap: 14,
    backgroundColor: '#fff',
  },
  counter: {
    fontSize: 14,
    color: '#666',
  },
  question: {
    fontSize: 22,
    lineHeight: 30,
    fontWeight: '700',
    color: '#101010',
  },
  questionImage: {
    width: '100%',
    height: 220,
    borderRadius: 8,
    backgroundColor: '#f2f2f2',
  },
  optionsContainer: {
    gap: 10,
  },
  option: {
    borderWidth: 1,
    borderColor: '#d6d6d6',
    borderRadius: 10,
    padding: 12,
    backgroundColor: '#fff',
  },
  optionSelected: {
    borderColor: '#0b5fff',
    backgroundColor: '#eef4ff',
  },
  optionText: {
    fontSize: 16,
    color: '#1a1a1a',
  },
  feedbackBox: {
    borderRadius: 10,
    padding: 12,
    gap: 4,
  },
  correctBox: {
    backgroundColor: '#eaf8ee',
    borderColor: '#74b681',
    borderWidth: 1,
  },
  wrongBox: {
    backgroundColor: '#fff0f0',
    borderColor: '#e08c8c',
    borderWidth: 1,
  },
  feedbackText: {
    fontWeight: '700',
    fontSize: 16,
  },
  feedbackDetail: {
    color: '#333',
  },
  statusMessage: {
    color: '#135d21',
    fontWeight: '600',
  },
  actionRow: {
    gap: 10,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#c5c5c5',
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
    paddingVertical: 13,
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
    backgroundColor: '#fff',
    gap: 12,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111',
    textAlign: 'center',
  },
});
