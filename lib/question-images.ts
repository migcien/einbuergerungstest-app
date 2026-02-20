import { ImageSourcePropType } from 'react-native';

import { parseQuestionNumber } from '@/lib/question-bank';

const QUESTION_IMAGE_BY_NUMBER: Record<number, ImageSourcePropType> = {
  21: require('../images/21.png'),
  55: require('../images/55.png'),
  70: require('../images/70.png'),
  130: require('../images/130.png'),
  176: require('../images/176.png'),
  181: require('../images/181.png'),
  187: require('../images/187.png'),
  209: require('../images/209.png'),
  216: require('../images/216.png'),
  226: require('../images/226.png'),
  235: require('../images/235.png'),
  301: require('../images/301.png'),
  308: require('../images/308.png'),
};

export function getQuestionImageSource(questionId: string): ImageSourcePropType | null {
  const questionNumber = parseQuestionNumber(questionId);
  return QUESTION_IMAGE_BY_NUMBER[questionNumber] ?? null;
}
