import { apiRequest, API_URL } from './api';

export type AuthUser = {
	id: string;
	email: string | null;
	name: string;
	avatarUrl?: string | null;
};

export type AuthResponse = {
	token: string;
	user: AuthUser;
};

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

export async function fetchCurrentUser(): Promise<AuthUser> {
	const user = await apiRequest<{
		id: number | string;
		email: string | null;
		name: string;
		avatar_url?: string | null;
		avatarUrl?: string | null;
	}>('/auth/me');

	return {
		id: String(user.id),
		email: user.email,
		name: user.name,
		avatarUrl: user.avatarUrl ?? user.avatar_url ?? null,
	};
}

export async function logoutRequest(): Promise<void> {
	await apiRequest('/auth/logout', { method: 'GET' });
}



