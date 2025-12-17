import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import {
	getMyQuizzes,
	getSessionByQuizId,
	type QuizListItem,
	type SessionInfoWithCreator,
} from '../services/quizzes';

export function ActiveQuizzesPage() {
	const navigate = useNavigate();
	const { user } = useAuth();
	const [quizzes, setQuizzes] = useState<QuizListItem[]>([]);
	const [activeSessions, setActiveSessions] = useState<
		Map<number, SessionInfoWithCreator>
	>(new Map());
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const loadQuizzes = async () => {
			try {
				const result = await getMyQuizzes(1, 50);
				setQuizzes(result.data);

				// Проверяем активные сессии для каждого квиза
				const sessionsMap = new Map<number, SessionInfoWithCreator>();
				for (const quiz of result.data) {
					try {
						const session = await getSessionByQuizId(quiz.id);
						if (
							session &&
							(session.status === 'waiting' ||
								session.status === 'in_progress')
						) {
							sessionsMap.set(quiz.id, session);
						}
					} catch {
						// Игнорируем ошибки для квизов без активных сессий
					}
				}
				setActiveSessions(sessionsMap);
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

	const handleJoinSession = (quizId: number) => {
		navigate(`/quizzes/${quizId}`);
	};

	if (isLoading) {
		return (
			<main className="section section--center">
				<p>Загрузка...</p>
			</main>
		);
	}

	const activeQuizzes = quizzes.filter((quiz) =>
		activeSessions.has(quiz.id),
	);

	return (
		<main className="section">
			<h1 className="section__title">Активные квизы</h1>

			{error ? <p className="error-text">{error}</p> : null}

			{activeQuizzes.length === 0 ? (
				<div className="section section--center">
					<p className="section__subtitle">
						У вас нет активных квизов.
					</p>
					<button
						type="button"
						className="primary-button"
						onClick={() => navigate('/home')}
					>
						Перейти к моим квизам
					</button>
				</div>
			) : (
				<div className="quizzes-list">
					{activeQuizzes.map((quiz) => {
						const session = activeSessions.get(quiz.id);
						return (
							<div
								key={quiz.id}
								className="quiz-card"
								style={{
									border: '1px solid #ddd',
									borderRadius: '8px',
									padding: '1.5rem',
									marginBottom: '1rem',
									display: 'flex',
									justifyContent: 'space-between',
									alignItems: 'center',
								}}
							>
								<div style={{ flex: 1 }}>
									<h3 style={{ margin: '0 0 0.5rem 0' }}>
										{quiz.title}
									</h3>
									{quiz.description ? (
										<p
											style={{
												margin: '0 0 0.5rem 0',
												color: '#666',
											}}
										>
											{quiz.description}
										</p>
									) : null}
									{session ? (
										<div style={{ marginTop: '0.5rem' }}>
											<p
												style={{
													margin: '0 0 0.25rem 0',
													fontSize: '0.9rem',
													color: '#666',
												}}
											>
												Статус:{' '}
												{session.status === 'waiting'
													? 'Ожидание участников'
													: 'В процессе'}
											</p>
											<p
												style={{
													margin: 0,
													fontSize: '0.9rem',
													color: '#666',
												}}
											>
												Участников: {session.participants.length} | Код
												комнаты: {session.room_code}
											</p>
										</div>
									) : null}
								</div>
								<button
									type="button"
									className="primary-button"
									onClick={() => handleJoinSession(quiz.id)}
									style={{ marginLeft: '1rem' }}
								>
									Открыть
								</button>
							</div>
						);
					})}
				</div>
			)}
		</main>
	);
}

