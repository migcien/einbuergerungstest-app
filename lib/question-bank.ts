import rawQuestions from '@/data/einbuergerungstest_310_nrw.json';
import { Question } from '@/types/question';

export const QUESTION_BANK: Question[] = rawQuestions as Question[];

export const QUESTION_COUNT = QUESTION_BANK.length;

export const GENERAL_QUESTION_COUNT = 300;

function shuffleQuestions(questions: Question[]): Question[] {
  const copy = [...questions];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function parseQuestionNumber(questionId: string): number {
  const match = questionId.match(/\d+/);
  return match ? Number(match[0]) : 0;
}

export const GENERAL_QUESTIONS = QUESTION_BANK.filter(
  (question) => parseQuestionNumber(question.id) <= GENERAL_QUESTION_COUNT,
);

export const STATE_QUESTIONS = QUESTION_BANK.filter(
  (question) => parseQuestionNumber(question.id) > GENERAL_QUESTION_COUNT,
);

export function pickRandomQuestions(questions: Question[], takeCount: number): Question[] {
  return shuffleQuestions(questions).slice(0, Math.min(takeCount, questions.length));
}

export function buildStandardExamQuestions(): Question[] {
  const generalPick = pickRandomQuestions(GENERAL_QUESTIONS, 30);
  const statePick = pickRandomQuestions(STATE_QUESTIONS, 3);
  return shuffleQuestions([...generalPick, ...statePick]);
}
