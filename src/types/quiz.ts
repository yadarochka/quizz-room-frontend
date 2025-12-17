export type AnswerOption = {
	id: number;
	text: string;
	isCorrect: boolean;
};

export type Question = {
	id: number;
	text: string;
	options: AnswerOption[];
};

export type Quiz = {
	title: string;
	questions: Question[];
};


