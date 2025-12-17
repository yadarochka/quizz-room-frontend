import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export function AuthCallbackPage() {
	const navigate = useNavigate();
	const { refreshUser } = useAuth();

	useEffect(() => {
		const handleAuth = async () => {
			try {
				await refreshUser();
				navigate('/home', { replace: true });
			} catch {
				navigate('/login', { replace: true });
			}
		};

		void handleAuth();
	}, [navigate, refreshUser]);

	return (
		<main className="section section--center">
			<p className="section__subtitle">
				Завершаем авторизацию через Яндекс...
			</p>
		</main>
	);
}


