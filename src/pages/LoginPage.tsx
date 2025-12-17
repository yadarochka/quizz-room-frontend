import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { getAuthRedirectUrl } from '../services/auth';

export function LoginPage() {
	const { isAuthenticated } = useAuth();

	if (isAuthenticated) {
		return <Navigate to="/home" replace />;
	}

	const handleYandexLogin = () => {
		const url = getAuthRedirectUrl();
		window.location.href = url;
	};

	return (
		<main className="auth-main">
			<section className="auth-card">
				<h1 className="auth-title">Войти в QuizzRoom</h1>
				<p className="auth-subtitle">
					Авторизуйтесь через Яндекс, чтобы управлять своими квизами.
				</p>
				<button
					type="button"
					className="primary-button auth-button"
					onClick={handleYandexLogin}
				>
					Войти через Яндекс
				</button>
			</section>
		</main>
	);
}


