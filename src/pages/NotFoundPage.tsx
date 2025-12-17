import { useNavigate } from 'react-router-dom';

export function NotFoundPage() {
	const navigate = useNavigate();

	return (
		<main className="section section--center">
			<h1 className="section__title">Страница не найдена</h1>
			<p className="section__subtitle">
				Возможно, ссылка устарела или была введена с ошибкой.
			</p>
			<button
				type="button"
				className="primary-button"
				onClick={() => navigate('/')}
			>
				На главную
			</button>
		</main>
	);
}

