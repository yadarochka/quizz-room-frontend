const DEFAULT_API_URL = 'https://quizz-room-server.onrender.com';

export const API_URL =
	// eslint-disable-next-line no-process-env
	import.meta.env.VITE_API_URL ?? DEFAULT_API_URL;

export async function apiRequest<TResponse>(
	path: string,
	options: RequestInit = {},
): Promise<TResponse> {
	const url = `${API_URL}${path}`;

	const response = await fetch(url, {
		credentials: 'include',
		headers: {
			'Content-Type': 'application/json',
			...(options.headers ?? {}),
		},
		...options,
	});

	if (!response.ok) {
		const text = await response.text();
		throw new Error(text || `Request failed with status ${response.status}`);
	}

	if (response.status === 204) {
		return undefined as TResponse;
	}

	return (await response.json()) as TResponse;
}



