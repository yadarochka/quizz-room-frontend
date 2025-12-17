import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { exchangeYandexCode } from '../services/auth';

export function AuthCallbackPage() {
	const navigate = useNavigate();
	const { setAuth } = useAuth();

	useEffect(() => {
		const searchParams = new URLSearchParams(window.location.search);
		const token = searchParams.get('token');
		const code = searchParams.get('code');

		const handleAuth = async () => {
			try {
				if (token) {
					setAuth({
						token,
						user: {
							id: 'self',
							email: '',
							name: 'Пользователь',
						},
					});
					navigate('/home', { replace: true });
					return;
				}

				if (code) {
					const data = await exchangeYandexCode(code);
					setAuth(data);
					navigate('/home', { replace: true });
					return;
				}

				navigate('/login', { replace: true });
			} catch {
				navigate('/login', { replace: true });
			}
		};

		void handleAuth();
	}, [navigate, setAuth]);

	return (
		<main className="section section--center">
			<p className="section__subtitle">
				Завершаем авторизацию через Яндекс...
			</p>
		</main>
	);
}


