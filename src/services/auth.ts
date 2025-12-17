import { apiRequest, API_URL } from './api';

export type AuthUser = {
	id: string;
	email: string;
	name: string;
	avatarUrl?: string;
};

export type AuthResponse = {
	token: string;
	user: AuthUser;
};

export const LOCAL_STORAGE_TOKEN_KEY = 'quizz-room-token';

export function getAuthRedirectUrl(): string {
	const redirectUri = `${window.location.origin}/auth/yandex/callback`;
	const url = new URL('/auth/yandex', API_URL);
	url.searchParams.set('redirect_uri', redirectUri);
	return url.toString();
}

export async function exchangeYandexCode(code: string): Promise<AuthResponse> {
	return apiRequest<AuthResponse>('/auth/yandex/callback', {
		method: 'POST',
		body: JSON.stringify({ code }),
	});
}



