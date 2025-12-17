import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader } from '../components/Loader';
import {
	createSession,
	getMyQuizzes,
	getSessionByQuizId,
	type QuizListItem,
} from '../services/quizzes';

export function HomePage() {
	const navigate = useNavigate();
	const [quizzes, setQuizzes] = useState<QuizListItem[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [startingQuizId, setStartingQuizId] = useState<number | null>(null);

	useEffect(() => {
		const loadQuizzes = async () => {
			try {
				const result = await getMyQuizzes(1, 50);
				setQuizzes(result.data);
			} catch (err) {
				const message =
					err instanceof Error
						? err.message
						: 'Не удалось загрузить квизы';
				setError(message);
			} finally {
				setIsLoading(false);
			}
		};

		void loadQuizzes();
	}, []);

	const handleStartQuiz = async (quizId: number) => {
		setStartingQuizId(quizId);
		setError(null);

		try {
			// Проверяем, есть ли уже активная сессия для этого квиза
			try {
				const existingSession = await getSessionByQuizId(quizId);
				// Если есть активная сессия, переходим в неё
				if (existingSession && (existingSession.status === 'waiting' || existingSession.status === 'in_progress')) {
					navigate(`/quizzes/${quizId}`);
					return;
				}
			} catch {
				// Если активной сессии нет, создаём новую
			}

			// Создаем новую сессию для квиза
			await createSession(quizId);
			// Переходим в комнату
			navigate(`/quizzes/${quizId}`);
		} catch (err) {
			const message =
				err instanceof Error
					? err.message
					: 'Не удалось запустить квиз';
			setError(message);
			setStartingQuizId(null);
		}
	};

	if (isLoading) {
		return (
			<main className="section section--center">
				<Loader size="large" />
			</main>
		);
	}

	return (
		<main className="section">
			<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
				<h1 className="section__title">Мои квизы</h1>
				<button
					type="button"
					className="primary-button"
					onClick={() => navigate('/quizzes/create')}
				>
					+ Создать квиз
				</button>
			</div>

			{error ? <p className="error-text">{error}</p> : null}

			{quizzes.length === 0 ? (
				<div className="section section--center">
					<p className="section__subtitle">
						У вас пока нет созданных квизов.
					</p>
					<button
						type="button"
						className="primary-button"
						onClick={() => navigate('/quizzes/create')}
					>
						Создать первый квиз
					</button>
				</div>
			) : (
				<div className="quizzes-list">
					{quizzes.map((quiz) => (
						<div key={quiz.id} className="quiz-card" style={{
							border: '1px solid #ddd',
							borderRadius: '8px',
							padding: '1.5rem',
							marginBottom: '1rem',
							display: 'flex',
							justifyContent: 'space-between',
							alignItems: 'center',
						}}>
							<div style={{ flex: 1 }}>
								<h3 style={{ margin: '0 0 0.5rem 0' }}>{quiz.title}</h3>
								{quiz.description ? (
									<p style={{ margin: '0 0 0.5rem 0', color: '#666' }}>
										{quiz.description}
									</p>
								) : null}
								<p style={{ margin: 0, fontSize: '0.9rem', color: '#999' }}>
									Создан: {new Date(quiz.created_at).toLocaleDateString('ru-RU')}
								</p>
							</div>
							<button
								type="button"
								className="primary-button"
								onClick={() => handleStartQuiz(quiz.id)}
								disabled={startingQuizId === quiz.id}
								style={{ marginLeft: '1rem' }}
							>
								{startingQuizId === quiz.id ? 'Запускаем...' : 'Запустить'}
							</button>
						</div>
					))}
				</div>
			)}
		</main>
	);
}


