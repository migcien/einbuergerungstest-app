import rawQuestionsNw from '@/data/einbuergerungstest_310_nrw.json';
import { DEFAULT_BUNDESLAND, BundeslandKey } from '@/lib/bundesland';
import { Question } from '@/types/question';

const QUESTION_CATALOG_BY_STATE: Record<BundeslandKey, Question[]> = {
  nw: rawQuestionsNw as Question[],
};

export function getQuestionBank(bundesland: BundeslandKey = DEFAULT_BUNDESLAND): Question[] {
  return QUESTION_CATALOG_BY_STATE[bundesland] ?? QUESTION_CATALOG_BY_STATE[DEFAULT_BUNDESLAND];
}

export function getQuestionCount(bundesland: BundeslandKey = DEFAULT_BUNDESLAND): number {
  return getQuestionBank(bundesland).length;
}

export const QUESTION_BANK: Question[] = getQuestionBank(DEFAULT_BUNDESLAND);

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

function getGeneralQuestions(questions: Question[]): Question[] {
  return questions.filter((question) => parseQuestionNumber(question.id) <= GENERAL_QUESTION_COUNT);
}

function getStateQuestions(questions: Question[]): Question[] {
  return questions.filter((question) => parseQuestionNumber(question.id) > GENERAL_QUESTION_COUNT);
}

export function pickRandomQuestions(questions: Question[], takeCount: number): Question[] {
  return shuffleQuestions(questions).slice(0, Math.min(takeCount, questions.length));
}

export function buildStandardExamQuestions(questions: Question[]): Question[] {
  const generalPick = pickRandomQuestions(getGeneralQuestions(questions), 30);
  const statePick = pickRandomQuestions(getStateQuestions(questions), 3);
  return shuffleQuestions([...generalPick, ...statePick]);
}
