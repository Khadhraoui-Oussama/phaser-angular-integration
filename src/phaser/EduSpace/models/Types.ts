export interface EduSpaceWrongAttempt {
    orderOfAppearance: number;
    questionData: QuestionData;
    attemptedAnswer: string; // The answer content that was selected (text or image URL)
}

export interface EduSpaceAttempt {
    orderOfAppearance: number;
    questionData: QuestionData;
    attemptedAnswer: string; // (text or image URL)
    isCorrect: boolean;
    pointsEarned: number;
}

// New interfaces for the comprehensive question system
export interface LevelData {
    levelId: number;
    levelName: string;
    difficulty: number; // 1-5 scale where 1 is easiest, 5 is hardest
    questions: QuestionData[];
}

export interface QuestionsJsonData {
    levels: LevelData[];
}

export interface QuestionData {
    id: number;
    media: {
        text: string ;
        audio: string | null;
        image: string | null;
    };
    answers: AnswerOption[];
    points: number;
    langue: string;
    difficultyLevel: number;
}

export interface AnswerOption {
    type: 'text' | 'image';
    value: string;
    correct: boolean;
    url: string | null;
}
