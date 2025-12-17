import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import confetti from 'canvas-confetti';
import {
	BarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	Legend,
	ResponsiveContainer,
	PieChart,
	Pie,
	Cell,
} from 'recharts';
import { useAuth } from '../auth/AuthContext';
import {
	getSessionResults,
	type SessionResults,
} from '../services/quizzes';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export function QuizResultsPage() {
	const { sessionId } = useParams<{ sessionId: string }>();
	const navigate = useNavigate();
	const { user, isAuthenticated } = useAuth();
	const [results, setResults] = useState<SessionResults | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [expandedParticipant, setExpandedParticipant] = useState<number | null>(null);

	useEffect(() => {
		if (!isAuthenticated) {
			navigate('/login', { replace: true });
			return;
		}

		if (!sessionId) {
			navigate('/home', { replace: true });
			return;
		}

		const loadResults = async () => {
			try {
				const data = await getSessionResults(Number(sessionId));
				setResults(data);
				// Запускаем салют
				triggerConfetti();
			} catch (err) {
				const message =
					err instanceof Error
						? err.message
						: 'Не удалось загрузить результаты';
				setError(message);
			} finally {
				setIsLoading(false);
			}
		};

		void loadResults();
	}, [sessionId, isAuthenticated, navigate]);

	const triggerConfetti = () => {
		const duration = 3000;
		const animationEnd = Date.now() + duration;
		const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

		function randomInRange(min: number, max: number) {
			return Math.random() * (max - min) + min;
		}

		const interval = setInterval(() => {
			const timeLeft = animationEnd - Date.now();

			if (timeLeft <= 0) {
				return clearInterval(interval);
			}

			const particleCount = 50 * (timeLeft / duration);

			confetti({
				...defaults,
				particleCount,
				origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
			});
			confetti({
				...defaults,
				particleCount,
				origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
			});
		}, 250);
	};

	if (!isAuthenticated || isLoading) {
		return (
			<main className="section section--center" style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
				<div style={{ color: 'white', fontSize: '1.5rem' }}>Загрузка результатов...</div>
			</main>
		);
	}

	if (error || !results) {
		return (
			<main className="section section--center" style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
				<div style={{
					background: 'white',
					padding: '3rem',
					borderRadius: '16px',
					textAlign: 'center',
					boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
				}}>
					<p className="error-text" style={{ fontSize: '1.2rem', marginBottom: '2rem' }}>
						{error || 'Результаты не найдены'}
					</p>
					<button
						type="button"
						className="primary-button"
						onClick={() => navigate('/home')}
						style={{
							padding: '1rem 2rem',
							fontSize: '1.1rem',
						}}
					>
						Вернуться на главную
					</button>
				</div>
			</main>
		);
	}

	// Сортируем участников по результатам (от лучшего к худшему)
	const sortedParticipants = [...results.participants].sort(
		(a, b) => b.score - a.score,
	);

	// Данные для графика баллов
	const barChartData = sortedParticipants.map((p) => ({
		name: p.display_name.length > 15 ? p.display_name.substring(0, 15) + '...' : p.display_name,
		score: Math.round(p.score),
		correct: p.correct_answers,
		total: p.total_questions,
	}));

	// Данные для круговой диаграммы распределения
	const scoreRanges = [
		{ name: '90-100%', count: 0 },
		{ name: '70-89%', count: 0 },
		{ name: '50-69%', count: 0 },
		{ name: '0-49%', count: 0 },
	];

	results.participants.forEach((p) => {
		const score = Math.round(p.score);
		if (score >= 90) scoreRanges[0].count++;
		else if (score >= 70) scoreRanges[1].count++;
		else if (score >= 50) scoreRanges[2].count++;
		else scoreRanges[3].count++;
	});

	const pieChartData = scoreRanges.filter((range) => range.count > 0);

	const currentUserResult = results.participants.find(
		(p) => p.user_id === Number(user?.id ?? 0),
	);

	const toggleParticipantDetails = (userId: number) => {
		setExpandedParticipant(expandedParticipant === userId ? null : userId);
	};

	return (
		<main style={{ 
			minHeight: '100vh', 
			background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
			padding: '2rem 1rem',
		}}>
			<div style={{ maxWidth: '1200px', margin: '0 auto' }}>
				{/* Заголовок */}
				<div style={{
					textAlign: 'center',
					marginBottom: '3rem',
					color: 'white',
				}}>
					<div style={{ fontSize: '5rem', marginBottom: '1rem' }}>🎉</div>
					<h1 style={{
						margin: '0 0 0.5rem 0',
						fontSize: '3rem',
						fontWeight: 'bold',
					}}>
						Квиз завершен!
					</h1>
					<h2 style={{
						margin: '0 0 1rem 0',
						fontSize: '1.8rem',
						opacity: 0.95,
					}}>
						{results.quiz_title}
					</h2>
					<p style={{
						margin: 0,
						fontSize: '1.2rem',
						opacity: 0.9,
					}}>
						Всего вопросов: <strong>{results.total_questions}</strong>
					</p>
				</div>

				{/* Результат текущего пользователя */}
				{currentUserResult && (
					<div style={{
						background: 'white',
						borderRadius: '20px',
						padding: '2.5rem',
						marginBottom: '3rem',
						boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
						textAlign: 'center',
					}}>
						<h3 style={{
							margin: '0 0 1.5rem 0',
							fontSize: '1.8rem',
							color: '#333',
							fontWeight: 'bold',
						}}>
							Ваш результат
						</h3>
						<div style={{
							fontSize: '5rem',
							fontWeight: 'bold',
							background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
							WebkitBackgroundClip: 'text',
							WebkitTextFillColor: 'transparent',
							marginBottom: '1rem',
						}}>
							{Math.round(currentUserResult.score)}%
						</div>
						<p style={{
							margin: 0,
							fontSize: '1.3rem',
							color: '#666',
						}}>
							Правильных ответов: <strong style={{ color: '#667eea' }}>{currentUserResult.correct_answers}</strong> из{' '}
							<strong>{currentUserResult.total_questions}</strong>
						</p>
					</div>
				)}

				{/* Графики */}
				<div style={{
					background: 'white',
					borderRadius: '20px',
					padding: '2.5rem',
					marginBottom: '3rem',
					boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
				}}>
					<h2 style={{
						margin: '0 0 2rem 0',
						fontSize: '2rem',
						color: '#333',
						fontWeight: 'bold',
					}}>
						Результаты участников
					</h2>
					<ResponsiveContainer width="100%" height={400}>
						<BarChart data={barChartData}>
							<CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
							<XAxis dataKey="name" stroke="#666" />
							<YAxis domain={[0, 100]} stroke="#666" />
							<Tooltip
								formatter={(value: number | undefined, name: string | undefined) => {
									if (value === undefined || name === undefined) return ['', ''];
									if (name === 'score') return [`${value}%`, 'Баллы'];
									if (name === 'correct') {
										const dataPoint = barChartData.find((d) => d.correct === value);
										return [
											`${value} из ${dataPoint?.total || 0}`,
											'Правильных',
										];
									}
									return [String(value), name];
								}}
								contentStyle={{
									background: 'white',
									border: '1px solid #ddd',
									borderRadius: '8px',
								}}
							/>
							<Legend />
							<Bar dataKey="score" fill="#667eea" name="Баллы (%)" radius={[8, 8, 0, 0]} />
						</BarChart>
					</ResponsiveContainer>
				</div>

				{pieChartData.length > 0 && (
					<div style={{
						background: 'white',
						borderRadius: '20px',
						padding: '2.5rem',
						marginBottom: '3rem',
						boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
					}}>
						<h2 style={{
							margin: '0 0 2rem 0',
							fontSize: '2rem',
							color: '#333',
							fontWeight: 'bold',
						}}>
							Распределение результатов
						</h2>
						<ResponsiveContainer width="100%" height={300}>
							<PieChart>
								<Pie
									data={pieChartData}
									cx="50%"
									cy="50%"
									labelLine={false}
									label={({ name, percent }) =>
										`${name}: ${((percent ?? 0) * 100).toFixed(0)}%`
									}
									outerRadius={100}
									fill="#8884d8"
									dataKey="count"
								>
									{pieChartData.map((_, index) => (
										<Cell
											key={`cell-${index}`}
											fill={COLORS[index % COLORS.length]}
										/>
									))}
								</Pie>
								<Tooltip />
							</PieChart>
						</ResponsiveContainer>
					</div>
				)}

				{/* Таблица результатов с деталями */}
				<div style={{
					background: 'white',
					borderRadius: '20px',
					padding: '2.5rem',
					marginBottom: '3rem',
					boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
				}}>
					<h2 style={{
						margin: '0 0 2rem 0',
						fontSize: '2rem',
						color: '#333',
						fontWeight: 'bold',
					}}>
						Детальные результаты
					</h2>
					<div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
						{sortedParticipants.map((participant, index) => {
							const isCurrentUser = participant.user_id === Number(user?.id ?? 0);
							const isExpanded = expandedParticipant === participant.user_id;
							const participantAnswers = participant.answers || [];

							return (
								<div
									key={participant.user_id}
									style={{
										border: `2px solid ${isCurrentUser ? '#667eea' : '#e0e0e0'}`,
										borderRadius: '16px',
										overflow: 'hidden',
										background: isCurrentUser ? '#f8f9ff' : 'white',
										transition: 'all 0.3s ease',
									}}
								>
									{/* Заголовок участника */}
									<div
										style={{
											padding: '1.5rem',
											background: isCurrentUser
												? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
												: '#f5f5f5',
											color: isCurrentUser ? 'white' : '#333',
											cursor: 'pointer',
											display: 'flex',
											justifyContent: 'space-between',
											alignItems: 'center',
										}}
										onClick={() => toggleParticipantDetails(participant.user_id)}
									>
										<div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
											<span style={{ fontSize: '2rem' }}>
												{index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
											</span>
											<div>
												<div style={{ fontSize: '1.3rem', fontWeight: 'bold' }}>
													{participant.display_name}
													{isCurrentUser && (
														<span style={{ marginLeft: '0.5rem', opacity: 0.9 }}>
															(Вы)
														</span>
													)}
												</div>
												<div style={{ fontSize: '0.9rem', opacity: 0.9, marginTop: '0.25rem' }}>
													{participant.correct_answers} / {participant.total_questions} правильных • {Math.round(participant.score)}%
												</div>
											</div>
										</div>
										<div style={{
											fontSize: '1.5rem',
											transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
											transition: 'transform 0.3s ease',
										}}>
											▼
										</div>
									</div>

									{/* Детали ответов */}
									{isExpanded && participantAnswers.length > 0 && (
										<div style={{ padding: '1.5rem' }}>
											<div style={{
												display: 'grid',
												gap: '1.5rem',
											}}>
												{participantAnswers
													.sort((a, b) => a.question_order - b.question_order)
													.map((answer) => (
														<div
															key={answer.question_id}
															style={{
																padding: '1.5rem',
																borderRadius: '12px',
																background: answer.is_correct ? '#d1fae5' : '#fee2e2',
																border: `2px solid ${answer.is_correct ? '#10b981' : '#ef4444'}`,
															}}
														>
															<div style={{
																display: 'flex',
																alignItems: 'center',
																gap: '0.75rem',
																marginBottom: '1rem',
															}}>
																<span style={{
																	fontSize: '1.5rem',
																}}>
																	{answer.is_correct ? '✅' : '❌'}
																</span>
																<h4 style={{
																	margin: 0,
																	fontSize: '1.1rem',
																	fontWeight: 'bold',
																	color: '#333',
																}}>
																	Вопрос {answer.question_order}
																</h4>
															</div>
															<p style={{
																margin: '0 0 1rem 0',
																fontSize: '1rem',
																color: '#555',
																lineHeight: '1.6',
															}}>
																{answer.question_text}
															</p>
															<div style={{
																display: 'flex',
																flexDirection: 'column',
																gap: '0.75rem',
															}}>
																<div>
																	<span style={{
																		fontSize: '0.9rem',
																		color: '#666',
																		fontWeight: '500',
																	}}>
																		Ваш ответ:
																	</span>
																	<div style={{
																		marginTop: '0.5rem',
																		padding: '0.75rem 1rem',
																		background: 'white',
																		borderRadius: '8px',
																		border: `2px solid ${answer.is_correct ? '#10b981' : '#ef4444'}`,
																		color: answer.is_correct ? '#065f46' : '#991b1b',
																		fontWeight: '500',
																	}}>
																		{answer.selected_answer_text || 'Не ответил'}
																	</div>
																</div>
																{!answer.is_correct && answer.correct_answer_text && (
																	<div>
																		<span style={{
																			fontSize: '0.9rem',
																			color: '#666',
																			fontWeight: '500',
																		}}>
																			Правильный ответ:
																		</span>
																		<div style={{
																			marginTop: '0.5rem',
																			padding: '0.75rem 1rem',
																			background: '#d1fae5',
																			borderRadius: '8px',
																			border: '2px solid #10b981',
																			color: '#065f46',
																			fontWeight: '500',
																		}}>
																			{answer.correct_answer_text}
																		</div>
																	</div>
																)}
															</div>
														</div>
													))}
											</div>
										</div>
									)}
								</div>
							);
						})}
					</div>
				</div>

				{/* Кнопки навигации */}
				<div style={{
					textAlign: 'center',
					marginBottom: '2rem',
				}}>
					<button
						type="button"
						className="primary-button"
						onClick={() => navigate('/home')}
						style={{
							padding: '1rem 2.5rem',
							fontSize: '1.2rem',
							marginRight: '1rem',
							background: 'white',
							color: '#667eea',
							border: '2px solid white',
							borderRadius: '12px',
							fontWeight: 'bold',
							cursor: 'pointer',
							boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
						}}
					>
						Мои квизы
					</button>
					<button
						type="button"
						className="secondary-button"
						onClick={() => navigate('/')}
						style={{
							padding: '1rem 2.5rem',
							fontSize: '1.2rem',
							background: 'rgba(255, 255, 255, 0.2)',
							color: 'white',
							border: '2px solid white',
							borderRadius: '12px',
							fontWeight: 'bold',
							cursor: 'pointer',
						}}
					>
						На главную
					</button>
				</div>
			</div>
		</main>
	);
}
