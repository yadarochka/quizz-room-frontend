export type AnswerOption = {
	id: number;
	text: string;
	isCorrect: boolean;
};

export type Question = {
	id: number;
	text: string;
	timeLimit: number;
	options: AnswerOption[];
};

export type Quiz = {
	title: string;
	description?: string;
	questions: Question[];
};


