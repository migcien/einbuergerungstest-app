import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  QUESTION_BANK,
  QUESTION_COUNT,
  buildStandardExamQuestions,
  pickRandomQuestions,
} from '@/lib/question-bank';
import { getQuestionImageSource } from '@/lib/question-images';
import {
  LatestExamResult,
  getProgress,
  saveLatestExamResult,
  saveProgress,
} from '@/lib/storage';
import { Question } from '@/types/question';

const PASS_SCORE = 17;
const EXAM_OPTIONS = [
  { key: 'standard33', label: '33 Standard', count: 33 },
  { key: '10', label: '10', count: 10 },
  { key: '20', label: '20', count: 20 },
  { key: '50', label: '50', count: 50 },
  { key: 'all', label: 'All', count: QUESTION_COUNT },
] as const;

type ExamOptionKey = (typeof EXAM_OPTIONS)[number]['key'];

function resolveExamOptionKey(value: string | string[] | undefined): ExamOptionKey {
  const raw = Array.isArray(value) ? value[0] : value;
  if (EXAM_OPTIONS.some((option) => option.key === raw)) {
    return raw as ExamOptionKey;
  }
  return 'standard33';
}

function resolveQuestionsForOption(optionKey: ExamOptionKey): Question[] {
  if (optionKey === 'standard33') {
    return buildStandardExamQuestions();
  }

  const selected = EXAM_OPTIONS.find((option) => option.key === optionKey);
  if (!selected) {
    return pickRandomQuestions(QUESTION_BANK, 10);
  }

  return pickRandomQuestions(QUESTION_BANK, selected.count);
}

