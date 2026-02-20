import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { QUESTION_COUNT } from '@/lib/question-bank';
import { DEFAULT_PROGRESS, ProgressState, getLearnCheckpoint, getProgress } from '@/lib/storage';

export default function HomeScreen() {
  const router = useRouter();
  const [progress, setProgress] = useState<ProgressState>(DEFAULT_PROGRESS);
  const [learnCheckpointInfo, setLearnCheckpointInfo] = useState('No saved Learn checkpoint.');

  const loadProgress = useCallback(async () => {
    const [nextProgress, checkpoint] = await Promise.all([getProgress(), getLearnCheckpoint()]);
    setProgress(nextProgress);
    if (!checkpoint) {
      setLearnCheckpointInfo('No saved Learn checkpoint.');
      return;
    }
    setLearnCheckpointInfo(
      `Saved Learn checkpoint: Question ${checkpoint.currentIndex + 1}, Answered ${checkpoint.answeredIds.length}`,
    );
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProgress();
    }, [loadProgress]),
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Einbuergerungstest Study</Text>
      <Text style={styles.subtitle}>Offline trainer with Learn and Exam modes.</Text>

      <Pressable style={styles.primaryButton} onPress={() => router.push('/learn')}>
        <Text style={styles.primaryButtonText}>Learn</Text>
      </Pressable>

      <Pressable style={styles.primaryButton} onPress={() => router.push('/exam')}>
        <Text style={styles.primaryButtonText}>Exam</Text>
      </Pressable>

      <View style={styles.statsCard}>
        <Text style={styles.statsHeading}>Progress</Text>
        <Text style={styles.statsText}>Questions: {QUESTION_COUNT}</Text>
        <Text style={styles.statsText}>Known: {progress.knownIds.length}</Text>
        <Text style={styles.statsText}>Review Later: {progress.reviewLaterIds.length}</Text>
        <Text style={styles.statsText}>Last Exam Mistakes: {progress.mistakeIds.length}</Text>
        <Text style={styles.statsText}>{learnCheckpointInfo}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#fff',
    gap: 14,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#101010',
  },
  subtitle: {
    fontSize: 16,
    color: '#444',
    marginBottom: 8,
  },
  primaryButton: {
    backgroundColor: '#0b5fff',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  statsCard: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 14,
    gap: 4,
  },
  statsHeading: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  statsText: {
    color: '#222',
    fontSize: 15,
  },
});
