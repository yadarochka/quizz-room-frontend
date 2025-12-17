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


