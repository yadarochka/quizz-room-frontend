import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader } from '../components/Loader';
import {
	getCompletedQuizzes,
	type CompletedQuiz,
} from '../services/quizzes';

export function CompletedQuizzesPage() {
	const navigate = useNavigate();
	const [quizzes, setQuizzes] = useState<CompletedQuiz[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [page, setPage] = useState(1);
	const [total, setTotal] = useState(0);
	const limit = 20;

	useEffect(() => {
		const loadQuizzes = async () => {
			try {
				setIsLoading(true);
				const result = await getCompletedQuizzes(page, limit);
				setQuizzes(result.data);
				setTotal(result.total);
			} catch (err) {
				const message =
					err instanceof Error
						? err.message
						: 'Не удалось загрузить проведенные квизы';
				setError(message);
			} finally {
				setIsLoading(false);
			}
		};

		void loadQuizzes();
	}, [page]);

	const handleViewResults = (sessionId: number) => {
		navigate(`/results/${sessionId}`);
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
			<h1 className="section__title">Проведенные квизы</h1>

			{error ? <p className="error-text">{error}</p> : null}

			{quizzes.length === 0 ? (
				<div className="section section--center">
					<p className="section__subtitle">
						Пока нет проведенных квизов.
					</p>
				</div>
			) : (
				<>
					<div className="quizzes-list">
						{quizzes.map((quiz) => (
							<div
								key={quiz.session_id}
								className="quiz-card"
								style={{
									border: '1px solid #ddd',
									borderRadius: '12px',
									padding: '1.5rem',
									marginBottom: '1rem',
									background: 'white',
									boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
									transition: 'transform 0.2s, box-shadow 0.2s',
									cursor: 'pointer',
								}}
								onClick={() => handleViewResults(quiz.session_id)}
								onMouseEnter={(e) => {
									e.currentTarget.style.transform = 'translateY(-2px)';
									e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
								}}
								onMouseLeave={(e) => {
									e.currentTarget.style.transform = 'translateY(0)';
									e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
								}}
							>
								<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
									<div style={{ flex: 1 }}>
										<h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1.5rem', color: '#111827' }}>
											{quiz.quiz_title}
										</h3>
										<div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '0.5rem' }}>
											<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
												<span style={{ fontSize: '1.2rem' }}>👤</span>
												<span style={{ color: '#6b7280', fontSize: '0.95rem' }}>
													Создатель: <strong>{quiz.creator_name}</strong>
												</span>
											</div>
											<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
												<span style={{ fontSize: '1.2rem' }}>❓</span>
												<span style={{ color: '#6b7280', fontSize: '0.95rem' }}>
													Вопросов: <strong>{quiz.question_count}</strong>
												</span>
											</div>
											<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
												<span style={{ fontSize: '1.2rem' }}>👥</span>
												<span style={{ color: '#6b7280', fontSize: '0.95rem' }}>
													Участников: <strong>{quiz.participant_count}</strong>
												</span>
											</div>
										</div>
										<div style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: '#9ca3af' }}>
											Завершен: {new Date(quiz.ended_at).toLocaleString('ru-RU')}
										</div>
									</div>
									<button
										type="button"
										className="primary-button"
										onClick={(e) => {
											e.stopPropagation();
											handleViewResults(quiz.session_id);
										}}
										style={{
											padding: '0.75rem 1.5rem',
											fontSize: '0.95rem',
											whiteSpace: 'nowrap',
										}}
									>
										Посмотреть результаты
									</button>
								</div>
							</div>
						))}
					</div>

					{total > limit && (
						<div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '2rem' }}>
							<button
								type="button"
								className="primary-button"
								onClick={() => setPage((p) => Math.max(1, p - 1))}
								disabled={page === 1}
								style={{
									padding: '0.75rem 1.5rem',
									opacity: page === 1 ? 0.5 : 1,
									cursor: page === 1 ? 'not-allowed' : 'pointer',
								}}
							>
								Назад
							</button>
							<span style={{ display: 'flex', alignItems: 'center', padding: '0.75rem 1rem' }}>
								Страница {page} из {Math.ceil(total / limit)}
							</span>
							<button
								type="button"
								className="primary-button"
								onClick={() => setPage((p) => p + 1)}
								disabled={page >= Math.ceil(total / limit)}
								style={{
									padding: '0.75rem 1.5rem',
									opacity: page >= Math.ceil(total / limit) ? 0.5 : 1,
									cursor: page >= Math.ceil(total / limit) ? 'not-allowed' : 'pointer',
								}}
							>
								Вперед
							</button>
						</div>
					)}
				</>
			)}
		</main>
	);
}



