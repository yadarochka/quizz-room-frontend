import { apiRequest } from './api';

export type CreateQuizAnswerPayload = {
	text: string;
	is_correct: boolean;
};

export type CreateQuizQuestionPayload = {
	text: string;
	time_limit: number;
	answers: CreateQuizAnswerPayload[];
};

export type CreateQuizPayload = {
	title: string;
	description?: string;
	questions: CreateQuizQuestionPayload[];
};

export type CreatedQuiz = {
	id: number;
	title: string;
	description: string | null;
	creator_id: number;
	created_at: string;
};

export type CreatedSession = {
	id: number;
	quiz_id: number;
	room_code: string;
	status: string;
	created_at: string;
};

export async function createQuiz(
	payload: CreateQuizPayload,
): Promise<CreatedQuiz> {
	return apiRequest<CreatedQuiz>('/api/quizzes', {
		method: 'POST',
		body: JSON.stringify(payload),
	});
}

export async function createSession(
	quizId: number,
): Promise<CreatedSession> {
	return apiRequest<CreatedSession>('/api/sessions', {
		method: 'POST',
		body: JSON.stringify({ quiz_id: quizId }),
	});
}

export type SessionParticipant = {
	user_id: number;
	display_name: string;
	joined_at: string;
};

export type SessionInfo = {
	id: number;
	quiz_id: number;
	room_code: string;
	status: string;
	participants: SessionParticipant[];
};

export async function getSession(
	sessionId: number,
): Promise<SessionInfo> {
	return apiRequest<SessionInfo>(`/api/sessions/${sessionId}`);
}

export type SessionInfoWithCreator = SessionInfo & {
	creator_id: number;
};

export async function getSessionByQuizId(
	quizId: number,
): Promise<SessionInfoWithCreator> {
	return apiRequest<SessionInfoWithCreator>(`/api/sessions/quiz/${quizId}`);
}

export type QuizListItem = {
	id: number;
	title: string;
	description: string | null;
	creator_id: number;
	created_at: string;
	updated_at: string;
};

export type QuizListResponse = {
	data: QuizListItem[];
	total: number;
	page: number;
	limit: number;
};

export async function getMyQuizzes(
	page: number = 1,
	limit: number = 10,
): Promise<QuizListResponse> {
	return apiRequest<QuizListResponse>(
		`/api/quizzes?page=${page}&limit=${limit}`,
	);
}

export type ParticipantAnswer = {
	question_id: number;
	question_text: string;
	question_order: number;
	selected_answer_id: number | null;
	selected_answer_text: string | null;
	correct_answer_text: string | null;
	is_correct: boolean;
};

export type SessionResultParticipant = {
	user_id: number;
	display_name: string;
	correct_answers: number;
	total_questions: number;
	score: number;
	answers?: ParticipantAnswer[];
};

export type QuestionAnswer = {
	id: number;
	text: string;
	is_correct: boolean;
};

export type QuestionDetail = {
	id: number;
	text: string;
	order: number;
	answers: QuestionAnswer[];
};

export type SessionResults = {
	session_id: number;
	quiz_title: string;
	total_questions: number;
	participants: SessionResultParticipant[];
	questions?: QuestionDetail[];
};

export async function getSessionResults(
	sessionId: number,
): Promise<SessionResults> {
	return apiRequest<SessionResults>(`/api/sessions/${sessionId}/results`);
}

export type AIProvider = 'groq';

export type GenerateQuestionsPayload = {
	topic: string;
	count?: number;
	provider?: AIProvider;
};

export type GeneratedQuestion = {
	text: string;
	time_limit: number;
	answers: Array<{
		text: string;
		is_correct: boolean;
	}>;
};

export type GenerateQuestionsResponse = {
	questions: GeneratedQuestion[];
};

export async function generateQuestions(
	payload: GenerateQuestionsPayload,
): Promise<GenerateQuestionsResponse> {
	return apiRequest<GenerateQuestionsResponse>('/api/quizzes/generate-questions', {
		method: 'POST',
		body: JSON.stringify(payload),
	});
}

export type CompletedQuiz = {
	session_id: number;
	quiz_id: number;
	quiz_title: string;
	creator_id: number;
	creator_name: string;
	creator_email: string | null;
	question_count: number;
	participant_count: number;
	created_at: string;
	ended_at: string;
};

export type CompletedQuizzesResponse = {
	data: CompletedQuiz[];
	total: number;
	page: number;
	limit: number;
};

export async function getCompletedQuizzes(
	page: number = 1,
	limit: number = 20,
): Promise<CompletedQuizzesResponse> {
	return apiRequest<CompletedQuizzesResponse>(
		`/api/quizzes/completed?page=${page}&limit=${limit}`,
		{
			method: 'GET',
		},
	);
}