export default function ExamScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string; retry?: string }>();

  const [selectedOption, setSelectedOption] = useState<ExamOptionKey>('standard33');
  const [active, setActive] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, number | null>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showLiveScore, setShowLiveScore] = useState(false);

  const currentQuestion = questions[currentIndex];
  const questionImage = currentQuestion ? getQuestionImageSource(currentQuestion.id) : null;
  const answeredCount = useMemo(
    () => Object.values(answers).filter((value) => value !== null && value !== undefined).length,
    [answers],
  );
  const liveCorrectCount = useMemo(
    () =>
      questions.reduce(
        (total, question) => total + (answers[question.id] === question.correctIndex ? 1 : 0),
        0,
      ),
    [answers, questions],
  );

  const startExam = (optionKey: ExamOptionKey) => {
    const selectedQuestions = resolveQuestionsForOption(optionKey);
    const initialAnswers: Record<string, number | null> = {};
    selectedQuestions.forEach((question) => {
      initialAnswers[question.id] = null;
    });

    setSelectedOption(optionKey);
    setQuestions(selectedQuestions);
    setAnswers(initialAnswers);
    setCurrentIndex(0);
    setShowLiveScore(false);
    setActive(true);
  };

  useEffect(() => {
    if (params.retry !== '1') {
      return;
    }

    const retryMode = resolveExamOptionKey(params.mode);
    startExam(retryMode);
  }, [params.mode, params.retry]);

  const finishExam = async () => {
    if (!questions.length) {
      return;
    }

    const correctById: Record<string, number> = {};
    const wrongIds: string[] = [];
    let score = 0;

    questions.forEach((question) => {
      correctById[question.id] = question.correctIndex;
      if (answers[question.id] === question.correctIndex) {
        score += 1;
      } else {
        wrongIds.push(question.id);
      }
    });

    const result: LatestExamResult = {
      timestamp: Date.now(),
      examCount: questions.length,
      total: questions.length,
      score,
      questionIds: questions.map((question) => question.id),
      wrongIds,
      selectedById: answers,
      correctById,
      examMode: selectedOption,
      passScore: PASS_SCORE,
    };

    await saveLatestExamResult(result);

    const progress = await getProgress();
    await saveProgress({
      ...progress,
      mistakeIds: wrongIds,
    });

    router.replace('/results');
  };

  if (!active) {
    return (
      <View style={styles.setupContainer}>
        <Text style={styles.title}>Exam Setup</Text>
        <Text style={styles.subtitle}>Choose number of questions.</Text>

        <View style={styles.optionGrid}>
          {EXAM_OPTIONS.map((option) => {
            const selected = selectedOption === option.key;
            return (
              <Pressable
                key={option.key}
                style={[styles.setupOption, selected && styles.setupOptionSelected]}
                onPress={() => setSelectedOption(option.key)}>
                <Text style={[styles.setupOptionText, selected && styles.setupOptionTextSelected]}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.standardHint}>Standard 33: 30 from first 300 + 3 from last 10.</Text>

        <Pressable style={styles.primaryButton} onPress={() => startExam(selectedOption)}>
          <Text style={styles.primaryButtonText}>Start Exam</Text>
        </Pressable>
      </View>
    );
  }

  if (!currentQuestion) {
    return null;
  }

  return (
    <ScrollView contentContainerStyle={styles.examContainer}>
      <Text style={styles.progressText}>
        Question {currentIndex + 1}/{questions.length} - Answered {answeredCount}/{questions.length}
      </Text>
      <Text style={styles.questionText}>{currentQuestion.question}</Text>
      {questionImage && <Image source={questionImage} style={styles.questionImage} resizeMode="contain" />}

      <Pressable style={styles.secondaryButton} onPress={() => setShowLiveScore((prev) => !prev)}>
        <Text style={styles.secondaryButtonText}>
          {showLiveScore ? 'Hide Live Score' : 'Show Live Score'}
        </Text>
      </Pressable>

      {showLiveScore && (
        <View style={styles.liveScoreCard}>
          <Text style={styles.liveScoreText}>
            Correct so far: {liveCorrectCount} (Need {PASS_SCORE} to pass)
          </Text>
          <Text style={[styles.liveScoreStatus, liveCorrectCount >= PASS_SCORE ? styles.pass : styles.fail]}>
            {liveCorrectCount >= PASS_SCORE ? 'Currently passing' : 'Currently below pass threshold'}
          </Text>
        </View>
      )}

      <View style={styles.optionsBlock}>
        {currentQuestion.options.map((option, index) => {
          const selected = answers[currentQuestion.id] === index;
          return (
            <Pressable
              key={`${currentQuestion.id}-${index}`}
              style={[styles.option, selected && styles.optionSelected]}
              onPress={() =>
                setAnswers((prev) => ({
                  ...prev,
                  [currentQuestion.id]: index,
                }))
              }>
              <Text style={styles.optionText}>
                {String.fromCharCode(65 + index)}. {option}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.navRow}>
        <Pressable
          style={[styles.secondaryButton, currentIndex === 0 && styles.disabledButton]}
          disabled={currentIndex === 0}
          onPress={() => setCurrentIndex((prev) => Math.max(prev - 1, 0))}>
          <Text style={styles.secondaryButtonText}>Previous</Text>
        </Pressable>

        {currentIndex < questions.length - 1 ? (
          <Pressable
            style={styles.secondaryButton}
            onPress={() => setCurrentIndex((prev) => Math.min(prev + 1, questions.length - 1))}>
            <Text style={styles.secondaryButtonText}>Next</Text>
          </Pressable>
        ) : (
          <Pressable style={styles.primaryButton} onPress={finishExam}>
            <Text style={styles.primaryButtonText}>Finish Exam</Text>
          </Pressable>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  setupContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#fff',
    gap: 14,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111',
  },
  subtitle: {
    color: '#444',
    fontSize: 16,
  },
  standardHint: {
    color: '#444',
    fontSize: 13,
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  setupOption: {
    minWidth: '30%',
    borderWidth: 1,
    borderColor: '#ccc',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  setupOptionSelected: {
    borderColor: '#0b5fff',
    backgroundColor: '#eef4ff',
  },
  setupOptionText: {
    color: '#222',
    fontWeight: '600',
  },
  setupOptionTextSelected: {
    color: '#0b5fff',
  },
  examContainer: {
    padding: 18,
    gap: 14,
    backgroundColor: '#fff',
  },
  progressText: {
    color: '#555',
    fontSize: 14,
  },
  questionText: {
    fontSize: 22,
    lineHeight: 30,
    fontWeight: '700',
    color: '#111',
  },
  questionImage: {
    width: '100%',
    height: 230,
    borderRadius: 8,
    backgroundColor: '#f2f2f2',
  },
  liveScoreCard: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    gap: 4,
    backgroundColor: '#fafafa',
  },
  liveScoreText: {
    fontSize: 15,
    color: '#222',
  },
  liveScoreStatus: {
    fontWeight: '700',
  },
  pass: {
    color: '#1b7f2a',
  },
  fail: {
    color: '#a23c00',
  },
  optionsBlock: {
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
    color: '#1e1e1e',
  },
  navRow: {
    flexDirection: 'row',
    gap: 10,
  },
  disabledButton: {
    opacity: 0.5,
  },
  secondaryButton: {
    flex: 1,
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
    flex: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#0b5fff',
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});
