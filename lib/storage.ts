import AsyncStorage from '@react-native-async-storage/async-storage';

import { DEFAULT_BUNDESLAND, BundeslandKey, isBundeslandKey } from '@/lib/bundesland';

const PROGRESS_KEY = 'einburg:progress';
const LATEST_EXAM_KEY = 'einburg:latestExam';
const LEARN_CHECKPOINT_KEY = 'einburg:learnCheckpoint';
const SELECTED_BUNDESLAND_KEY = 'einburg:selectedBundesland';

export type ProgressState = {
  knownIds: string[];
  reviewLaterIds: string[];
  mistakeIds: string[];
};

export type LatestExamResult = {
  timestamp: number;
  examCount: number;
  total: number;
  score: number;
  questionIds: string[];
  wrongIds: string[];
  selectedById: Record<string, number | null>;
  correctById: Record<string, number>;
  examMode?: string;
  passScore?: number;
  bundesland?: BundeslandKey;
};

export type LearnCheckpoint = {
  currentIndex: number;
  selectedById: Record<string, number>;
  answeredIds: string[];
  updatedAt: number;
};

export const DEFAULT_PROGRESS: ProgressState = {
  knownIds: [],
  reviewLaterIds: [],
  mistakeIds: [],
};

function normalizeStringArray(input: unknown): string[] {
  if (!Array.isArray(input)) {
    return [];
  }

  return [...new Set(input.filter((item): item is string => typeof item === 'string'))];
}

function normalizeProgress(value: unknown): ProgressState {
  if (!value || typeof value !== 'object') {
    return DEFAULT_PROGRESS;
  }

  const progress = value as Partial<ProgressState>;
  return {
    knownIds: normalizeStringArray(progress.knownIds),
    reviewLaterIds: normalizeStringArray(progress.reviewLaterIds),
    mistakeIds: normalizeStringArray(progress.mistakeIds),
  };
}

function normalizeSelectedById(value: unknown): Record<string, number> {
  if (!value || typeof value !== 'object') {
    return {};
  }

  const entries = Object.entries(value as Record<string, unknown>).filter(
    ([key, selected]) => typeof key === 'string' && Number.isInteger(selected),
  ) as Array<[string, number]>;

  return Object.fromEntries(entries);
}

export async function getProgress(): Promise<ProgressState> {
  try {
    const raw = await AsyncStorage.getItem(PROGRESS_KEY);
    if (!raw) {
      return DEFAULT_PROGRESS;
    }

    return normalizeProgress(JSON.parse(raw));
  } catch {
    return DEFAULT_PROGRESS;
  }
}

export async function saveProgress(progress: ProgressState): Promise<void> {
  await AsyncStorage.setItem(PROGRESS_KEY, JSON.stringify(normalizeProgress(progress)));
}

export async function getLatestExamResult(): Promise<LatestExamResult | null> {
  try {
    const raw = await AsyncStorage.getItem(LATEST_EXAM_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as LatestExamResult;
    if (!parsed || typeof parsed !== 'object') {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export async function saveLatestExamResult(result: LatestExamResult): Promise<void> {
  await AsyncStorage.setItem(LATEST_EXAM_KEY, JSON.stringify(result));
}

export async function getLearnCheckpoint(): Promise<LearnCheckpoint | null> {
  try {
    const raw = await AsyncStorage.getItem(LEARN_CHECKPOINT_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<LearnCheckpoint>;
    if (!parsed || typeof parsed !== 'object') {
      return null;
    }

    const selectedById = normalizeSelectedById(parsed.selectedById);
    const answeredIds = normalizeStringArray(parsed.answeredIds);
    const currentIndex =
      Number.isInteger(parsed.currentIndex) && (parsed.currentIndex as number) >= 0
        ? (parsed.currentIndex as number)
        : 0;

    return {
      currentIndex,
      selectedById,
      answeredIds,
      updatedAt:
        Number.isInteger(parsed.updatedAt) && (parsed.updatedAt as number) > 0
          ? (parsed.updatedAt as number)
          : Date.now(),
    };
  } catch {
    return null;
  }
}

export async function saveLearnCheckpoint(checkpoint: LearnCheckpoint): Promise<void> {
  const normalized: LearnCheckpoint = {
    currentIndex: Number.isInteger(checkpoint.currentIndex) ? Math.max(0, checkpoint.currentIndex) : 0,
    selectedById: normalizeSelectedById(checkpoint.selectedById),
    answeredIds: normalizeStringArray(checkpoint.answeredIds),
    updatedAt: Number.isInteger(checkpoint.updatedAt) ? checkpoint.updatedAt : Date.now(),
  };

  await AsyncStorage.setItem(LEARN_CHECKPOINT_KEY, JSON.stringify(normalized));
}

export async function clearLearnCheckpoint(): Promise<void> {
  await AsyncStorage.removeItem(LEARN_CHECKPOINT_KEY);
}

export async function getSelectedBundesland(): Promise<BundeslandKey> {
  try {
    const raw = await AsyncStorage.getItem(SELECTED_BUNDESLAND_KEY);
    return isBundeslandKey(raw) ? raw : DEFAULT_BUNDESLAND;
  } catch {
    return DEFAULT_BUNDESLAND;
  }
}

export async function saveSelectedBundesland(bundesland: BundeslandKey): Promise<void> {
  await AsyncStorage.setItem(SELECTED_BUNDESLAND_KEY, bundesland);
}
