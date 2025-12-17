import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { io, type Socket } from 'socket.io-client';
import { useAuth } from '../auth/AuthContext';
import { API_URL } from '../services/api';
import {
	getSessionByQuizId,
	type SessionInfoWithCreator,
	type SessionParticipant,
} from '../services/quizzes';

export function QuizRoomPage() {
	const { quizId } = useParams<{ quizId: string }>();
	const navigate = useNavigate();
	const { user, isAuthenticated } = useAuth();
	const [session, setSession] = useState<SessionInfoWithCreator | null>(null);
	const [participants, setParticipants] = useState<SessionParticipant[]>([]);
	const [isCreator, setIsCreator] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [socketStatus, setSocketStatus] = useState<
		'idle' | 'connecting' | 'joined' | 'error'
	>('idle');
	const [isStarting, setIsStarting] = useState(false);
	const [currentQuestion, setCurrentQuestion] = useState<{
		question_id: number;
		question_text: string;
		answers: Array<{ id: number; text: string }>;
		time_limit: number;
		question_number: number;
		total_questions: number;
	} | null>(null);
	const [quizStarted, setQuizStarted] = useState(false);
	const [answeredQuestionId, setAnsweredQuestionId] = useState<number | null>(null);
	const [timeLeft, setTimeLeft] = useState<number | null>(null);
	const [answeredCount, setAnsweredCount] = useState(0);
	const [totalParticipants, setTotalParticipants] = useState(0);
	const timerIntervalRef = useRef<number | null>(null);
	const socketRef = useRef<Socket | null>(null);
	const sessionIdRef = useRef<number | null>(null);

	useEffect(() => {
		if (!isAuthenticated) {
			navigate('/login', { replace: true });
			return;
		}

		if (!quizId) {
			navigate('/home', { replace: true });
			return;
		}

		const loadSession = async () => {
			try {
				const sessionData = await getSessionByQuizId(Number(quizId));
				setSession(sessionData);
				setParticipants(sessionData.participants || []);
				setTotalParticipants(sessionData.participants.length);
				setIsCreator(sessionData.creator_id === Number(user?.id ?? 0));

				// Подключаемся к комнате
				if (sessionData.room_code) {
					connectToRoom(sessionData.room_code, sessionData.id);
				}
			} catch (err) {
				const message =
					err instanceof Error
						? err.message
						: 'Не удалось загрузить комнату';
				setError(message);
			} finally {
				setIsLoading(false);
			}
		};

		void loadSession();

		return () => {
			if (timerIntervalRef.current) {
				clearInterval(timerIntervalRef.current);
			}
			socketRef.current?.disconnect();
		};
	}, [quizId, isAuthenticated, user, navigate]);

	const connectToRoom = (roomCode: string, sessionId: number) => {
		setSocketStatus('connecting');
		const socket = io(API_URL, { withCredentials: true });
		socketRef.current = socket;
		sessionIdRef.current = sessionId;

		socket.on('connect', () => {
			socket.emit('join_room', {
				room_code: roomCode,
				display_name: user?.name || 'Участник',
			});
		});

		socket.on('room_joined', async () => {
			setSocketStatus('joined');
			// Обновляем список участников
			try {
				const sessionData = await getSessionByQuizId(Number(quizId));
				setParticipants(sessionData.participants || []);
			} catch {
				// Игнорируем ошибки
			}
		});

		socket.on('room_join_error', (payload: { error?: string }) => {
			setSocketStatus('error');
			setError(payload?.error || 'Не удалось подключиться к комнате');
		});

		socket.on('connect_error', (err) => {
			setSocketStatus('error');
			setError(err.message || 'Ошибка соединения с сервером');
		});

		socket.on('participant_joined', async () => {
			// Обновляем список участников
			const currentSessionId = sessionIdRef.current;
			if (currentSessionId) {
				try {
					const sessionData = await getSessionByQuizId(Number(quizId));
					setParticipants(sessionData.participants || []);
					setTotalParticipants(sessionData.participants.length);
				} catch {
					// Игнорируем ошибки
				}
			}
		});

		socket.on('participant_left', async () => {
			// Обновляем список участников
			const currentSessionId = sessionIdRef.current;
			if (currentSessionId) {
				try {
					const sessionData = await getSessionByQuizId(Number(quizId));
					setParticipants(sessionData.participants || []);
					setTotalParticipants(sessionData.participants.length);
				} catch {
					// Игнорируем ошибки
				}
			}
		});

		socket.on('participant_answered', (payload: {
			display_name?: string;
			answered?: boolean;
			answered_count?: number;
			total_participants?: number;
		}) => {
			// Обновляем счетчик ответивших из payload
			if (payload.answered_count !== undefined) {
				setAnsweredCount(payload.answered_count);
			}
			if (payload.total_participants !== undefined) {
				setTotalParticipants(payload.total_participants);
			}
		});

		socket.on('quiz_started', () => {
			setQuizStarted(true);
			setIsStarting(false);
			// Обновляем статус сессии
			getSessionByQuizId(Number(quizId))
				.then((sessionData) => {
					setSession(sessionData);
				})
				.catch(() => {
					// Игнорируем ошибки
				});
		});

		socket.on('next_question', (payload: {
			question_id: number;
			question_text: string;
			answers: Array<{ id: number; text: string }>;
			time_limit: number;
			question_number: number;
			total_questions: number;
		}) => {
			setCurrentQuestion(payload);
			setQuizStarted(true);
			setAnsweredQuestionId(null); // Сбрасываем флаг ответа для нового вопроса
		});

		socket.on('question_timeout', () => {
			// Время на вопрос истекло, показываем результаты
			setCurrentQuestion(null);
			setTimeLeft(0);
			if (timerIntervalRef.current) {
				clearInterval(timerIntervalRef.current);
				timerIntervalRef.current = null;
			}
		});

		socket.on('quiz_finished', () => {
			// Квиз завершен, переходим на страницу результатов
			if (sessionIdRef.current) {
				navigate(`/results/${sessionIdRef.current}`, { replace: true });
			}
		});

		socket.on('answer_submitted', () => {
			// Ответ отправлен успешно
			// Можно показать подтверждение
		});

		socket.on('answer_error', (payload: { error?: string }) => {
			setError(payload?.error || 'Ошибка при отправке ответа');
		});

		socket.on('quiz_error', (payload: { error?: string }) => {
			setError(payload?.error || 'Ошибка при запуске квиза');
			setIsStarting(false);
		});

		socket.on('disconnect', () => {
			if (socketStatus !== 'error') {
				setSocketStatus('idle');
			}
		});
	};

	const handleStartQuiz = () => {
		if (!socketRef.current || !sessionIdRef.current) {
			setError('Нет подключения к комнате');
			return;
		}

		setIsStarting(true);
		setError(null);

		socketRef.current.emit('start_quiz', {
			session_id: sessionIdRef.current,
		});
	};

	if (!isAuthenticated || isLoading) {
		return (
			<main className="section section--center">
				<p>Загрузка...</p>
			</main>
		);
	}

	if (error && !session) {
		return (
			<main className="section section--center">
				<p className="error-text">{error}</p>
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

	if (!session) {
		return null;
	}

	// Если квиз начался и есть текущий вопрос, показываем его
	if (quizStarted && currentQuestion) {
		const timeLeftDisplay = timeLeft !== null ? timeLeft : currentQuestion.time_limit;
		const timePercentage = timeLeft !== null && currentQuestion.time_limit > 0
			? (timeLeft / currentQuestion.time_limit) * 100
			: 100;
		
		return (
			<main className="section section--center">
				<section className="auth-card">
					<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
						<h1 className="auth-title" style={{ margin: 0 }}>
							Вопрос {currentQuestion.question_number} из {currentQuestion.total_questions}
						</h1>
						<div style={{
							background: timeLeftDisplay <= 10 ? '#ff4444' : timeLeftDisplay <= 30 ? '#ffaa00' : '#667eea',
							color: 'white',
							padding: '0.5rem 1rem',
							borderRadius: '8px',
							fontSize: '1.2rem',
							fontWeight: 'bold',
							minWidth: '80px',
							textAlign: 'center',
						}}>
							{timeLeftDisplay}с
						</div>
					</div>
					
					{/* Прогресс-бар таймера */}
					<div style={{
						width: '100%',
						height: '8px',
						background: '#e0e0e0',
						borderRadius: '4px',
						marginBottom: '1rem',
						overflow: 'hidden',
					}}>
						<div style={{
							width: `${timePercentage}%`,
							height: '100%',
							background: timeLeftDisplay <= 10 ? '#ff4444' : timeLeftDisplay <= 30 ? '#ffaa00' : '#667eea',
							transition: 'width 1s linear, background 0.3s',
						}} />
					</div>
					
					{totalParticipants > 0 && (
						<p className="section__subtitle" style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>
							Ответили: {answeredCount} / {totalParticipants}
						</p>
					)}
					
					<p className="section__subtitle" style={{ fontSize: '1.2rem', marginBottom: '2rem' }}>
						{currentQuestion.question_text}
					</p>
					<div className="answers-list">
						{currentQuestion.answers.map((answer) => {
							const isAnswered = answeredQuestionId === currentQuestion.question_id;
							return (
								<button
									key={answer.id}
									type="button"
									className="primary-button"
									style={{
										marginBottom: '1rem',
										width: '100%',
										opacity: isAnswered ? 0.6 : 1,
										cursor: isAnswered ? 'not-allowed' : 'pointer',
									}}
									disabled={isAnswered}
									onClick={() => {
										// Отправляем ответ
										if (socketRef.current && sessionIdRef.current && !isAnswered) {
											socketRef.current.emit('submit_answer', {
												question_id: currentQuestion.question_id,
												answer_id: answer.id,
											});
											setAnsweredQuestionId(currentQuestion.question_id);
										}
									}}
								>
									{answer.text}
								</button>
							);
						})}
					</div>
					{answeredQuestionId === currentQuestion.question_id ? (
						<p className="section__subtitle" style={{ color: 'green' }}>
							Ответ отправлен! Ожидаем результатов...
						</p>
					) : null}
					<p className="section__subtitle">
						Время на ответ: {currentQuestion.time_limit} сек
					</p>
				</section>
			</main>
		);
	}

	// Если квиз начался, но вопроса еще нет - показываем ожидание
	if (quizStarted && !currentQuestion) {
		return (
			<main className="section section--center">
				<section className="auth-card">
					<h1 className="auth-title">Квиз начался</h1>
					<p className="section__subtitle">Ожидаем следующий вопрос...</p>
				</section>
			</main>
		);
	}

	// Обычный вид комнаты (до начала квиза)
	return (
		<main className="section section--center">
			<section className="auth-card">
				<h1 className="auth-title">Комната квиза</h1>
				{session.room_code ? (
					<div className="room-code">
						Код комнаты: <strong>{session.room_code}</strong>
					</div>
				) : null}
				<p className="section__subtitle">
					Статус: {session.status === 'waiting' ? 'Ожидание' : 'В процессе'}
				</p>
				<p className="section__subtitle">
					Подключение: {socketStatus === 'joined' ? 'Подключено' : socketStatus}
				</p>

				<div className="participants-section">
					<h2 className="section__title">Участники</h2>
					<p className="section__subtitle">
						Подключено: <strong>{participants.length}</strong>
					</p>
					{participants.length > 0 ? (
						<ul className="participants-list">
							{participants.map((p, idx) => (
								<li key={p.user_id || idx}>
									{p.display_name}
									{p.user_id === Number(user?.id ?? 0) ? ' (Вы)' : ''}
								</li>
							))}
						</ul>
					) : (
						<p className="section__subtitle">Пока нет участников</p>
					)}
				</div>

				{isCreator && socketStatus === 'joined' ? (
					<div className="creator-actions">
						{participants.length > 0 ? (
							<button
								type="button"
								className="primary-button"
								onClick={handleStartQuiz}
								disabled={isStarting || session.status !== 'waiting'}
							>
								{isStarting
									? 'Запускаем квиз...'
									: session.status === 'waiting'
										? 'Начать квиз'
										: 'Квиз уже запущен'}
							</button>
						) : (
							<p className="section__subtitle">
								Ожидаем участников...
							</p>
						)}
					</div>
				) : isCreator ? (
					<p className="section__subtitle">Подключаемся к комнате...</p>
				) : (
					<p className="section__subtitle">
						Ожидаем начала квиза...
					</p>
				)}

				{error ? <p className="error-text">{error}</p> : null}
			</section>
		</main>
	);
}

