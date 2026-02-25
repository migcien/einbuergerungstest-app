import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BUNDESLAENDER, BundeslandKey } from '@/lib/bundesland';
import { getQuestionCount } from '@/lib/question-bank';
import {
  DEFAULT_PROGRESS,
  ProgressState,
  getLearnCheckpoint,
  getProgress,
  getSelectedBundesland,
  saveSelectedBundesland,
} from '@/lib/storage';

export default function HomeScreen() {
  const router = useRouter();
  const [progress, setProgress] = useState<ProgressState>(DEFAULT_PROGRESS);
  const [learnCheckpointInfo, setLearnCheckpointInfo] = useState('No saved Learn checkpoint.');
  const [selectedBundesland, setSelectedBundesland] = useState<BundeslandKey>('nw');
  const [infoVisible, setInfoVisible] = useState(false);

  const loadProgress = useCallback(async () => {
    const [nextProgress, checkpoint, savedBundesland] = await Promise.all([
      getProgress(),
      getLearnCheckpoint(),
      getSelectedBundesland(),
    ]);

    setProgress(nextProgress);
    setSelectedBundesland(savedBundesland);

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

  const onSelectBundesland = async (bundesland: BundeslandKey) => {
    setSelectedBundesland(bundesland);
    await saveSelectedBundesland(bundesland);
  };

  const onOpenProfile = async () => {
    await Linking.openURL('https://github.com/migcien');
  };

  const questionCount = useMemo(() => getQuestionCount(selectedBundesland), [selectedBundesland]);

  return (
    <View style={styles.screen}>
      <Pressable style={styles.infoButton} onPress={() => setInfoVisible(true)}>
        <Text style={styles.infoButtonText}>i</Text>
      </Pressable>

      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.sectionTitle}>Question Catalog for Test Preparation</Text>
        <Text style={styles.welcome}>Welcome</Text>
        <Text style={styles.subtitle}>
          This app provides the complete question catalog for preparing for the German naturalization
          test. The catalog currently includes 310 questions: 300 general questions and 10
          Bundesland-specific questions.
        </Text>
        <Text style={styles.subtitle}>Select your Bundesland first:</Text>

        <View style={styles.stateList}>
          {BUNDESLAENDER.map((bundesland) => {
            const selected = bundesland.key === selectedBundesland;
            return (
              <Pressable
                key={bundesland.key}
                style={[styles.stateButton, selected && styles.stateButtonSelected]}
                onPress={() => onSelectBundesland(bundesland.key)}>
                <Text style={[styles.stateButtonText, selected && styles.stateButtonTextSelected]}>
                  {bundesland.label} ({bundesland.shortLabel})
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          style={styles.primaryButton}
          onPress={() =>
            router.push({
              pathname: '/learn',
              params: { bundesland: selectedBundesland },
            })
          }>
          <Text style={styles.primaryButtonText}>Learn</Text>
        </Pressable>

        <Pressable
          style={styles.primaryButton}
          onPress={() =>
            router.push({
              pathname: '/exam',
              params: { bundesland: selectedBundesland },
            })
          }>
          <Text style={styles.primaryButtonText}>Exam</Text>
        </Pressable>

        <View style={styles.statsCard}>
          <Text style={styles.statsHeading}>Progress</Text>
          <Text style={styles.statsText}>Questions: {questionCount}</Text>
          <Text style={styles.statsText}>Known: {progress.knownIds.length}</Text>
          <Text style={styles.statsText}>Review Later: {progress.reviewLaterIds.length}</Text>
          <Text style={styles.statsText}>Last Exam Mistakes: {progress.mistakeIds.length}</Text>
          <Text style={styles.statsText}>{learnCheckpointInfo}</Text>
        </View>
      </ScrollView>

      <Modal
        transparent
        animationType="fade"
        visible={infoVisible}
        onRequestClose={() => setInfoVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Info</Text>
            <Text style={styles.modalText}>If you find any errors, please report it at:</Text>
            <Pressable onPress={() => void onOpenProfile()}>
              <Text style={styles.modalLink}>https://github.com/migcien</Text>
            </Pressable>
            <Pressable style={styles.modalCloseButton} onPress={() => setInfoVisible(false)}>
              <Text style={styles.modalCloseButtonText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    paddingTop: 64,
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 14,
  },
  infoButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 10,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#efefef',
    borderWidth: 1,
    borderColor: '#d5d5d5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoButtonText: {
    fontSize: 17,
    color: '#222',
    fontWeight: '700',
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: '#101010',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#101010',
  },
  welcome: {
    fontSize: 18,
    fontWeight: '700',
    color: '#101010',
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: '#2b2b2b',
  },
  stateList: {
    gap: 8,
    marginBottom: 6,
  },
  stateButton: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: '#fff',
  },
  stateButtonSelected: {
    borderColor: '#0b5fff',
    backgroundColor: '#eef4ff',
  },
  stateButtonText: {
    fontSize: 16,
    color: '#222',
    fontWeight: '600',
  },
  stateButtonTextSelected: {
    color: '#0b5fff',
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    borderRadius: 14,
    backgroundColor: '#fff',
    padding: 18,
    gap: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111',
  },
  modalText: {
    color: '#222',
    fontSize: 15,
  },
  modalLink: {
    color: '#0b5fff',
    fontSize: 15,
    textDecorationLine: 'underline',
  },
  modalCloseButton: {
    marginTop: 6,
    borderRadius: 10,
    backgroundColor: '#0b5fff',
    paddingVertical: 10,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
});


