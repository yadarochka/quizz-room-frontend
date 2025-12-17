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
			<main className="section section--center">
				<p>Загрузка результатов...</p>
			</main>
		);
	}

	if (error || !results) {
		return (
			<main className="section section--center">
				<p className="error-text">{error || 'Результаты не найдены'}</p>
				<button
					type="button"
					className="primary-button"
					onClick={() => navigate('/home')}
				>
					Вернуться на главную
				</button>
			</main>
		);
	}

	// Сортируем участников по результатам (от лучшего к худшему)
	const sortedParticipants = [...results.participants].sort(
		(a, b) => b.score - a.score,
	);

	// Данные для графика баллов
	const barChartData = sortedParticipants.map((p) => ({
		name: p.display_name,
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

	return (
		<main className="section">
			<div className="section--center" style={{ marginBottom: '3rem' }}>
				<h1 className="section__title" style={{ fontSize: '2.5rem' }}>
					🎉 Квиз завершен!
				</h1>
				<h2 className="section__subtitle" style={{ fontSize: '1.5rem' }}>
					{results.quiz_title}
				</h2>
				<p className="section__subtitle">
					Всего вопросов: <strong>{results.total_questions}</strong>
				</p>
			</div>

			{currentUserResult && (
				<div
					style={{
						background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
						borderRadius: '16px',
						padding: '2rem',
						marginBottom: '3rem',
						color: 'white',
						textAlign: 'center',
					}}
				>
					<h3 style={{ margin: '0 0 1rem 0', fontSize: '1.5rem' }}>
						Ваш результат
					</h3>
					<div style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '1rem' }}>
						{Math.round(currentUserResult.score)}%
					</div>
					<p style={{ margin: 0, fontSize: '1.2rem' }}>
						Правильных ответов: {currentUserResult.correct_answers} из{' '}
						{currentUserResult.total_questions}
					</p>
				</div>
			)}

			<div style={{ marginBottom: '3rem' }}>
				<h2 className="section__title" style={{ marginBottom: '2rem' }}>
					Результаты участников
				</h2>
				<ResponsiveContainer width="100%" height={400}>
					<BarChart data={barChartData}>
						<CartesianGrid strokeDasharray="3 3" />
						<XAxis dataKey="name" />
						<YAxis domain={[0, 100]} />
						<Tooltip
							formatter={(value: number, name: string) => {
								if (name === 'score') return [`${value}%`, 'Баллы'];
								if (name === 'correct')
									return [
										`${value} из ${barChartData.find((d) => d.correct === value)?.total}`,
										'Правильных',
									];
								return [value, name];
							}}
						/>
						<Legend />
						<Bar dataKey="score" fill="#667eea" name="Баллы (%)" />
					</BarChart>
				</ResponsiveContainer>
			</div>

			{pieChartData.length > 0 && (
				<div style={{ marginBottom: '3rem' }}>
					<h2 className="section__title" style={{ marginBottom: '2rem' }}>
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
									`${name}: ${(percent * 100).toFixed(0)}%`
								}
								outerRadius={100}
								fill="#8884d8"
								dataKey="count"
							>
								{pieChartData.map((entry, index) => (
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

			<div style={{ marginBottom: '3rem' }}>
				<h2 className="section__title" style={{ marginBottom: '2rem' }}>
					Таблица результатов
				</h2>
				<div
					style={{
						overflowX: 'auto',
						border: '1px solid #ddd',
						borderRadius: '8px',
					}}
				>
					<table
						style={{
							width: '100%',
							borderCollapse: 'collapse',
							background: 'white',
						}}
					>
						<thead>
							<tr style={{ background: '#f5f5f5' }}>
								<th style={{ padding: '1rem', textAlign: 'left' }}>Место</th>
								<th style={{ padding: '1rem', textAlign: 'left' }}>
									Участник
								</th>
								<th style={{ padding: '1rem', textAlign: 'center' }}>
									Правильных
								</th>
								<th style={{ padding: '1rem', textAlign: 'center' }}>
									Баллы
								</th>
							</tr>
						</thead>
						<tbody>
							{sortedParticipants.map((participant, index) => {
								const isCurrentUser =
									participant.user_id === Number(user?.id ?? 0);
								return (
									<tr
										key={participant.user_id}
										style={{
											background: isCurrentUser ? '#e3f2fd' : 'white',
											borderTop: '1px solid #eee',
										}}
									>
										<td style={{ padding: '1rem', fontWeight: 'bold' }}>
											{index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
										</td>
										<td style={{ padding: '1rem' }}>
											{participant.display_name}
											{isCurrentUser && (
												<span style={{ marginLeft: '0.5rem', color: '#667eea' }}>
													(Вы)
												</span>
											)}
										</td>
										<td style={{ padding: '1rem', textAlign: 'center' }}>
											{participant.correct_answers} / {participant.total_questions}
										</td>
										<td
											style={{
												padding: '1rem',
												textAlign: 'center',
												fontWeight: 'bold',
												fontSize: '1.1rem',
											}}
										>
											{Math.round(participant.score)}%
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>
			</div>

			<div className="section--center">
				<button
					type="button"
					className="primary-button"
					onClick={() => navigate('/home')}
					style={{ marginRight: '1rem' }}
				>
					Мои квизы
				</button>
				<button
					type="button"
					className="secondary-button"
					onClick={() => navigate('/')}
				>
					На главную
				</button>
			</div>
		</main>
	);
}

